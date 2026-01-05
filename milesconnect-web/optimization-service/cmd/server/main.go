package main

import (
	"log"
	"milesconnect-optimization/internal/api"
	"net/http"
	"os"
)

// CORS middleware to allow cross-origin requests
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow requests from any origin (for development)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()

	// Register Handlers
	mux.HandleFunc("/optimize", api.OptimizeRouteHandler)          // Existing TSP
	mux.HandleFunc("/optimize-load", api.OptimizeLoadHandler)      // New Weight/Load Algo
	mux.HandleFunc("/optimize-india", api.OptimizeAllIndiaHandler) // GA All India
	mux.HandleFunc("/health", api.HealthHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	log.Printf("Starting Optimization Service on port %s", port)
	log.Printf("Enabled Solvers: TSP (Nearest Neighbor), FleetAlloc (Best Fit Decreasing)")
	log.Printf("CORS enabled for all origins")

	// Wrap with CORS middleware
	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		log.Fatal(err)
	}
}
