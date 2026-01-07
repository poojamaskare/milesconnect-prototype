package solver

import (
	"math"
	"milesconnect-optimization/internal/models"
)

// SolveTSPNearestNeighbor solves the TSP using the Nearest Neighbor heuristic
func SolveTSPNearestNeighbor(req models.OptimizationRequest) models.OptimizationResponse {
	// 1. Start at 'Start'
	current := req.Start
	route := []models.Location{current}
	visited := make([]bool, len(req.Waypoints))
	totalDist := 0.0

	count := len(req.Waypoints)
	for i := 0; i < count; i++ {
		nearestIdx := -1
		minDist := math.MaxFloat64

		for j, wp := range req.Waypoints {
			if !visited[j] {
				dist := haversine(current, wp)
				if dist < minDist {
					minDist = dist
					nearestIdx = j
				}
			}
		}

		if nearestIdx != -1 {
			visited[nearestIdx] = true
			current = req.Waypoints[nearestIdx]
			route = append(route, current)
			totalDist += minDist
		}
	}

	// 2. Finally go to 'End'
	finalLeg := haversine(current, req.End)
	route = append(route, req.End)
	totalDist += finalLeg

	return models.OptimizationResponse{
		Route:       route,
		TotalDistKm: totalDist,
	}
}

// haversine calculates distance between two points in km
func haversine(p1, p2 models.Location) float64 {
	const R = 6371 // Earth radius in km
	dLat := (p2.Lat - p1.Lat) * (math.Pi / 180.0)
	dLon := (p2.Lng - p1.Lng) * (math.Pi / 180.0)

	lat1 := p1.Lat * (math.Pi / 180.0)
	lat2 := p2.Lat * (math.Pi / 180.0)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Sin(dLon/2)*math.Sin(dLon/2)*math.Cos(lat1)*math.Cos(lat2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}
