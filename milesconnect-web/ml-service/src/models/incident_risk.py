"""
Incident Risk Model using XGBoost

Predicts the risk score (0-100) of an incident occurring on a route.
"""

import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path

class IncidentRiskModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'weather_condition_score', # 0=clear, 100=storm
            'traffic_density', # 0-100
            'road_quality_score', # 0-100 (poor to good)
            'driver_fatigue_score', # Simulated based on hours driven
            'vehicle_maintenance_score', # 0-100 (poor to good)
            'route_historical_accident_rate',
            'time_of_day_risk', # 0-1 (night/rush hour higher)
        ]
        
    def prepare_features(self, df):
        """Prepare features for model training/prediction"""
        X = df[self.feature_columns].copy()
        
        # Derived risk factors
        X['fatigue_traffic_interaction'] = X['driver_fatigue_score'] * X['traffic_density']
        X['weather_road_interaction'] = X['weather_condition_score'] * (100 - X['road_quality_score'])
        
        return X

    def train(self, train_data_path):
        """Train the XGBoost Regressor"""
        print("\n🚀 Training Incident Risk Model...")
        
        # Load data
        df = pd.read_csv(train_data_path)
        print(f"✓ Loaded {len(df)} training samples")
        
        # Prepare features and target
        X = self.prepare_features(df)
        y = df['incident_risk_score']
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train
        self.model = XGBRegressor(
            objective='reg:squarederror',
            n_estimators=150,
            learning_rate=0.08,
            max_depth=4,
            random_state=42,
            n_jobs=-1
        )
        
        print("Training XGBoost regressor...")
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"\n📊 Model Performance:")
        print(f"   MSE: {mse:.4f}")
        print(f"   R2: {r2:.4f}")
        
        return {'mse': float(mse), 'r2': float(r2)}

    def predict(self, input_data):
        """Predict risk score"""
        if self.model is None:
            raise ValueError("Model not trained or loaded")
            
        if isinstance(input_data, dict):
            input_data = pd.DataFrame([input_data])
            
        X = self.prepare_features(input_data)
        X_scaled = self.scaler.transform(X)
        
        score = self.model.predict(X_scaled)[0]
        return max(0, min(100, float(score))) # Clip to 0-100
        
    def save(self, model_dir):
        """Save model artifacts"""
        model_dir = Path(model_dir)
        model_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, model_dir / "incident_risk_model.joblib")
        joblib.dump(self.scaler, model_dir / "incident_risk_scaler.joblib")
        print(f"✅ Incident Risk Model saved")

    def load(self, model_dir):
        """Load model artifacts"""
        model_dir = Path(model_dir)
        self.model = joblib.load(model_dir / "incident_risk_model.joblib")
        self.scaler = joblib.load(model_dir / "incident_risk_scaler.joblib")
        print(f"✓ Incident Risk Model loaded")
        return self
