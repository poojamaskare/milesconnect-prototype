"""
Route Optimization Service
Solves the Traveling Salesman Problem for multi-stop deliveries
"""
import numpy as np
from typing import List, Dict, Any, Tuple
import itertools

class RouteOptimizer:
    def __init__(self):
        self.avg_speed_kmh = 60
        
    def optimize(self, stops: List[Dict[str, Any]], start_location: str) -> Dict[str, Any]:
        """
        Optimize route for multiple stops
        
        Args:
            stops: List of stops with location and shipment info
            start_location: Starting point
        
        Returns:
            Optimized route with sequence and metrics
        """
        if len(stops) == 0:
            return self._empty_route()
        
        if len(stops) == 1:
            return self._single_stop_route(stops[0], start_location)
        
        # For small number of stops, use brute force
        # For larger sets, use nearest neighbor heuristic
        if len(stops) <= 8:
            return self._brute_force_optimize(stops, start_location)
        else:
            return self._nearest_neighbor_optimize(stops, start_location)
    
    def _brute_force_optimize(self, stops: List[Dict], start_location: str) -> Dict:
        """Try all permutations for small sets"""
        best_route = None
        best_distance = float('inf')
        
        # Try all permutations
        for perm in itertools.permutations(stops):
            distance = self._calculate_total_distance(list(perm), start_location)
            if distance < best_distance:
                best_distance = distance
                best_route = list(perm)
        
        return self._format_route_response(best_route, start_location, best_distance)
    
    def _nearest_neighbor_optimize(self, stops: List[Dict], start_location: str) -> Dict:
        """Nearest neighbor heuristic for larger sets"""
        unvisited = stops.copy()
        route = []
        current_location = start_location
        total_distance = 0
        
        while unvisited:
            # Find nearest unvisited stop
            nearest = min(unvisited, key=lambda s: self._estimate_distance(
                current_location, s.get("location", "")
            ))
            
            distance = self._estimate_distance(current_location, nearest.get("location", ""))
            total_distance += distance
            
            route.append(nearest)
            unvisited.remove(nearest)
            current_location = nearest.get("location", "")
        
        return self._format_route_response(route, start_location, total_distance)
    
    def _calculate_total_distance(self, route: List[Dict], start: str) -> float:
        """Calculate total distance for a route"""
        total = 0
        current = start
        
        for stop in route:
            total += self._estimate_distance(current, stop.get("location", ""))
            current = stop.get("location", "")
        
        return total
    
    def _estimate_distance(self, loc1: str, loc2: str) -> float:
        """
        Estimate distance between two locations
        In production, use Google Maps Distance Matrix API
        For now, use simple heuristic based on string similarity
        """
        if loc1 == loc2:
            return 0
        
        # Simple hash-based distance estimation
        # In reality, you'd use geocoding + haversine or API
        hash1 = sum(ord(c) for c in loc1)
        hash2 = sum(ord(c) for c in loc2)
        
        # Random but consistent distance between 50-500 km
        distance = 50 + (abs(hash1 - hash2) % 450)
        return distance
    
    def _format_route_response(self, route: List[Dict], start: str, total_distance: float) -> Dict:
        """Format the optimized route response"""
        current_location = start
        current_time = 0
        optimized_stops = []
        
        for idx, stop in enumerate(route):
            distance_from_prev = self._estimate_distance(current_location, stop.get("location", ""))
            travel_time = distance_from_prev / self.avg_speed_kmh
            current_time += travel_time
            
            optimized_stops.append({
                "shipment_id": stop.get("shipment_id", ""),
                "sequence": idx + 1,
                "location": stop.get("location", ""),
                "estimated_arrival": f"+{current_time:.1f}h",
                "distance_from_previous": round(distance_from_prev, 2)
            })
            
            current_location = stop.get("location", "")
        
        total_time = total_distance / self.avg_speed_kmh
        
        # Calculate savings (compare to unoptimized route)
        unoptimized_distance = self._calculate_total_distance(route, start)
        savings = max(0, ((unoptimized_distance - total_distance) / unoptimized_distance) * 100)
        
        return {
            "optimized_sequence": optimized_stops,
            "total_distance_km": round(total_distance, 2),
            "total_time_hours": round(total_time, 2),
            "fuel_savings_percent": round(savings, 1)
        }
    
    def _empty_route(self) -> Dict:
        return {
            "optimized_sequence": [],
            "total_distance_km": 0,
            "total_time_hours": 0,
            "fuel_savings_percent": 0
        }
    
    def _single_stop_route(self, stop: Dict, start: str) -> Dict:
        distance = self._estimate_distance(start, stop.get("location", ""))
        time = distance / self.avg_speed_kmh
        
        return {
            "optimized_sequence": [{
                "shipment_id": stop.get("shipment_id", ""),
                "sequence": 1,
                "location": stop.get("location", ""),
                "estimated_arrival": f"+{time:.1f}h",
                "distance_from_previous": round(distance, 2)
            }],
            "total_distance_km": round(distance, 2),
            "total_time_hours": round(time, 2),
            "fuel_savings_percent": 0
        }

# Singleton instance
optimizer = RouteOptimizer()
