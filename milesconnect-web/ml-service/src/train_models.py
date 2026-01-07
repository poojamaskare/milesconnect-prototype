"""
Train all ML models using generated synthetic data.
"""

import sys
from pathlib import Path
import pandas as pd

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from models.driver_scoring import DriverScoringModel
from models.maintenance_prediction import MaintenancePredictionModel
from models.demand_forecast import DemandForecastModel
from models.delay_prediction import DelayPredictionModel
from models.incident_risk import IncidentRiskModel
from models.fuel_anomaly import FuelAnomalyModel
from models.driver_clustering import DriverClusteringModel
from models.eta_prediction import ETAPredictionModel

def train_all():
    print("🚀 Starting training pipeline for all models...\n")
    
    data_dir = Path(__file__).parent.parent / "data"
    model_dir = Path(__file__).parent.parent / "models"
    model_dir.mkdir(exist_ok=True)

    # 1. Driver Scoring
    try:
        print("--- Driver Scoring ---")
        model = DriverScoringModel()
        model.train(data_dir / "driver_performance.csv")
        model.save(model_dir)
    except Exception as e:
        print(f"❌ Failed to train Driver Scoring: {e}")

    # 2. Maintenance Prediction
    try:
        print("\n--- Maintenance Prediction ---")
        model = MaintenancePredictionModel()
        model.train(data_dir / "vehicle_maintenance.csv")
        model.save(model_dir)
    except Exception as e:
        print(f"❌ Failed to train Maintenance Prediction: {e}")

    # 3. Demand Forecast
    try:
        print("\n--- Demand Forecast ---")
        model = DemandForecastModel()
        model.train(data_dir / "demand_forecast.csv")
        model.save(model_dir)
    except Exception as e:
        print(f"❌ Failed to train Demand Forecast: {e}")

    # 4. Delay Prediction
    try:
        print("\n--- Delay Prediction ---")
        model = DelayPredictionModel()
        model.train(data_dir / "delay_prediction.csv")
        model.save(model_dir)
    except Exception as e:
        print(f"❌ Failed to train Delay Prediction: {e}")

    # 5. Incident Risk
    try:
        print("\n--- Incident Risk ---")
        model = IncidentRiskModel()
        model.train(data_dir / "incident_risk.csv")
        model.save(model_dir)
    except Exception as e:
        print(f"❌ Failed to train Incident Risk: {e}")

    # 6. Fuel Anomaly
    try:
        print("\n--- Fuel Anomaly ---")
        model = FuelAnomalyModel()
        model.train(data_dir / "fuel_anomaly.csv")
        model.save(model_dir)
    except Exception as e:
        print(f"❌ Failed to train Fuel Anomaly: {e}")

    # 7. Driver Clustering
    try:
        print("\n--- Driver Clustering ---")
        model = DriverClusteringModel()
        model.train(data_dir / "driver_clustering.csv")
        model.save(model_dir)
    except Exception as e:
        print(f"❌ Failed to train Driver Clustering: {e}")

    # 8. ETA Prediction
    try:
        print("\n--- ETA Prediction ---")
        model = ETAPredictionModel()
        model.train(data_dir / "eta_prediction.csv")
        model.save(model_dir)
    except Exception as e:
        print(f"❌ Failed to train ETA Prediction: {e}")

    print("\n✅ Training Pipeline Completed!")

if __name__ == "__main__":
    train_all()
