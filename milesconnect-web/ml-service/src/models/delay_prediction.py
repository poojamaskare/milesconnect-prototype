"""
Delay Prediction Model using XGBoost

Predicts the probability and severity of shipment delays based on:
- Route characteristics (distance, stops)
- Traffic conditions (simulated)
- Weather conditions (simulated)
- Historical route performance
- Time of day/week
"""

import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
from pathlib import Path

class DelayPredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_columns = [
            'total_distance_km',
            'num_stops',
            'traffic_density_score',  # 0-100
            'weather_severity_score', # 0-100
            'historical_route_avg_delay_mins',
            'departure_hour',
            'is_weekend',
            'vehicle_age_years'
        ]
        self.classes = ['on_time', 'minor_delay', 'major_delay'] # <15m, 15-60m, >60m
        
    def prepare_features(self, df):
        """Prepare features for model training/prediction"""
        X = df[self.feature_columns].copy()
        
        # Derived features
        X['distance_per_stop'] = X['total_distance_km'] / (X['num_stops'] + 1)
        X['complexity_score'] = (X['traffic_density_score'] + X['weather_severity_score']) * X['num_stops']
        
        return X

    def train(self, train_data_path):
        """Train the XGBoost classifier"""
        print("\n🚀 Training Delay Prediction Model...")
        
        # Load data
        df = pd.read_csv(train_data_path)
        print(f"✓ Loaded {len(df)} training samples")
        
        # Prepare features and target
        X = self.prepare_features(df)
        y = self.label_encoder.fit_transform(df['delay_class'])
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train XGBoost
        self.model = XGBClassifier(
            objective='multi:softprob',
            n_estimators=200,
            learning_rate=0.05,
            max_depth=5,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1
        )
        
        print("Training XGBoost classifier...")
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        acc = accuracy_score(y_test, y_pred)
        
        print(f"\n📊 Model Performance:")
        print(f"   Accuracy: {acc:.4f}")
        print("\n📈 Classification Report:")
        print(classification_report(y_test, y_pred, target_names=self.label_encoder.classes_))
        
        return {'accuracy': float(acc)}

    def predict(self, route_data):
        """Predict delay class and probability"""
        if self.model is None:
            raise ValueError("Model not trained or loaded")
            
        if isinstance(route_data, dict):
            route_data = pd.DataFrame([route_data])
            
        X = self.prepare_features(route_data)
        X_scaled = self.scaler.transform(X)
        
        probs = self.model.predict_proba(X_scaled)[0]
        pred_idx = np.argmax(probs)
        pred_class = self.label_encoder.inverse_transform([pred_idx])[0]
        
        return {
            'predicted_class': pred_class,
            'confidence': float(probs[pred_idx]),
            'probabilities': {
                cls: float(prob) 
                for cls, prob in zip(self.label_encoder.classes_, probs)
            }
        }
        
    def save(self, model_dir):
        """Save model artifacts"""
        model_dir = Path(model_dir)
        model_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, model_dir / "delay_prediction_model.joblib")
        joblib.dump(self.scaler, model_dir / "delay_prediction_scaler.joblib")
        joblib.dump(self.label_encoder, model_dir / "delay_prediction_encoder.joblib")
        print(f"✅ Delay Prediction Model saved")

    def load(self, model_dir):
        """Load model artifacts"""
        model_dir = Path(model_dir)
        self.model = joblib.load(model_dir / "delay_prediction_model.joblib")
        self.scaler = joblib.load(model_dir / "delay_prediction_scaler.joblib")
        self.label_encoder = joblib.load(model_dir / "delay_prediction_encoder.joblib")
        print(f"✓ Delay Prediction Model loaded")
        return self
