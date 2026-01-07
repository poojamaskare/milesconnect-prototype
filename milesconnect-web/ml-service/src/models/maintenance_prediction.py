"""
Predictive Maintenance Model using XGBoost

Predicts vehicle maintenance risk classification:
- immediate: <7 days
- soon: 7-30 days  
- normal: >30 days
"""

import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
from pathlib import Path


class MaintenancePredictionModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_columns = [
            'age_months',
            'odometer_km',
            'days_since_last_maintenance',
            'total_trips',
            'avg_trip_distance_km',
            'harsh_usage_score',
            'fuel_consumption_variance',
            'reported_issues_count'
        ]
        self.class_names = ['immediate', 'normal', 'soon']  # Alphabetical order
        
    def prepare_features(self, df):
        """Prepare features for model training/prediction"""
        X = df[self.feature_columns].copy()
        
        # Create derived features
        X['km_per_month'] = X['odometer_km'] / (X['age_months'] + 1)
        X['trips_per_month'] = X['total_trips'] / (X['age_months'] + 1)
        X['maintenance_overdue_ratio'] = X['days_since_last_maintenance'] / 30  # Expected monthly
        X['usage_intensity'] = X['harsh_usage_score'] * X['trips_per_month'] / 100
        
        return X
    
    def train(self, train_data_path):
        """Train the XGBoost classifier"""
        print("\n🚀 Training Predictive Maintenance Model...")
        
        # Load data
        df = pd.read_csv(train_data_path)
        print(f"✓ Loaded {len(df)} training samples")
        
        # Prepare features and target
        X = self.prepare_features(df)
        y = self.label_encoder.fit_transform(df['maintenance_class'])
        
        print(f"✓ Class distribution:")
        for i, class_name in enumerate(self.label_encoder.classes_):
            count = (y == i).sum()
            print(f"   {class_name}: {count} ({count/len(y)*100:.1f}%)")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train XGBoost classifier
        self.model = XGBClassifier(
            objective='multi:softprob',
            max_depth=5,
            learning_rate=0.1,
            n_estimators=150,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
            eval_metric='mlogloss'
        )
        
        print("Training XGBoost classifier...")
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred_train = self.model.predict(X_train_scaled)
        y_pred_test = self.model.predict(X_test_scaled)
        
        train_acc = accuracy_score(y_train, y_pred_train)
        test_acc = accuracy_score(y_test, y_pred_test)
        
        print(f"\n📊 Model Performance:")
        print(f"   Train Accuracy: {train_acc:.4f}")
        print(f"   Test Accuracy:  {test_acc:.4f}")
        
        print(f"\n📈 Classification Report (Test Set):")
        print(classification_report(
            y_test, y_pred_test,
            target_names=self.label_encoder.classes_
        ))
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': X.columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(f"\n🎯 Top 5 Important Features:")
        for idx, row in feature_importance.head(5).iterrows():
            print(f"   {row['feature']}: {row['importance']:.4f}")
        
        return {
            'train_accuracy': float(train_acc),
            'test_accuracy': float(test_acc),
            'feature_importance': feature_importance.to_dict('records')
        }
    
    def predict(self, vehicle_data):
        """Predict maintenance class and probability"""
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        # Convert to DataFrame if dict
        if isinstance(vehicle_data, dict):
            vehicle_data = pd.DataFrame([vehicle_data])
        
        # Prepare features
        X = self.prepare_features(vehicle_data)
        X_scaled = self.scaler.transform(X)
        
        # Predict class and probabilities
        predictions = self.model.predict(X_scaled)
        probabilities = self.model.predict_proba(X_scaled)
        
        # Convert back to string labels
        predicted_classes = self.label_encoder.inverse_transform(predictions)
        
        results = []
        for i, pred_class in enumerate(predicted_classes):
            class_probs = {
                cls: float(prob)
                for cls, prob in zip(self.label_encoder.classes_, probabilities[i])
            }
            
            # Estimate days until maintenance based on class
            if pred_class == 'immediate':
                days_until = np.random.randint(1, 7)
            elif pred_class == 'soon':
                days_until = np.random.randint(7, 30)
            else:
                days_until = np.random.randint(30, 90)
            
            results.append({
                'predicted_class': pred_class,
                'confidence': float(probabilities[i].max()),
                'class_probabilities': class_probs,
                'days_until_maintenance': days_until
            })
        
        return results
    
    def save(self, model_dir):
        """Save model, scaler, and label encoder"""
        model_dir = Path(model_dir)
        model_dir.mkdir(parents=True, exist_ok=True)
        
        model_path = model_dir / "maintenance_prediction_model.joblib"
        scaler_path = model_dir / "maintenance_prediction_scaler.joblib"
        encoder_path = model_dir / "maintenance_prediction_encoder.joblib"
        
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        joblib.dump(self.label_encoder, encoder_path)
        
        print(f"✅ Model saved to {model_path}")
        print(f"✅ Scaler saved to {scaler_path}")
        print(f"✅ Encoder saved to {encoder_path}")
    
    def load(self, model_dir):
        """Load model, scaler, and label encoder"""
        model_dir = Path(model_dir)
        
        model_path = model_dir / "maintenance_prediction_model.joblib"
        scaler_path = model_dir / "maintenance_prediction_scaler.joblib"
        encoder_path = model_dir / "maintenance_prediction_encoder.joblib"
        
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        self.label_encoder = joblib.load(encoder_path)
        
        print(f"✓ Model loaded from {model_path}")
        return self


if __name__ == "__main__":
    # Test the model
    model = MaintenancePredictionModel()
    
    # Train
    data_path = Path(__file__).parent.parent.parent / "data" / "vehicle_maintenance.csv"
    metrics = model.train(data_path)
    
    # Save
    model_dir = Path(__file__).parent.parent.parent / "models"
    model.save(model_dir)
    
    # Test prediction
    test_vehicle = {
        'age_months': 24,
        'odometer_km': 45000,
        'days_since_last_maintenance': 65,
        'total_trips': 450,
        'avg_trip_distance_km': 100,
        'harsh_usage_score': 55,
        'fuel_consumption_variance': 15,
        'reported_issues_count': 2
    }
    
    result = model.predict(test_vehicle)[0]
    print(f"\n🧪 Test Prediction:")
    print(f"   Class: {result['predicted_class']}")
    print(f"   Confidence: {result['confidence']:.2%}")
    print(f"   Est. Days Until Maintenance: {result['days_until_maintenance']}")
