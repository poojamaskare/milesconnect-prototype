from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

# Import models and services
from models.schemas import (
    DeliveryTimePredictionRequest, DeliveryTimePredictionResponse,
    RouteOptimizationRequest, RouteOptimizationResponse,
    DemandForecastRequest, DemandForecastResponse,
    DriverPerformanceRequest, DriverPerformanceResponse,
    AnomalyDetectionRequest, AnomalyDetectionResponse
)
from services.delivery_prediction import predictor
from services.route_optimization import optimizer
from services.demand_forecasting import forecaster
from services.driver_performance import analyzer
from services.anomaly_detection import detector

app = FastAPI(
    title="MilesConnect ML Service",
    description="Machine Learning microservice for logistics optimization",
    version="1.0.0"
)

# CORS middleware to allow requests from Next.js frontend and Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ml-service",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "MilesConnect ML Service",
        "endpoints": {
            "health": "/health",
            "predict_delivery_time": "/api/predict/delivery-time",
            "optimize_route": "/api/optimize/route",
            "forecast_demand": "/api/forecast/demand",
            "analyze_driver": "/api/analyze/driver-performance",
            "detect_anomalies": "/api/detect/anomalies"
        }
    }

# ========== DELIVERY TIME PREDICTION ==========
@app.post("/api/predict/delivery-time", response_model=DeliveryTimePredictionResponse)
async def predict_delivery_time(request: DeliveryTimePredictionRequest):
    """
    Predict delivery time for a shipment
    """
    try:
        # Prepare features
        features = {
            "distance_km": 450,  # Placeholder - calculate from addresses
            "weight_kg": request.weight_kg,
            "capacity_ratio": request.weight_kg / (request.vehicle_capacity_kg or 10000),
            "hour_of_day": request.hour_of_day or 12,
            "day_of_week": request.day_of_week or 1,
            "driver_avg_speed": 60  # Placeholder - get from driver history
        }
        
        result = predictor.predict(features)
        
        return DeliveryTimePredictionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== ROUTE OPTIMIZATION ==========
@app.post("/api/optimize/route", response_model=RouteOptimizationResponse)
async def optimize_route(request: RouteOptimizationRequest):
    """
    Optimize delivery route for multiple shipments
    """
    try:
        # Prepare stops data (in production, fetch from database)
        stops = [
            {"shipment_id": sid, "location": f"Location {i+1}"}
            for i, sid in enumerate(request.shipment_ids)
        ]
        
        result = optimizer.optimize(stops, request.start_location)
        
        return RouteOptimizationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== DEMAND FORECASTING ==========
@app.post("/api/forecast/demand", response_model=DemandForecastResponse)
async def forecast_demand(request: DemandForecastRequest):
    """
    Forecast shipment demand for upcoming days
    """
    try:
        result = forecaster.forecast(
            days=request.forecast_days,
            region=request.region
        )
        
        return DemandForecastResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== DRIVER PERFORMANCE ANALYSIS ==========
@app.post("/api/analyze/driver-performance", response_model=DriverPerformanceResponse)
async def analyze_driver_performance(request: DriverPerformanceRequest):
    """
    Analyze driver performance and generate score
    """
    try:
        # In production, fetch driver data from database
        driver_data = {
            "driver_id": request.driver_id,
            "total_deliveries": 150,
            "on_time_deliveries": 135,
            "total_fuel_liters": 2500,
            "total_distance_km": 15000,
            "incidents": 1,
            "customer_ratings": [4.5, 4.8, 4.6, 4.7, 4.9]
        }
        
        result = analyzer.analyze(driver_data)
        
        return DriverPerformanceResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== ANOMALY DETECTION ==========
@app.post("/api/detect/anomalies", response_model=AnomalyDetectionResponse)
async def detect_anomalies(request: AnomalyDetectionRequest):
    """
    Detect anomalies in shipment, driver, or vehicle behavior
    """
    try:
        # In production, fetch relevant data from database
        data = {
            "estimated_hours": 12.0,
            "actual_hours": 18.5,
            "expected_fuel_liters": 80,
            "actual_fuel_liters": 110,
            "planned_distance_km": 450,
            "actual_distance_km": 520
        }
        
        result = detector.detect(
            entity_type=request.entity_type,
            entity_id=request.entity_id,
            check_type=request.check_type,
            data=data
        )
        
        return AnomalyDetectionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
