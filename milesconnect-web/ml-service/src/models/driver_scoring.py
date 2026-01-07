"""
Driver Scoring Model using XGBoost

Predicts driver performance score (0-100) based on:
- On-time delivery rate
- Fuel efficiency
- Safety metrics (harsh braking/acceleration)
- Customer satisfaction
- Experience level
"""

import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path


class DriverScoringModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'total_trips',
            'on_time_deliveries',
            'late_deliveries',
            'avg_speed_kmh',
            'harsh_braking_count',
            'harsh_acceleration_count',
            'idle_time_mins',
            'fuel_efficiency_kmpl',
            'distance_km',
            'experience_months',
            'incident_count',
            'customer_rating'
        ]
        
    def prepare_features(self, df):
        """Prepare features for model training/prediction"""
        X = df[self.feature_columns].copy()
        
        # Create derived features
        X['on_time_rate'] = X['on_time_deliveries'] / (X['total_trips'] + 1)
        X['harsh_events_per_trip'] = (X['harsh_braking_count'] + X['harsh_acceleration_count']) / (X['total_trips'] + 1)
        X['avg_idle_per_trip'] = X['idle_time_mins'] / (X['total_trips'] + 1)
        X['incidents_per_1000km'] = X['incident_count'] / (X['distance_km'] / 1000 + 1)
        
        return X
    
    def train(self, train_data_path):
        """Train the XGBoost model"""
        print("\n🚀 Training Driver Scoring Model...")
        
        # Load data
        df = pd.read_csv(train_data_path)
        print(f"✓ Loaded {len(df)} training samples")
        
        # Prepare features and target
        X = self.prepare_features(df)
        y = df['driver_score']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train XGBoost model
        self.model = XGBRegressor(
            objective='reg:squarederror',
            max_depth=6,
            learning_rate=0.1,
            n_estimators=100,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1
        )
        
        print("Training XGBoost regressor...")
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred_train = self.model.predict(X_train_scaled)
        y_pred_test = self.model.predict(X_test_scaled)
        
        train_mae = mean_absolute_error(y_train, y_pred_train)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
        test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
        
        print(f"\n📊 Model Performance:")
        print(f"   Train MAE: {train_mae:.2f} | Test MAE: {test_mae:.2f}")
        print(f"   Train R²:  {train_r2:.4f} | Test R²:  {test_r2:.4f}")
        print(f"   Train RMSE: {train_rmse:.2f} | Test RMSE: {test_rmse:.2f}")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': X.columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(f"\n🎯 Top 5 Important Features:")
        for idx, row in feature_importance.head(5).iterrows():
            print(f"   {row['feature']}: {row['importance']:.4f}")
        
        return {
            'train_mae': float(train_mae),
            'test_mae': float(test_mae),
            'train_r2': float(train_r2),
            'test_r2': float(test_r2),
            'train_rmse': float(train_rmse),
            'test_rmse': float(test_rmse),
            'feature_importance': feature_importance.to_dict('records')
        }
    
    def predict(self, driver_data):
        """Predict driver score for new data"""
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        # Convert to DataFrame if dict
        if isinstance(driver_data, dict):
            driver_data = pd.DataFrame([driver_data])
        
        # Prepare features
        X = self.prepare_features(driver_data)
        X_scaled = self.scaler.transform(X)
        
        # Predict
        scores = self.model.predict(X_scaled)
        
        # Clip to 0-100 range
        scores = np.clip(scores, 0, 100)
        
        return scores
    
    def save(self, model_dir):
        """Save model and scaler"""
        model_dir = Path(model_dir)
        model_dir.mkdir(parents=True, exist_ok=True)
        
        model_path = model_dir / "driver_scoring_model.joblib"
        scaler_path = model_dir / "driver_scoring_scaler.joblib"
        
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        
        print(f"✅ Model saved to {model_path}")
        print(f"✅ Scaler saved to {scaler_path}")
    
    def load(self, model_dir):
        """Load model and scaler"""
        model_dir = Path(model_dir)
        
        model_path = model_dir / "driver_scoring_model.joblib"
        scaler_path = model_dir / "driver_scoring_scaler.joblib"
        
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        
        print(f"✓ Model loaded from {model_path}")
        return self


if __name__ == "__main__":
    # Test the model
    model = DriverScoringModel()
    
    # Train
    data_path = Path(__file__).parent.parent.parent / "data" / "driver_performance.csv"
    metrics = model.train(data_path)
    
    # Save
    model_dir = Path(__file__).parent.parent.parent / "models"
    model.save(model_dir)
    
    # Test prediction
    test_driver = {
        'total_trips': 250,
        'on_time_deliveries': 220,
        'late_deliveries': 30,
        'avg_speed_kmh': 55.5,
        'harsh_braking_count': 12,
        'harsh_acceleration_count': 15,
        'idle_time_mins': 3500,
        'fuel_efficiency_kmpl': 14.5,
        'distance_km': 28000,
        'experience_months': 36,
        'incident_count': 1,
        'customer_rating': 4.5
    }
    
    score = model.predict(test_driver)[0]
    print(f"\n🧪 Test Prediction: Driver Score = {score:.2f}")
