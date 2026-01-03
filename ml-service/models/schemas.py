from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Delivery Time Prediction Models
class DeliveryTimePredictionRequest(BaseModel):
    origin_address: str
    destination_address: str
    weight_kg: float
    vehicle_capacity_kg: Optional[float] = None
    driver_id: Optional[str] = None
    hour_of_day: Optional[int] = None
    day_of_week: Optional[int] = None

class DeliveryTimePredictionResponse(BaseModel):
    predicted_hours: float
    confidence: float
    estimated_arrival: Optional[str] = None
    factors: dict

# Route Optimization Models
class RouteOptimizationRequest(BaseModel):
    shipment_ids: List[str]
    start_location: str
    vehicle_capacity_kg: float
    driver_id: Optional[str] = None

class RouteStop(BaseModel):
    shipment_id: str
    sequence: int
    location: str
    estimated_arrival: str
    distance_from_previous: float

class RouteOptimizationResponse(BaseModel):
    optimized_sequence: List[RouteStop]
    total_distance_km: float
    total_time_hours: float
    fuel_savings_percent: float

# Demand Forecasting Models
class DemandForecastRequest(BaseModel):
    forecast_days: int = 7
    region: Optional[str] = None

class DemandForecastResponse(BaseModel):
    forecasts: List[dict]  # [{date, predicted_shipments, confidence}]
    trend: str  # "increasing", "decreasing", "stable"
    recommendations: List[str]

# Driver Performance Models
class DriverPerformanceRequest(BaseModel):
    driver_id: str
    period_days: int = 30

class DriverPerformanceResponse(BaseModel):
    driver_id: str
    overall_score: float  # 0-10
    metrics: dict
    ranking: Optional[int] = None
    recommendations: List[str]

# Anomaly Detection Models
class AnomalyDetectionRequest(BaseModel):
    entity_type: str  # "shipment", "driver", "vehicle"
    entity_id: str
    check_type: str  # "delay", "fuel", "route_deviation"

class Anomaly(BaseModel):
    type: str
    severity: str  # "low", "medium", "high"
    description: str
    detected_at: str
    recommended_action: str

class AnomalyDetectionResponse(BaseModel):
    anomalies: List[Anomaly]
    is_anomalous: bool
    risk_score: float
