"""
Fuel Anomaly Model using Isolation Forest

Detects anomalies in fuel consumption patterns to identify:
- Fuel theft
- Leakages
- Inefficient driving behaviors
- Sensor malfunctions
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path

class FuelAnomalyModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'distance_km',
            'fuel_consumed_liters',
            'load_weight_kg',
            'avg_speed_kmh',
            'idle_time_mins',
            'route_elevation_gain_m' # Gradient affects fuel
        ]
        
    def prepare_features(self, df):
        """Prepare features for model training/prediction"""
        X = df[self.feature_columns].copy()
        
        # Derived features
        X['consumption_rate'] = X['fuel_consumed_liters'] / (X['distance_km'] + 0.1)
        X['efficiency_load_factor'] = X['consumption_rate'] / (X['load_weight_kg'] + 1000)
        
        return X

    def train(self, train_data_path):
        """Train Isolation Forest"""
        print("\n🚀 Training Fuel Anomaly Model...")
        
        # Load data
        df = pd.read_csv(train_data_path)
        print(f"✓ Loaded {len(df)} training samples")
        
        # Prepare features
        X = self.prepare_features(df)
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Isolation Forest
        # contamination=0.05 means we expect ~5% anomalies in training data
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05, 
            random_state=42,
            n_jobs=-1
        )
        
        print("Training Isolation Forest...")
        self.model.fit(X_scaled)
        
        # Check detected anomalies in training set
        preds = self.model.predict(X_scaled)
        n_anomalies = (preds == -1).sum()
        print(f"✓ Detected {n_anomalies} anomalies in training data ({n_anomalies/len(df)*100:.1f}%)")
        
        return {'anomalies_detected': int(n_anomalies)}

    def predict(self, trip_data):
        """
        Predict if a trip has anomalous fuel consumption.
        Returns:
            is_anomaly: bool
            anomaly_score: float (lower is more anomalous)
            severity: str (low, medium, high)
        """
        if self.model is None:
            raise ValueError("Model not trained or loaded")
            
        if isinstance(trip_data, dict):
            trip_data = pd.DataFrame([trip_data])
            
        X = self.prepare_features(trip_data)
        X_scaled = self.scaler.transform(X)
        
        # Predict (-1 is anomaly, 1 is normal)
        pred = self.model.predict(X_scaled)[0]
        score = self.model.decision_function(X_scaled)[0]
        
        is_anomaly = (pred == -1)
        
        # Determine severity based on score deviation
        severity = "normal"
        if is_anomaly:
            if score < -0.2:
                severity = "high"
            elif score < -0.1:
                severity = "medium"
            else:
                severity = "low"
                
        return {
            'is_anomaly': bool(is_anomaly),
            'anomaly_score': float(score),
            'severity': severity
        }
        
    def save(self, model_dir):
        """Save model artifacts"""
        model_dir = Path(model_dir)
        model_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, model_dir / "fuel_anomaly_model.joblib")
        joblib.dump(self.scaler, model_dir / "fuel_anomaly_scaler.joblib")
        print(f"✅ Fuel Anomaly Model saved")

    def load(self, model_dir):
        """Load model artifacts"""
        model_dir = Path(model_dir)
        self.model = joblib.load(model_dir / "fuel_anomaly_model.joblib")
        self.scaler = joblib.load(model_dir / "fuel_anomaly_scaler.joblib")
        print(f"✓ Fuel Anomaly Model loaded")
        return self
