"""
Training Script for all ML Models

Generates synthetic data and trains all models:
1. Driver Scoring Model
2. Predictive Maintenance Model
3. Demand Forecasting Model
"""

import sys
from pathlib import Path

# Add parent directory to path  
sys.path.append(str(Path(__file__).parent.parent))

from data_generator import SyntheticDataGenerator
from models.driver_scoring import DriverScoringModel
from models.maintenance_prediction import MaintenancePredictionModel
from models.demand_forecast import DemandForecastModel


def main():
    print("=" * 60)
    print("MilesConnect ML Model Training Pipeline")
    print("=" * 60)
    
    # Setup paths
    data_dir = Path(__file__).parent.parent.parent / "data"
    model_dir = Path(__file__).parent.parent.parent / "models"
    
    # Step 1: Generate synthetic data
    print("\n📦 Step 1: Generating Synthetic Training Data")
    print("-" * 60)
    generator = SyntheticDataGenerator()
    generator.generate_all()
    
    # Step 2: Train Driver Scoring Model
    print("\n" + "=" * 60)
    print("📦 Step 2: Training Driver Scoring Model")
    print("-" * 60)
    driver_model = DriverScoringModel()
    driver_metrics = driver_model.train(data_dir / "driver_performance.csv")
    driver_model.save(model_dir)
    
    # Step 3: Train Predictive Maintenance Model
    print("\n" + "=" * 60)
    print("📦 Step 3: Training Predictive Maintenance Model")
    print("-" * 60)
    maintenance_model = MaintenancePredictionModel()
    maintenance_metrics = maintenance_model.train(data_dir / "vehicle_maintenance.csv")
    maintenance_model.save(model_dir)
    
    # Step 4: Train Demand Forecasting Model
    print("\n" + "=" * 60)
    print("📦 Step 4: Training Demand Forecasting Model")
    print("-" * 60)
    demand_model = DemandForecastModel()
    demand_metrics = demand_model.train(data_dir / "demand_forecast.csv")
    demand_model.save(model_dir)
    
    # Summary
    print("\n" + "=" * 60)
    print("✅ All Models Trained Successfully!")
    print("=" * 60)
    print(f"\n📊 Performance Summary:")
    print(f"\n1. Driver Scoring Model:")
    print(f"   - Test R²: {driver_metrics['test_r2']:.4f}")
    print(f"   - Test MAE: {driver_metrics['test_mae']:.2f}")
    
    print(f"\n2. Predictive Maintenance Model:")
    print(f"   - Test Accuracy: {maintenance_metrics['test_accuracy']:.4f}")
    
    print(f"\n3. Demand Forecasting Model:")
    print(f"   - Test R²: {demand_metrics['test_r2']:.4f}")
    print(f"   - Test MAPE: {demand_metrics['test_mape']:.2f}%")
    
    print(f"\n💾 Models saved to: {model_dir}")
    print("\n🚀 Ready to deploy ML service!")


if __name__ == "__main__":
    main()
