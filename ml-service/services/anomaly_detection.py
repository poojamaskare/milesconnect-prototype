"""
Anomaly Detection Service
Detects unusual patterns in shipments, drivers, and vehicles
"""
from datetime import datetime
from typing import List, Dict, Any
import numpy as np

class AnomalyDetector:
    def __init__(self):
        # Thresholds for anomaly detection
        self.delay_threshold_hours = 4
        self.fuel_efficiency_threshold = 0.3  # 30% deviation
        self.route_deviation_threshold_km = 50
    
    def detect(self, entity_type: str, entity_id: str, check_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect anomalies in entity behavior
        
        Args:
            entity_type: "shipment", "driver", or "vehicle"
            entity_id: ID of the entity
            check_type: Type of check to perform
            data: Relevant data for anomaly detection
        
        Returns:
            Anomaly detection results
        """
        anomalies = []
        
        if check_type == "delay":
            anomalies.extend(self._detect_delay_anomalies(data))
        elif check_type == "fuel":
            anomalies.extend(self._detect_fuel_anomalies(data))
        elif check_type == "route_deviation":
            anomalies.extend(self._detect_route_anomalies(data))
        elif check_type == "all":
            anomalies.extend(self._detect_delay_anomalies(data))
            anomalies.extend(self._detect_fuel_anomalies(data))
            anomalies.extend(self._detect_route_anomalies(data))
        
        # Calculate overall risk score
        risk_score = self._calculate_risk_score(anomalies)
        
        return {
            "anomalies": anomalies,
            "is_anomalous": len(anomalies) > 0,
            "risk_score": risk_score
        }
    
    def _detect_delay_anomalies(self, data: Dict[str, Any]) -> List[Dict]:
        """Detect unusual delays"""
        anomalies = []
        
        estimated_hours = data.get("estimated_hours", 0)
        actual_hours = data.get("actual_hours", 0)
        
        if actual_hours > estimated_hours + self.delay_threshold_hours:
            delay_hours = actual_hours - estimated_hours
            severity = "high" if delay_hours > 8 else "medium" if delay_hours > 4 else "low"
            
            anomalies.append({
                "type": "significant_delay",
                "severity": severity,
                "description": f"Delivery delayed by {delay_hours:.1f} hours (expected: {estimated_hours:.1f}h, actual: {actual_hours:.1f}h)",
                "detected_at": datetime.now().isoformat(),
                "recommended_action": "Investigate cause of delay and notify customer"
            })
        
        return anomalies
    
    def _detect_fuel_anomalies(self, data: Dict[str, Any]) -> List[Dict]:
        """Detect unusual fuel consumption"""
        anomalies = []
        
        expected_fuel = data.get("expected_fuel_liters", 0)
        actual_fuel = data.get("actual_fuel_liters", 0)
        
        if actual_fuel > 0 and expected_fuel > 0:
            deviation = abs(actual_fuel - expected_fuel) / expected_fuel
            
            if deviation > self.fuel_efficiency_threshold:
                severity = "high" if deviation > 0.5 else "medium"
                
                anomalies.append({
                    "type": "fuel_consumption_anomaly",
                    "severity": severity,
                    "description": f"Fuel consumption {deviation*100:.1f}% {'higher' if actual_fuel > expected_fuel else 'lower'} than expected",
                    "detected_at": datetime.now().isoformat(),
                    "recommended_action": "Check vehicle for maintenance issues or driver behavior"
                })
        
        return anomalies
    
    def _detect_route_anomalies(self, data: Dict[str, Any]) -> List[Dict]:
        """Detect route deviations"""
        anomalies = []
        
        planned_distance = data.get("planned_distance_km", 0)
        actual_distance = data.get("actual_distance_km", 0)
        
        if actual_distance > planned_distance + self.route_deviation_threshold_km:
            deviation_km = actual_distance - planned_distance
            severity = "high" if deviation_km > 100 else "medium"
            
            anomalies.append({
                "type": "route_deviation",
                "severity": severity,
                "description": f"Route deviated by {deviation_km:.1f} km from planned route",
                "detected_at": datetime.now().isoformat(),
                "recommended_action": "Review GPS logs and verify route taken"
            })
        
        return anomalies
    
    def _calculate_risk_score(self, anomalies: List[Dict]) -> float:
        """Calculate overall risk score based on anomalies"""
        if not anomalies:
            return 0.0
        
        severity_scores = {
            "low": 0.3,
            "medium": 0.6,
            "high": 1.0
        }
        
        total_score = sum(severity_scores.get(a["severity"], 0.5) for a in anomalies)
        # Normalize to 0-1 scale, cap at 1.0
        risk_score = min(1.0, total_score / 3)
        
        return round(risk_score, 2)

# Singleton instance
detector = AnomalyDetector()
