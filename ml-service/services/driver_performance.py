"""
Driver Performance Analysis Service
Analyzes driver performance and provides scoring
"""
from typing import Dict, Any, List
import numpy as np

class DriverPerformanceAnalyzer:
    def __init__(self):
        self.weights = {
            "on_time_rate": 0.35,
            "fuel_efficiency": 0.25,
            "safety_score": 0.20,
            "customer_rating": 0.15,
            "completion_rate": 0.05
        }
    
    def analyze(self, driver_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze driver performance and generate score
        
        Args:
            driver_data: Dictionary with driver metrics
        
        Returns:
            Performance analysis with score and recommendations
        """
        # Extract metrics (with defaults)
        total_deliveries = driver_data.get("total_deliveries", 0)
        on_time_deliveries = driver_data.get("on_time_deliveries", 0)
        total_fuel_liters = driver_data.get("total_fuel_liters", 100)
        total_distance_km = driver_data.get("total_distance_km", 1000)
        incidents = driver_data.get("incidents", 0)
        customer_ratings = driver_data.get("customer_ratings", [4.5])
        
        # Calculate individual metrics
        metrics = {}
        
        # 1. On-time delivery rate (0-10)
        on_time_rate = (on_time_deliveries / max(1, total_deliveries)) if total_deliveries > 0 else 0.8
        metrics["on_time_rate"] = round(on_time_rate * 10, 2)
        
        # 2. Fuel efficiency (km per liter) - normalized to 0-10
        fuel_efficiency = total_distance_km / max(1, total_fuel_liters)
        # Assume 3-8 km/L is normal range, map to 0-10
        fuel_score = min(10, max(0, (fuel_efficiency - 3) / 5 * 10))
        metrics["fuel_efficiency"] = round(fuel_score, 2)
        
        # 3. Safety score (based on incidents)
        # Fewer incidents = higher score
        safety_score = max(0, 10 - (incidents * 2))
        metrics["safety_score"] = round(safety_score, 2)
        
        # 4. Customer rating (0-10 scale)
        avg_rating = np.mean(customer_ratings) if customer_ratings else 4.0
        customer_score = (avg_rating / 5) * 10
        metrics["customer_rating"] = round(customer_score, 2)
        
        # 5. Completion rate
        completion_rate = 0.95  # Placeholder
        metrics["completion_rate"] = round(completion_rate * 10, 2)
        
        # Calculate weighted overall score
        overall_score = sum(
            metrics[key] * self.weights[key]
            for key in self.weights.keys()
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(metrics, overall_score)
        
        # Determine ranking (mock - in production, compare with all drivers)
        ranking = self._estimate_ranking(overall_score)
        
        return {
            "driver_id": driver_data.get("driver_id", "unknown"),
            "overall_score": round(overall_score, 2),
            "metrics": metrics,
            "ranking": ranking,
            "recommendations": recommendations
        }
    
    def _generate_recommendations(self, metrics: Dict[str, float], overall_score: float) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        if overall_score >= 8.5:
            recommendations.append("⭐ Excellent performance! Consider for mentorship role")
        elif overall_score >= 7.0:
            recommendations.append("✅ Good performance - keep up the great work")
        else:
            recommendations.append("📚 Performance improvement opportunities identified")
        
        # Specific recommendations based on weak areas
        if metrics["on_time_rate"] < 7.0:
            recommendations.append("⏰ Focus on improving on-time delivery rate")
        
        if metrics["fuel_efficiency"] < 6.0:
            recommendations.append("⛽ Attend fuel-efficient driving training")
        
        if metrics["safety_score"] < 8.0:
            recommendations.append("🛡️ Review safety protocols and defensive driving techniques")
        
        if metrics["customer_rating"] < 7.0:
            recommendations.append("🤝 Improve customer communication and service quality")
        
        return recommendations
    
    def _estimate_ranking(self, score: float) -> int:
        """Estimate ranking based on score (mock implementation)"""
        # In production, query database for actual ranking
        if score >= 9.0:
            return np.random.randint(1, 5)
        elif score >= 8.0:
            return np.random.randint(5, 15)
        elif score >= 7.0:
            return np.random.randint(15, 30)
        else:
            return np.random.randint(30, 50)

# Singleton instance
analyzer = DriverPerformanceAnalyzer()
