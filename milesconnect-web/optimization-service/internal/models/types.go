package models

// Location represents a geographic point
type Location struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type NamedLocation struct {
	Name string  `json:"name"`
	Lat  float64 `json:"lat"`
	Lng  float64 `json:"lng"`
}

// OptimizationRequest is the input for Route Optimization (TSP)
type OptimizationRequest struct {
	Start     Location   `json:"start"`
	End       Location   `json:"end"`
	Waypoints []Location `json:"waypoints"`
}

// OptimizationResponse is the output for Route Optimization
type OptimizationResponse struct {
	Route       []Location `json:"route"`
	TotalDistKm float64    `json:"total_distance_km"`
}

// LoadRequest represents inputs for Load/Weight Optimization
type LoadRequest struct {
	Vehicles  []VehicleInfo  `json:"vehicles"`
	Shipments []ShipmentInfo `json:"shipments"`
}

type VehicleInfo struct {
	ID          string  `json:"id"`
	CapacityKg  float64 `json:"capacity_kg"`
	CurrentLoad float64 `json:"current_load"` // 0 if empty
}

type ShipmentInfo struct {
	ID       string  `json:"id"`
	WeightKg float64 `json:"weight_kg"`
}

// LoadResponse represents the result of the allocation
type LoadResponse struct {
	Allocations []Allocation `json:"allocations"`
	Unassigned  []string     `json:"unassigned_shipment_ids"`
}

type Allocation struct {
	VehicleID      string   `json:"vehicle_id"`
	ShipmentIDs    []string `json:"shipment_ids"`
	TotalWeight    float64  `json:"total_weight"`
	UtilizationPct float64  `json:"utilization_pct"`
}
