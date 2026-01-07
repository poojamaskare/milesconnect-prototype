# MilesConnect ML Service

Machine Learning service for predictive analytics, driver scoring, and maintenance predictions.

## Features

- **Driver Scoring**: XGBoost-based performance scoring (0-100)
- **Predictive Maintenance**: Vehicle maintenance risk prediction
- **Demand Forecasting**: Shipment volume forecasting
- **Delivery Analytics**: On-time delivery and delay pattern analysis

## Setup

### Install Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Train Models

```bash
python src/training/train_models.py
```

### Run Service

```bash
uvicorn src.api.app:app --reload --port 8000
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/ml/driver-score` - Calculate driver performance score
- `POST /api/ml/maintenance-prediction` - Predict maintenance needs
- `POST /api/ml/demand-forecast` - Forecast shipment demand
- `GET /api/ml/analytics/delivery-performance` - Delivery performance metrics
- `GET /api/ml/analytics/fleet-utilization` - Fleet utilization analysis

## Project Structure

```
ml-service/
├── data/                   # Training data
├── models/                 # Trained model files
├── notebooks/             # Jupyter notebooks
├── src/
│   ├── api/               # FastAPI application
│   ├── models/            # ML model implementations
│   ├── training/          # Model training scripts
│   └── data_generator.py  # Synthetic data generation
├── requirements.txt
└── README.md
```
