"""
ETA Prediction Model using XGBoost

Predicts the Estimated Time of Arrival (in minutes) based on:
- Distance
- Real-time traffic data (simulated)
- Historical speed data
- Time of day / Day of week
- Vehicle type/capacity
"""

import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path

class ETAPredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'distance_km',
            'base_duration_mins', # Google Maps baseline
            'traffic_density_score', # 0-100
            'weather_factor', # 1.0 = good, 1.5 = bad
            'hour_of_day',
            'is_weekend',
            'urban_density_score' # 0=highway, 100=city center
        ]
        
    def prepare_features(self, df):
        """Prepare features for model training/prediction"""
        X = df[self.feature_columns].copy()
        
        # Derived features
        X['expected_speed_kmh'] = X['distance_km'] / (X['base_duration_mins'] / 60 + 0.01)
        X['traffic_impact'] = X['traffic_density_score'] * X['urban_density_score']
        X['rush_hour_factor'] = (
            ((X['hour_of_day'] >= 7) & (X['hour_of_day'] <= 9)) | 
            ((X['hour_of_day'] >= 16) & (X['hour_of_day'] <= 18))
        ).astype(int) * X['urban_density_score']
        
        return X

    def train(self, train_data_path):
        """Train XGBoost Regressor"""
        print("\n🚀 Training ETA Prediction Model...")
        
        # Load data
        df = pd.read_csv(train_data_path)
        print(f"✓ Loaded {len(df)} trips")
        
        # Prepare features and target
        X = self.prepare_features(df)
        y = df['actual_duration_mins']
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train
        self.model = XGBRegressor(
            objective='reg:squarederror',
            n_estimators=200,
            learning_rate=0.05,
            max_depth=6,
            random_state=42,
            n_jobs=-1
        )
        
        print("Training XGBoost regressor...")
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # MAPE
        mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
        
        print(f"\n📊 Model Performance:")
        print(f"   MAE: {mae:.2f} mins")
        print(f"   MAPE: {mape:.2f}%")
        print(f"   R2: {r2:.4f}")
        
        return {'mae': float(mae), 'mape': float(mape)}

    def predict(self, trip_data):
        """Predict ETA in minutes"""
        if self.model is None:
            raise ValueError("Model not trained or loaded")
            
        if isinstance(trip_data, dict):
            trip_data = pd.DataFrame([trip_data])
            
        X = self.prepare_features(trip_data)
        X_scaled = self.scaler.transform(X)
        
        prediction = self.model.predict(X_scaled)[0]
        return max(0, float(prediction)) # Ensure non-negative
        
    def save(self, model_dir):
        """Save model artifacts"""
        model_dir = Path(model_dir)
        model_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, model_dir / "eta_prediction_model.joblib")
        joblib.dump(self.scaler, model_dir / "eta_prediction_scaler.joblib")
        print(f"✅ ETA Prediction Model saved")

    def load(self, model_dir):
        """Load model artifacts"""
        model_dir = Path(model_dir)
        self.model = joblib.load(model_dir / "eta_prediction_model.joblib")
        self.scaler = joblib.load(model_dir / "eta_prediction_scaler.joblib")
        print(f"✓ ETA Prediction Model loaded")
        return self
