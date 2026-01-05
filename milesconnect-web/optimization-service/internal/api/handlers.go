package api

import (
	"encoding/json"
	"milesconnect-optimization/internal/data"
	"milesconnect-optimization/internal/models"
	"milesconnect-optimization/internal/solver"
	"milesconnect-optimization/internal/solver/genetic"
	"net/http"
)

func OptimizeRouteHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.OptimizationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	resp := solver.SolveTSPNearestNeighbor(req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func OptimizeLoadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.LoadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validation: Ensure valid weights
	for _, s := range req.Shipments {
		if s.WeightKg <= 0 {
			http.Error(w, "Shipment weight must be positive", http.StatusBadRequest)
			return
		}
	}

	resp := solver.OptimizeFleetAllocation(req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func OptimizeAllIndiaHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 1. Get All India Data
	locations := data.GetAllIndiaLocations()
	start := locations[0]      // Delhi
	end := locations[0]        // Round trip
	waypoints := locations[1:] // All other cities

	req := models.OptimizationRequest{
		Start:     start,
		End:       end,
		Waypoints: waypoints,
	}

	// 2. Solve using Genetic Algorithm
	resp := genetic.SolveTSPGenetic(req)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
