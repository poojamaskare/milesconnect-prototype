# MilesConnect ML Service

Machine Learning microservice for logistics optimization.

## Features

1. **Delivery Time Prediction** - AI-powered ETA estimates
2. **Route Optimization** - Smart routing to minimize distance and time
3. **Demand Forecasting** - Predict future shipment volumes
4. **Driver Performance Analysis** - ML-based driver scoring
5. **Anomaly Detection** - Identify unusual patterns and issues

## Setup

### Prerequisites
- Python 3.11+
- pip

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

The service will start on `http://localhost:8000`

### Docker

```bash
# Build image
docker build -t milesconnect-ml .

# Run container
docker run -p 8000:8000 milesconnect-ml
```

## API Endpoints

### Health Check
```
GET /health
```

### Delivery Time Prediction
```
POST /api/predict/delivery-time
{
  "origin_address": "Mumbai, Maharashtra",
  "destination_address": "Delhi, Delhi",
  "weight_kg": 5000,
  "vehicle_capacity_kg": 10000
}
```

### Route Optimization
```
POST /api/optimize/route
{
  "shipment_ids": ["id1", "id2", "id3"],
  "start_location": "Mumbai Warehouse",
  "vehicle_capacity_kg": 10000
}
```

### Demand Forecasting
```
POST /api/forecast/demand
{
  "forecast_days": 7,
  "region": "Maharashtra"
}
```

### Driver Performance Analysis
```
POST /api/analyze/driver-performance
{
  "driver_id": "driver-uuid",
  "period_days": 30
}
```

### Anomaly Detection
```
POST /api/detect/anomalies
{
  "entity_type": "shipment",
  "entity_id": "shipment-uuid",
  "check_type": "all"
}
```

## API Documentation

Interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Architecture

```
ml-service/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker configuration
├── models/
│   ├── __init__.py
│   └── schemas.py         # Pydantic models
└── services/
    ├── __init__.py
    ├── delivery_prediction.py
    ├── route_optimization.py
    ├── demand_forecasting.py
    ├── driver_performance.py
    └── anomaly_detection.py
```

## Development

The current implementation uses rule-based algorithms. For production:
1. Collect historical data
2. Train ML models (TensorFlow, scikit-learn)
3. Replace rule-based logic with trained models
4. Implement model versioning and A/B testing
