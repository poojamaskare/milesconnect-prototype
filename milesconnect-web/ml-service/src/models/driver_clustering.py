"""
Driver Clustering Model using K-Means

Segments drivers into behavioral clusters (e.g., "Eco-Friendly", "Aggressive", "Cautious")
based on their driving patterns.
"""

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path

class DriverClusteringModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'avg_speed_kmh',
            'harsh_acceleration_count_per_100km',
            'harsh_braking_count_per_100km',
            'idling_ratio', # time idle / total time
            'night_driving_ratio', # time at night / total time
            'average_trip_distance_km'
        ]
        self.cluster_labels = {
            0: "Balanced Driver",
            1: "Aggressive / High Risk",
            2: "Eco-Friendly / Cautious",
            3: "Long-Haul Specialist"
        }
        
    def prepare_features(self, df):
        """Prepare features for model training/prediction"""
        X = df[self.feature_columns].copy()
        return X

    def train(self, train_data_path):
        """Train K-Means Clustering"""
        print("\n🚀 Training Driver Clustering Model...")
        
        # Load data
        df = pd.read_csv(train_data_path)
        print(f"✓ Loaded {len(df)} driver profiles")
        
        # Prepare features
        X = self.prepare_features(df)
        X_scaled = self.scaler.fit_transform(X)
        
        # Train K-Means
        # We assume 4 clusters for now based on typical profiles
        self.model = KMeans(
            n_clusters=4,
            random_state=42,
            n_init=10
        )
        
        print("Training K-Means...")
        self.model.fit(X_scaled)
        
        # Assign names to clusters based on centroids
        # This is a simplification; in production you'd analyze centroids to name them dynamically
        # For now, we trust the pre-defined mapping or just return IDs
        
        return {'n_clusters': 4, 'inertia': float(self.model.inertia_)}

    def predict(self, driver_data):
        """Predict driver cluster"""
        if self.model is None:
            raise ValueError("Model not trained or loaded")
            
        if isinstance(driver_data, dict):
            driver_data = pd.DataFrame([driver_data])
            
        X = self.prepare_features(driver_data)
        X_scaled = self.scaler.transform(X)
        
        cluster_id = self.model.predict(X_scaled)[0]
        
        # Calculate distance to centroid (measure of how typical they are for that cluster)
        centroid = self.model.cluster_centers_[cluster_id]
        distance = np.linalg.norm(X_scaled[0] - centroid)
        
        return {
            'cluster_id': int(cluster_id),
            'cluster_name': self.cluster_labels.get(cluster_id, f"Cluster {cluster_id}"),
            'centroid_distance': float(distance)
        }
        
    def save(self, model_dir):
        """Save model artifacts"""
        model_dir = Path(model_dir)
        model_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, model_dir / "driver_clustering_model.joblib")
        joblib.dump(self.scaler, model_dir / "driver_clustering_scaler.joblib")
        print(f"✅ Driver Clustering Model saved")

    def load(self, model_dir):
        """Load model artifacts"""
        model_dir = Path(model_dir)
        self.model = joblib.load(model_dir / "driver_clustering_model.joblib")
        self.scaler = joblib.load(model_dir / "driver_clustering_scaler.joblib")
        print(f"✓ Driver Clustering Model loaded")
        return self
