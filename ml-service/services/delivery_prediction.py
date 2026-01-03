"""
Delivery Time Prediction Service
Uses historical data and current conditions to predict delivery times
"""
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any

class DeliveryTimePredictor:
    def __init__(self):
        # In a real implementation, this would load a trained model
        # For now, we'll use rule-based predictions
        self.base_speed_kmh = 60  # Average speed
        self.traffic_factors = {
            "morning_rush": 0.7,  # 7-9 AM
            "evening_rush": 0.6,  # 5-8 PM
            "night": 1.2,  # 10 PM - 6 AM
            "normal": 1.0
        }
        
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict delivery time based on features
        
        Args:
            features: Dictionary containing:
                - distance_km: Distance in kilometers
                - weight_kg: Shipment weight
                - capacity_ratio: weight / vehicle_capacity
                - hour_of_day: Hour (0-23)
                - day_of_week: Day (0-6, Monday=0)
                - driver_avg_speed: Driver's average speed (optional)
        
        Returns:
            Dictionary with prediction results
        """
        distance_km = features.get("distance_km", 0)
        weight_kg = features.get("weight_kg", 0)
        capacity_ratio = features.get("capacity_ratio", 0.5)
        hour_of_day = features.get("hour_of_day", datetime.now().hour)
        day_of_week = features.get("day_of_week", datetime.now().weekday())
        driver_speed = features.get("driver_avg_speed", self.base_speed_kmh)
        
        # Calculate traffic factor based on time
        traffic_factor = self._get_traffic_factor(hour_of_day)
        
        # Calculate weight factor (heavier loads = slower)
        weight_factor = 1.0 - (capacity_ratio * 0.2)  # Up to 20% slower when full
        
        # Calculate weekend factor (less traffic on weekends)
        weekend_factor = 1.1 if day_of_week >= 5 else 1.0
        
        # Effective speed
        effective_speed = driver_speed * traffic_factor * weight_factor * weekend_factor
        
        # Calculate time
        predicted_hours = distance_km / effective_speed
        
        # Add buffer for loading/unloading (30 min per 1000kg)
        loading_time_hours = (weight_kg / 1000) * 0.5
        total_hours = predicted_hours + loading_time_hours
        
        # Calculate confidence (higher for typical scenarios)
        confidence = self._calculate_confidence(features)
        
        # Calculate estimated arrival
        estimated_arrival = datetime.now() + timedelta(hours=total_hours)
        
        return {
            "predicted_hours": round(total_hours, 2),
            "confidence": round(confidence, 2),
            "estimated_arrival": estimated_arrival.isoformat(),
            "factors": {
                "base_travel_hours": round(predicted_hours, 2),
                "loading_time_hours": round(loading_time_hours, 2),
                "traffic_factor": round(traffic_factor, 2),
                "weight_factor": round(weight_factor, 2),
                "effective_speed_kmh": round(effective_speed, 2)
            }
        }
    
    def _get_traffic_factor(self, hour: int) -> float:
        """Get traffic factor based on hour of day"""
        if 7 <= hour < 9:
            return self.traffic_factors["morning_rush"]
        elif 17 <= hour < 20:
            return self.traffic_factors["evening_rush"]
        elif hour >= 22 or hour < 6:
            return self.traffic_factors["night"]
        else:
            return self.traffic_factors["normal"]
    
    def _calculate_confidence(self, features: Dict[str, Any]) -> float:
        """
        Calculate prediction confidence
        Higher confidence for typical scenarios
        """
        base_confidence = 0.75
        
        # Reduce confidence for extreme values
        distance_km = features.get("distance_km", 0)
        if distance_km > 1000:  # Very long distance
            base_confidence -= 0.1
        
        capacity_ratio = features.get("capacity_ratio", 0.5)
        if capacity_ratio > 0.9:  # Nearly full capacity
            base_confidence -= 0.05
        
        return max(0.5, min(0.95, base_confidence))

# Singleton instance
predictor = DeliveryTimePredictor()
