"""
Demand Forecasting Model using XGBoost

Predicts shipment volume for future periods based on:
- Historical trends
- Seasonal patterns
- Day-of-week effects
- Holiday impact
"""

import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split, TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path
from datetime import datetime, timedelta


class DemandForecastModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'day_of_week',
            'month',
            'is_holiday',
            'historical_shipments_7d',
            'historical_shipments_30d',
            'avg_shipment_weight_kg',
            'active_vehicles_count',
            'seasonal_index'
        ]
        
    def prepare_features(self, df):
        """Prepare features for model training/prediction"""
        X = df[self.feature_columns].copy()
        
        # Cyclical encoding for day_of_week and month
        X['dow_sin'] = np.sin(2 * np.pi * X['day_of_week'] / 7)
        X['dow_cos'] = np.cos(2 * np.pi * X['day_of_week'] / 7)
        X['month_sin'] = np.sin(2 * np.pi * X['month'] / 12)
        X['month_cos'] = np.cos(2 * np.pi * X['month'] / 12)
        
        # Growth trend features
        X['shipments_7d_to_30d_ratio'] = X['historical_shipments_7d'] / (X['historical_shipments_30d'] + 1)
        X['is_weekend'] = (X['day_of_week'] >= 5).astype(int)
        X['is_quarter_end'] = X['month'].isin([3, 6, 9, 12]).astype(int)
        
        return X
    
    def train(self, train_data_path):
        """Train the XGBoost model for demand forecasting"""
        print("\n🚀 Training Demand Forecasting Model...")
        
        # Load data
        df = pd.read_csv(train_data_path)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        print(f"✓ Loaded {len(df)} days of historical data")
        
        # Prepare features and target
        X = self.prepare_features(df)
        y = df['shipments']
        
        # Time series split (80/20)
        split_idx = int(len(df) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        print(f"✓ Train: {len(X_train)} days | Test: {len(X_test)} days")
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train XGBoost model
        self.model = XGBRegressor(
            objective='reg:squarederror',
            max_depth=4,
            learning_rate=0.05,
            n_estimators=200,
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
        train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
        test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
        train_r2 = r2_score(y_train, y_pred_train)
        test_r2 = r2_score(y_test, y_pred_test)
        
        # MAPE (Mean Absolute Percentage Error)
        train_mape = np.mean(np.abs((y_train - y_pred_train) / (y_train + 1))) * 100
        test_mape = np.mean(np.abs((y_test - y_pred_test) / (y_test + 1))) * 100
        
        print(f"\n📊 Model Performance:")
        print(f"   Train MAE: {train_mae:.2f} | Test MAE: {test_mae:.2f}")
        print(f"   Train RMSE: {train_rmse:.2f} | Test RMSE: {test_rmse:.2f}")
        print(f"   Train R²: {train_r2:.4f} | Test R²: {test_r2:.4f}")
        print(f"   Train MAPE: {train_mape:.2f}% | Test MAPE: {test_mape:.2f}%")
        
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
            'train_rmse': float(train_rmse),
            'test_rmse': float(test_rmse),
            'train_r2': float(train_r2),
            'test_r2': float(test_r2),
            'train_mape': float(train_mape),
            'test_mape': float(test_mape),
            'feature_importance': feature_importance.to_dict('records')
        }
    
    def predict(self, forecast_data):
        """Predict shipment demand"""
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        # Convert to DataFrame if dict
        if isinstance(forecast_data, dict):
            forecast_data = pd.DataFrame([forecast_data])
        
        # Prepare features
        X = self.prepare_features(forecast_data)
        X_scaled = self.scaler.transform(X)
        
        # Predict
        predictions = self.model.predict(X_scaled)
        
        # Ensure non-negative
        predictions = np.maximum(0, predictions)
        
        return predictions
    
    def forecast_next_n_days(self, last_known_data, n_days=7):
        """Forecast for next N days given last known data point"""
        forecasts = []
        current_data = last_known_data.copy()
        
        for day in range(n_days):
            # Predict for current day
            prediction = self.predict(current_data)[0]
            forecasts.append({
                'day_offset': day + 1,
                'predicted_shipments': int(prediction)
            })
            
            # Update rolling averages for next prediction
            # This is simplified - in production, you'd maintain full history
            current_data['historical_shipments_7d'] = int(prediction)
            current_data['historical_shipments_30d'] = int(
                0.9 * current_data['historical_shipments_30d'] + 0.1 * prediction
            )
            
            # Update date-based features
            current_data['day_of_week'] = (current_data['day_of_week'] + 1) % 7
            # Simplified month handling
        
        return forecasts
    
    def save(self, model_dir):
        """Save model and scaler"""
        model_dir = Path(model_dir)
        model_dir.mkdir(parents=True, exist_ok=True)
        
        model_path = model_dir / "demand_forecast_model.joblib"
        scaler_path = model_dir / "demand_forecast_scaler.joblib"
        
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        
        print(f"✅ Model saved to {model_path}")
        print(f"✅ Scaler saved to {scaler_path}")
    
    def load(self, model_dir):
        """Load model and scaler"""
        model_dir = Path(model_dir)
        
        model_path = model_dir / "demand_forecast_model.joblib"
        scaler_path = model_dir / "demand_forecast_scaler.joblib"
        
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        
        print(f"✓ Model loaded from {model_path}")
        return self


if __name__ == "__main__":
    # Test the model
    model = DemandForecastModel()
    
    # Train
    data_path = Path(__file__).parent.parent.parent / "data" / "demand_forecast.csv"
    metrics = model.train(data_path)
    
    # Save
    model_dir = Path(__file__).parent.parent.parent / "models"
    model.save(model_dir)
    
    # Test prediction
    test_data = {
        'day_of_week': 2,  # Wednesday
        'month': 10,  # October
        'is_holiday': False,
        'historical_shipments_7d': 55,
        'historical_shipments_30d': 52,
        'avg_shipment_weight_kg': 450,
        'active_vehicles_count': 10,
        'seasonal_index': 1.3
    }
    
    prediction = model.predict(test_data)[0]
    print(f"\n🧪 Test Prediction: {int(prediction)} shipments")
    
    # Test 7-day forecast
    forecasts = model.forecast_next_n_days(test_data, n_days=7)
    print(f"\n📈 7-Day Forecast:")
    for fc in forecasts:
        print(f"   Day +{fc['day_offset']}: {fc['predicted_shipments']} shipments")
