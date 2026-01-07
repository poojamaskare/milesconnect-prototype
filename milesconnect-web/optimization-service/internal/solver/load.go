package solver

import (
	"math"
	"milesconnect-optimization/internal/models"
	"sort"
)

// OptimizeFleetAllocation solves the fleet assignment problem using Best Fit Decreasing
func OptimizeFleetAllocation(req models.LoadRequest) models.LoadResponse {
	// 1. Sort shipments by weight (Descending) - heavier items first are harder to place
	shipments := make([]models.ShipmentInfo, len(req.Shipments))
	copy(shipments, req.Shipments)
	sort.Slice(shipments, func(i, j int) bool {
		return shipments[i].WeightKg > shipments[j].WeightKg
	})

	// Initialize vehicles
	// We create a map to track current state
	type VehicleState struct {
		Info     models.VehicleInfo
		LoadedKg float64
		Assigned []string
	}

	vStates := make([]*VehicleState, len(req.Vehicles))
	for i, v := range req.Vehicles {
		vStates[i] = &VehicleState{
			Info:     v,
			LoadedKg: v.CurrentLoad,
			Assigned: []string{},
		}
	}

	var unassigned []string

	// 2. Iterate through shipments and find Best Fit vehicle
	for _, s := range shipments {
		bestIdx := -1
		minRemaining := math.MaxFloat64

		for i, v := range vStates {
			remaining := v.Info.CapacityKg - (v.LoadedKg + s.WeightKg)

			// If it fits and is tighter fit than current best
			if remaining >= 0 && remaining < minRemaining {
				minRemaining = remaining
				bestIdx = i
			}
		}

		if bestIdx != -1 {
			// Assign to vehicle
			vStates[bestIdx].LoadedKg += s.WeightKg
			vStates[bestIdx].Assigned = append(vStates[bestIdx].Assigned, s.ID)
		} else {
			// Cannot fit anywhere
			unassigned = append(unassigned, s.ID)
		}
	}

	// 3. Construct response
	allocations := []models.Allocation{}
	for _, v := range vStates {
		if len(v.Assigned) > 0 {
			utilization := (v.LoadedKg / v.Info.CapacityKg) * 100
			allocations = append(allocations, models.Allocation{
				VehicleID:      v.Info.ID,
				ShipmentIDs:    v.Assigned,
				TotalWeight:    v.LoadedKg,
				UtilizationPct: math.Round(utilization*100) / 100,
			})
		}
	}

	return models.LoadResponse{
		Allocations: allocations,
		Unassigned:  unassigned,
	}
}
