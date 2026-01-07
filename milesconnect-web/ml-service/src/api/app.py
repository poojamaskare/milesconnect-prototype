"""
FastAPI ML Service

Provides REST API endpoints for ML predictions:
- Driver performance scoring
- Predictive maintenance
- Demand forecasting
- Delivery performance analytics
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
from pathlib import Path
import sys


# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from models.driver_scoring import DriverScoringModel
from models.maintenance_prediction import MaintenancePredictionModel
from models.demand_forecast import DemandForecastModel
from models.delay_prediction import DelayPredictionModel
from models.incident_risk import IncidentRiskModel
from models.fuel_anomaly import FuelAnomalyModel
from models.driver_clustering import DriverClusteringModel
from models.eta_prediction import ETAPredictionModel

# Initialize FastAPI app
app = FastAPI(
    title="MilesConnect ML Service",
    description="Machine Learning service for predictive analytics in logistics",
    version="1.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML models
model_dir = Path(__file__).parent.parent.parent / "models"
driver_model = DriverScoringModel()
maintenance_model = MaintenancePredictionModel()
demand_model = DemandForecastModel()
delay_model = DelayPredictionModel()
risk_model = IncidentRiskModel()
fuel_model = FuelAnomalyModel()
cluster_model = DriverClusteringModel()
eta_model = ETAPredictionModel()

# Try to load models
models_status = {}

def load_model(obj, name):
    try:
        obj.load(model_dir)
        print(f"✓ {name} loaded")
        models_status[name] = True
    except Exception as e:
        print(f"⚠ {name} not loaded: {e}")
        models_status[name] = False

load_model(driver_model, "driver_scoring")
load_model(maintenance_model, "maintenance_prediction")
load_model(demand_model, "demand_forecast")
load_model(delay_model, "delay_prediction")
load_model(risk_model, "incident_risk")
load_model(fuel_model, "fuel_anomaly")
load_model(cluster_model, "driver_clustering")
load_model(eta_model, "eta_prediction")


# Pydantic models for request/response
class DriverData(BaseModel):
    driver_id: Optional[str] = None
    total_trips: int
    on_time_deliveries: int
    late_deliveries: int
    avg_speed_kmh: float
    harsh_braking_count: int
    harsh_acceleration_count: int
    idle_time_mins: float
    fuel_efficiency_kmpl: float
    distance_km: float
    experience_months: int
    incident_count: int
    customer_rating: float

class DriverScoreResponse(BaseModel):
    driver_id: Optional[str]
    score: float
    metrics: Dict[str, float]

class VehicleData(BaseModel):
    vehicle_id: Optional[str] = None
    age_months: int
    odometer_km: int
    days_since_last_maintenance: int
    total_trips: int
    avg_trip_distance_km: float
    harsh_usage_score: float
    fuel_consumption_variance: float
    reported_issues_count: int

class MaintenancePredictionResponse(BaseModel):
    vehicle_id: Optional[str]
    predicted_class: str
    confidence: float
    days_until_maintenance: int
    class_probabilities: Dict[str, float]

class DemandForecastData(BaseModel):
    day_of_week: int
    month: int
    is_holiday: bool
    historical_shipments_7d: int
    historical_shipments_30d: int
    avg_shipment_weight_kg: float
    active_vehicles_count: int
    seasonal_index: float

class DemandForecastResponse(BaseModel):
    predicted_shipments: int
    forecast_7d: Optional[List[Dict[str, int]]] = None

# New Pydantic Models
class RouteData(BaseModel):
    total_distance_km: float
    num_stops: int
    traffic_density_score: float
    weather_severity_score: float
    historical_route_avg_delay_mins: float
    departure_hour: int
    is_weekend: int
    vehicle_age_years: int

class DelayPredictionResponse(BaseModel):
    predicted_class: str
    confidence: float
    probabilities: Dict[str, float]

class RiskInputData(BaseModel):
    weather_condition_score: float
    traffic_density: float
    road_quality_score: float
    driver_fatigue_score: float
    vehicle_maintenance_score: float
    route_historical_accident_rate: float
    time_of_day_risk: float

class RiskResponse(BaseModel):
    risk_score: float

class FuelData(BaseModel):
    distance_km: float
    fuel_consumed_liters: float
    load_weight_kg: float
    avg_speed_kmh: float
    idle_time_mins: float
    route_elevation_gain_m: float

class FuelAnomalyResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    severity: str

class DriverClusterData(BaseModel):
    avg_speed_kmh: float
    harsh_acceleration_count_per_100km: float
    harsh_braking_count_per_100km: float
    idling_ratio: float
    night_driving_ratio: float
    average_trip_distance_km: float

class DriverClusterResponse(BaseModel):
    cluster_id: int
    cluster_name: str
    centroid_distance: float

class TripData(BaseModel):
    distance_km: float
    base_duration_mins: float
    traffic_density_score: float
    weather_factor: float
    hour_of_day: int
    is_weekend: int
    urban_density_score: float

class ETAResponse(BaseModel):
    predicted_duration_mins: float


# API Endpoints

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "MilesConnect ML Service",
        "models": models_status
    }


@app.post("/api/ml/driver-score", response_model=DriverScoreResponse)
async def calculate_driver_score(data: DriverData):
    """Calculate driver performance score"""
    try:
        if driver_model.model is None:
            raise HTTPException(status_code=503, detail="Driver scoring model not available")
        
        driver_dict = data.dict()
        score = driver_model.predict(driver_dict)[0]
        
        on_time_rate = data.on_time_deliveries / (data.total_trips + 1)
        safety_events = data.harsh_braking_count + data.harsh_acceleration_count
        safety_score = max(0, 100 - (safety_events / (data.total_trips + 1)) * 50)
        
        return DriverScoreResponse(
            driver_id=data.driver_id,
            score=round(score, 2),
            metrics={
                "on_time_delivery_rate": round(on_time_rate * 100, 2),
                "fuel_efficiency_kmpl": round(data.fuel_efficiency_kmpl, 2),
                "safety_score": round(safety_score, 2),
                "customer_rating": round(data.customer_rating, 2),
                "experience_months": data.experience_months
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/maintenance-prediction", response_model=MaintenancePredictionResponse)
async def predict_maintenance(data: VehicleData):
    """Predict vehicle maintenance needs"""
    try:
        if maintenance_model.model is None:
            raise HTTPException(status_code=503, detail="Maintenance prediction model not available")
        
        vehicle_dict = data.dict()
        result = maintenance_model.predict(vehicle_dict)[0]
        
        return MaintenancePredictionResponse(
            vehicle_id=data.vehicle_id,
            predicted_class=result['predicted_class'],
            confidence=round(result['confidence'], 4),
            days_until_maintenance=result['days_until_maintenance'],
            class_probabilities=result['class_probabilities']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/demand-forecast", response_model=DemandForecastResponse)
async def forecast_demand(data: DemandForecastData):
    """Forecast shipment demand"""
    try:
        if demand_model.model is None:
            raise HTTPException(status_code=503, detail="Demand forecast model not available")
        
        forecast_dict = data.dict()
        prediction = demand_model.predict(forecast_dict)[0]
        forecast_7d = demand_model.forecast_next_n_days(forecast_dict, n_days=7)
        
        return DemandForecastResponse(
            predicted_shipments=int(prediction),
            forecast_7d=forecast_7d
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# New Endpoints

@app.post("/api/ml/predict-delay", response_model=DelayPredictionResponse)
async def predict_delay(data: RouteData):
    try:
        if delay_model.model is None:
            raise HTTPException(status_code=503, detail="Delay prediction model not available")
        result = delay_model.predict(data.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/incident-risk", response_model=RiskResponse)
async def predict_incident_risk(data: RiskInputData):
    try:
        if risk_model.model is None:
            raise HTTPException(status_code=503, detail="Incident risk model not available")
        score = risk_model.predict(data.dict())
        return {"risk_score": score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/fuel-anomaly", response_model=FuelAnomalyResponse)
async def detect_fuel_anomaly(data: FuelData):
    try:
        if fuel_model.model is None:
            raise HTTPException(status_code=503, detail="Fuel anomaly model not available")
        result = fuel_model.predict(data.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/driver-clustering", response_model=DriverClusterResponse)
async def cluster_driver(data: DriverClusterData):
    try:
        if cluster_model.model is None:
             raise HTTPException(status_code=503, detail="Driver clustering model not available")
        result = cluster_model.predict(data.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/predict-eta", response_model=ETAResponse)
async def predict_eta(data: TripData):
    try:
         if eta_model.model is None:
            raise HTTPException(status_code=503, detail="ETA prediction model not available")
         eta = eta_model.predict(data.dict())
         return {"predicted_duration_mins": eta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ml/driver-score/batch")
async def calculate_driver_scores_batch(drivers: List[DriverData]):
    """Calculate scores for multiple drivers"""
    try:
        if driver_model.model is None:
            raise HTTPException(status_code=503, detail="Driver scoring model not available")
        
        results = []
        for driver in drivers:
            score = driver_model.predict(driver.dict())[0]
            on_time_rate = driver.on_time_deliveries / (driver.total_trips + 1)
            safety_events = driver.harsh_braking_count + driver.harsh_acceleration_count
            safety_score = max(0, 100 - (safety_events / (driver.total_trips + 1)) * 50)
            
            results.append({
                "driver_id": driver.driver_id,
                "score": round(score, 2),
                "metrics": {
                    "on_time_delivery_rate": round(on_time_rate * 100, 2),
                    "fuel_efficiency_kmpl": round(driver.fuel_efficiency_kmpl, 2),
                    "safety_score": round(safety_score, 2),
                    "customer_rating": round(driver.customer_rating, 2)
                }
            })
        
        # Sort by score descending
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return {"drivers": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Run server
if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
