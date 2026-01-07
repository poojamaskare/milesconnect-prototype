package genetic

import (
	"math"
	"math/rand"
	"milesconnect-optimization/internal/models"
	"sort"
	"time"
)

type Tour struct {
	Path     []int
	Distance float64
}

type Population struct {
	Tours []Tour
}

// Params for the GA
const (
	PopulationSize = 100
	Generations    = 500
	MutationRate   = 0.05
	TournamentSize = 5
)

// SolveTSPGenetic runs the genetic algorithm to solve TSP
func SolveTSPGenetic(req models.OptimizationRequest) models.OptimizationResponse {
	rand.Seed(time.Now().UnixNano())

	// Combine Start, Waypoints, End into a single list of points for the GA to optimize (excluding start/end fixed positions if we want closed loop,
	// but here we treat it as Open TSP: Start -> [Visit All] -> End)
	// Actually, for standard TSP, we want to optimize the order of waypoints.
	// Start and End are fixed.

	waypoints := req.Waypoints
	n := len(waypoints)
	if n == 0 {
		return models.OptimizationResponse{
			Route:       []models.Location{req.Start, req.End},
			TotalDistKm: haversine(req.Start, req.End),
		}
	}

	// Initialize Population
	// Each individual is a permutation of indices 0 to n-1 (representing waypoints)
	pop := initializePopulation(n, PopulationSize)

	// Evaluate initial fitness
	evaluatePopulation(pop, req.Start, req.End, waypoints)

	// Evolution Loop
	for g := 0; g < Generations; g++ {
		newTours := make([]Tour, 0, PopulationSize)

		// Elitism: Keep the best one
		newTours = append(newTours, pop.Tours[0])

		for len(newTours) < PopulationSize {
			// Selection
			p1 := tournamentSelection(pop)
			p2 := tournamentSelection(pop)

			// Crossover
			childPath := orderedCrossover(p1.Path, p2.Path)

			// Mutation
			if rand.Float64() < MutationRate {
				mutate(childPath)
			}

			newTours = append(newTours, Tour{Path: childPath})
		}

		pop.Tours = newTours
		evaluatePopulation(pop, req.Start, req.End, waypoints)
	}

	// Best tour is at index 0 (sorted)
	bestTour := pop.Tours[0]

	// Construct Result
	optimizedRoute := make([]models.Location, 0, n+2)
	optimizedRoute = append(optimizedRoute, req.Start)
	for _, idx := range bestTour.Path {
		optimizedRoute = append(optimizedRoute, waypoints[idx])
	}
	optimizedRoute = append(optimizedRoute, req.End)

	return models.OptimizationResponse{
		Route:       optimizedRoute,
		TotalDistKm: bestTour.Distance,
	}
}

func initializePopulation(n int, size int) *Population {
	pop := &Population{Tours: make([]Tour, size)}
	base := make([]int, n)
	for i := 0; i < n; i++ {
		base[i] = i
	}

	for i := 0; i < size; i++ {
		perm := make([]int, n)
		copy(perm, base)
		rand.Shuffle(n, func(i, j int) { perm[i], perm[j] = perm[j], perm[i] })
		pop.Tours[i] = Tour{Path: perm}
	}
	return pop
}

func evaluatePopulation(pop *Population, start, end models.Location, waypoints []models.Location) {
	for i := range pop.Tours {
		pop.Tours[i].Distance = calculateDistance(pop.Tours[i].Path, start, end, waypoints)
	}
	// Sort by distance (asc)
	sort.Slice(pop.Tours, func(i, j int) bool {
		return pop.Tours[i].Distance < pop.Tours[j].Distance
	})
}

func calculateDistance(path []int, start, end models.Location, waypoints []models.Location) float64 {
	dist := 0.0
	current := start

	for _, idx := range path {
		next := waypoints[idx]
		dist += haversine(current, next)
		current = next
	}

	dist += haversine(current, end)
	return dist
}

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

func tournamentSelection(pop *Population) Tour {
	best := pop.Tours[rand.Intn(len(pop.Tours))]
	for i := 0; i < TournamentSize; i++ {
		contestant := pop.Tours[rand.Intn(len(pop.Tours))]
		if contestant.Distance < best.Distance {
			best = contestant
		}
	}
	return best
}

// Ordered Crossover (OX1)
func orderedCrossover(p1, p2 []int) []int {
	size := len(p1)
	start := rand.Intn(size)
	end := rand.Intn(size)
	if start > end {
		start, end = end, start
	}

	child := make([]int, size)
	for i := range child {
		child[i] = -1
	}

	// Copy sub-segment from p1
	for i := start; i <= end; i++ {
		child[i] = p1[i]
	}

	// Fill remaining from p2
	curr := (end + 1) % size
	p2Idx := (end + 1) % size

	for i := 0; i < size; i++ { // max iterations
		if child[curr] == -1 {
			// Find next valid gene from p2
			for contains(child, p2[p2Idx]) {
				p2Idx = (p2Idx + 1) % size
			}
			child[curr] = p2[p2Idx]
			curr = (curr + 1) % size
		}
		if isFull(child) {
			break
		}
	}
	return child
}

func mutate(path []int) {
	i := rand.Intn(len(path))
	j := rand.Intn(len(path))
	path[i], path[j] = path[j], path[i]
}

func contains(slice []int, val int) bool {
	for _, item := range slice {
		if item == val {
			return true
		}
	}
	return false
}

func isFull(slice []int) bool {
	for _, v := range slice {
		if v == -1 {
			return false
		}
	}
	return true
}
