"""
Demand Forecasting Service
Predicts future shipment volumes based on historical patterns
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any
import numpy as np

class DemandForecaster:
    def __init__(self):
        # Historical patterns (in production, load from database)
        self.baseline_daily_shipments = 25
        self.weekly_pattern = [0.9, 1.0, 1.1, 1.0, 1.2, 0.7, 0.6]  # Mon-Sun multipliers
        
    def forecast(self, days: int = 7, region: str = None) -> Dict[str, Any]:
        """
        Forecast shipment demand for upcoming days
        
        Args:
            days: Number of days to forecast
            region: Optional region filter
        
        Returns:
            Forecast data with predictions and trend
        """
        forecasts = []
        current_date = datetime.now()
        
        for i in range(days):
            forecast_date = current_date + timedelta(days=i)
            day_of_week = forecast_date.weekday()
            
            # Base prediction with weekly pattern
            base_prediction = self.baseline_daily_shipments * self.weekly_pattern[day_of_week]
            
            # Add some randomness for realism
            noise = np.random.normal(0, 2)
            predicted = max(0, base_prediction + noise)
            
            # Confidence decreases with forecast horizon
            confidence = max(0.5, 0.9 - (i * 0.05))
            
            forecasts.append({
                "date": forecast_date.strftime("%Y-%m-%d"),
                "predicted_shipments": round(predicted, 1),
                "confidence": round(confidence, 2),
                "day_of_week": forecast_date.strftime("%A")
            })
        
        # Determine trend
        trend = self._calculate_trend(forecasts)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(forecasts, trend)
        
        return {
            "forecasts": forecasts,
            "trend": trend,
            "recommendations": recommendations
        }
    
    def _calculate_trend(self, forecasts: List[Dict]) -> str:
        """Determine if demand is increasing, decreasing, or stable"""
        if len(forecasts) < 3:
            return "stable"
        
        first_half = np.mean([f["predicted_shipments"] for f in forecasts[:len(forecasts)//2]])
        second_half = np.mean([f["predicted_shipments"] for f in forecasts[len(forecasts)//2:]])
        
        diff_percent = ((second_half - first_half) / first_half) * 100
        
        if diff_percent > 10:
            return "increasing"
        elif diff_percent < -10:
            return "decreasing"
        else:
            return "stable"
    
    def _generate_recommendations(self, forecasts: List[Dict], trend: str) -> List[str]:
        """Generate actionable recommendations based on forecast"""
        recommendations = []
        
        # Find peak days
        peak_days = sorted(forecasts, key=lambda x: x["predicted_shipments"], reverse=True)[:2]
        peak_day_names = [d["day_of_week"] for d in peak_days]
        
        if trend == "increasing":
            recommendations.append(f"📈 Demand trending up - consider increasing driver availability")
            recommendations.append(f"Peak days expected: {', '.join(peak_day_names)}")
        elif trend == "decreasing":
            recommendations.append(f"📉 Demand trending down - optimize resource allocation")
        else:
            recommendations.append(f"📊 Stable demand - maintain current resource levels")
        
        # Weekend recommendations
        weekend_avg = np.mean([f["predicted_shipments"] for f in forecasts if f["day_of_week"] in ["Saturday", "Sunday"]])
        weekday_avg = np.mean([f["predicted_shipments"] for f in forecasts if f["day_of_week"] not in ["Saturday", "Sunday"]])
        
        if weekend_avg < weekday_avg * 0.7:
            recommendations.append("🔧 Schedule maintenance and training on weekends")
        
        return recommendations

# Singleton instance
forecaster = DemandForecaster()
