"""
Synthetic Data Generator for ML Training

Generates realistic training data for:
- Driver performance scoring
- Vehicle maintenance prediction  
- Demand forecasting
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import json
from pathlib import Path


class SyntheticDataGenerator:
    def __init__(self, seed=42):
        np.random.seed(seed)
        random.seed(seed)
        self.output_dir = Path(__file__).parent.parent / "data"
        self.output_dir.mkdir(exist_ok=True)
    
    def generate_driver_data(self, n_drivers=100):
        """Generate synthetic driver performance data"""
        data = []
        
        for i in range(n_drivers):
            driver_id = f"DR-{i+1:04d}"
            experience_months = np.random.randint(6, 120)  # 6 months to 10 years
            
            # Base performance influenced by experience
            experience_factor = min(experience_months / 60, 1.0)  # Caps at 5 years
            
            total_trips = np.random.randint(50, 500)
            
            # On-time delivery rate (70-98%, better with experience)
            base_on_time_rate = 0.7 + (experience_factor * 0.2)
            on_time_rate = np.clip(np.random.normal(base_on_time_rate, 0.1), 0.5, 0.99)
            on_time_deliveries = int(total_trips * on_time_rate)
            late_deliveries = total_trips - on_time_deliveries
            
            # Average speed (40-80 km/h)
            avg_speed = np.random.uniform(40, 80)
            
            # Safety metrics (harsh events, inversely related to experience)
            harsh_braking_count = np.random.poisson(max(20 - (experience_factor * 15), 5))
            harsh_acceleration_count = np.random.poisson(max(25 - (experience_factor * 18), 7))
            
            # Idle time (10-60 mins per trip on average)
            idle_time_mins = np.random.uniform(10, 60) * total_trips
            
            # Fuel efficiency (8-18 km/l, better with experience)
            base_fuel_eff = 10 + (experience_factor * 4)
            fuel_efficiency = np.clip(np.random.normal(base_fuel_eff, 2), 8, 18)
            
            # Total distance
            distance_km = total_trips * np.random.uniform(30, 150)
            
            # Incidents (rare, 0-3)
            incident_count = np.random.choice([0, 0, 0, 1, 1, 2], p=[0.5, 0.3, 0.1, 0.05, 0.03, 0.02])
            
            # Customer rating (3.5-5.0, correlated with on-time rate)
            customer_rating = np.clip(3.0 + (on_time_rate * 2) + np.random.normal(0, 0.3), 3.0, 5.0)
            
            # Calculate driver score (0-100)
            # Weights: on-time (35%), fuel (20%), safety (25%), rating (10%), experience (10%)
            safety_score = 100 * (1 - (harsh_braking_count + harsh_acceleration_count) / (total_trips * 2))
            safety_score = max(0, min(100, safety_score))
            
            driver_score = (
                on_time_rate * 35 +
                (fuel_efficiency / 18) * 20 +
                (safety_score / 100) * 25 +
                (customer_rating / 5) * 10 +
                experience_factor * 10
            )
            
            data.append({
                'driver_id': driver_id,
                'total_trips': total_trips,
                'on_time_deliveries': on_time_deliveries,
                'late_deliveries': late_deliveries,
                'avg_speed_kmh': round(avg_speed, 2),
                'harsh_braking_count': harsh_braking_count,
                'harsh_acceleration_count': harsh_acceleration_count,
                'idle_time_mins': round(idle_time_mins, 2),
                'fuel_efficiency_kmpl': round(fuel_efficiency, 2),
                'distance_km': round(distance_km, 2),
                'experience_months': experience_months,
                'incident_count': incident_count,
                'customer_rating': round(customer_rating, 2),
                'driver_score': round(driver_score, 2)
            })
        
        df = pd.DataFrame(data)
        output_path = self.output_dir / "driver_performance.csv"
        df.to_csv(output_path, index=False)
        print(f"✓ Generated {len(df)} driver records → {output_path}")
        return df
    
    def generate_maintenance_data(self, n_vehicles=80):
        """Generate synthetic vehicle maintenance data"""
        data = []
        makes_models = [
            "Tata Ace Gold", "Mahindra Jeeto", "Eicher Pro 3015",
            "Ashok Leyland Dost", "Force Motors Traveller",
            "Maruti Suzuki Super Carry", "Piaggio Ape Auto"
        ]
        
        for i in range(n_vehicles):
            vehicle_id = f"VH-{i+1:04d}"
            age_months = np.random.randint(6, 60)  # 6 months to 5 years
            make_model = random.choice(makes_models)
            
            # Odometer (20k-150k km based on age)
            base_km = age_months * np.random.uniform(500, 2500)
            odometer_km = int(base_km + np.random.normal(0, 5000))
            
            # Last maintenance (0-90 days ago)
            days_since_maintenance = np.random.randint(0, 90)
            
            # Usage patterns
            total_trips = np.random.randint(100, 800)
            avg_trip_distance = odometer_km / total_trips if total_trips > 0 else 50
            
            # Harsh usage score (0-100, higher = more harsh)
            harsh_usage_score = np.random.uniform(20, 80)
            
            # Fuel consumption variance (0-30%, higher = potential issue)
            fuel_variance = np.random.uniform(0, 30)
            
            # Reported issues
            reported_issues = np.random.poisson(age_months / 12)  # More issues with age
            
            # Determine maintenance risk
            # Factors: days since maintenance, odometer, harsh usage, age
            risk_score = (
                (days_since_maintenance / 90) * 30 +
                (odometer_km / 150000) * 25 +
                (harsh_usage_score / 100) * 20 +
                (age_months / 60) * 15 +
                (reported_issues / 5) * 10
            )
            
            # days until maintenance needed
            if risk_score > 70:
                maintenance_class = "immediate"
                days_until = np.random.randint(1, 7)
            elif risk_score > 40:
                maintenance_class = "soon"
                days_until = np.random.randint(7, 30)
            else:
                maintenance_class = "normal"
                days_until = np.random.randint(30, 90)
            
            data.append({
                'vehicle_id': vehicle_id,
                'make_model': make_model,
                'age_months': age_months,
                'odometer_km': odometer_km,
                'days_since_last_maintenance': days_since_maintenance,
                'total_trips': total_trips,
                'avg_trip_distance_km': round(avg_trip_distance, 2),
                'harsh_usage_score': round(harsh_usage_score, 2),
                'fuel_consumption_variance': round(fuel_variance, 2),
                'reported_issues_count': reported_issues,
                'maintenance_class': maintenance_class,
                'days_until_maintenance': days_until,
                'risk_score': round(risk_score, 2)
            })
        
        df = pd.DataFrame(data)
        output_path = self.output_dir / "vehicle_maintenance.csv"
        df.to_csv(output_path, index=False)
        print(f"✓ Generated {len(df)} vehicle maintenance records → {output_path}")
        return df
    
    def generate_demand_forecast_data(self, n_days=730):
        """Generate synthetic shipment demand data (2 years)"""
        data = []
        start_date = datetime.now() - timedelta(days=n_days)
        
        # Base trend (slight growth over time)
        base_demand = 50
        growth_rate = 0.0005  # Daily growth
        
        # Indian holidays for 2024-2025 (sample)
        holidays = [
            "2024-01-26", "2024-03-25", "2024-08-15", "2024-10-02",
            "2024-10-31", "2024-11-01", "2024-12-25",
            "2025-01-26", "2025-03-14", "2025-08-15", "2025-10-02"
        ]
        holiday_dates = set(holidays)
        
        for day in range(n_days):
            current_date = start_date + timedelta(days=day)
            date_str = current_date.strftime("%Y-%m-%d")
            
            # Day of week effect (weekdays higher)
            day_of_week = current_date.weekday()
            dow_factor = 1.2 if day_of_week < 5 else 0.6  # Mon-Fri vs Sat-Sun
            
            # Monthly seasonality (higher in Q4, festival season)
            month = current_date.month
            if month in [10, 11, 12]:  # Diwali, year-end
                seasonal_factor = 1.3
            elif month in [6, 7, 8]:  # Monsoon slowdown
                seasonal_factor = 0.9
            else:
                seasonal_factor = 1.0
            
            # Holiday effect (reduced demand)
            is_holiday = date_str in holiday_dates
            holiday_factor = 0.5 if is_holiday else 1.0
            
            # Trend
            trend = base_demand + (day * growth_rate * base_demand)
            
            # Random noise
            noise = np.random.normal(0, 5)
            
            # Calculate demand
            shipments = max(0, int(
                trend * dow_factor * seasonal_factor * holiday_factor + noise
            ))
            
            # Historical context (rolling averages)
            if day >= 7:
                last_7d = [data[i]['shipments'] for i in range(max(0, day-7), day)]
                hist_7d = int(np.mean(last_7d))
            else:
                hist_7d = shipments
            
            if day >= 30:
                last_30d = [data[i]['shipments'] for i in range(max(0, day-30), day)]
                hist_30d = int(np.mean(last_30d))
            else:
                hist_30d = shipments
            
            # Average shipment weight
            avg_weight = np.random.uniform(200, 800)
            
            # Active vehicles (correlated with demand)
            active_vehicles = int(np.clip(shipments /10, 5, 15))
            
            data.append({
                'date': date_str,
                'day_of_week': day_of_week,
                'month': month,
                'is_holiday': is_holiday,
                'historical_shipments_7d': hist_7d,
                'historical_shipments_30d': hist_30d,
                'avg_shipment_weight_kg': round(avg_weight, 2),
                'active_vehicles_count': active_vehicles,
                'seasonal_index': round(seasonal_factor, 2),
                'shipments': shipments
            })
        
        df = pd.DataFrame(data)
        output_path = self.output_dir / "demand_forecast.csv"
        df.to_csv(output_path, index=False)
        print(f"✓ Generated {len(df)} demand forecast records → {output_path}")
        return df
    
    
    def generate_delay_prediction_data(self, n_samples=1000):
        """Generate synthetic delay prediction data"""
        data = []
        for _ in range(n_samples):
            distance = np.random.uniform(50, 800)
            num_stops = np.random.randint(1, 10)
            traffic_score = np.random.uniform(0, 100)
            weather_score = np.random.uniform(0, 100)
            hist_delay = np.random.exponential(15) # Avg 15 min delay history
            
            vehicle_age = np.random.randint(1, 15)
            departure_hour = np.random.randint(0, 24)
            is_weekend = np.random.choice([0, 1], p=[0.7, 0.3])
            
            # Logic to determine delay class
            risk_score = (
                (traffic_score / 100) * 0.3 + 
                (weather_score / 100) * 0.3 + 
                (num_stops / 10) * 0.2 +
                (vehicle_age / 15) * 0.1 +
                (hist_delay / 60) * 0.1
            )
            
            # Adjust risk for rush hours
            if 7 <= departure_hour <= 9 or 16 <= departure_hour <= 19:
                risk_score += 0.2
            
            if risk_score > 0.6:
                delay_class = "major_delay"
            elif risk_score > 0.3:
                delay_class = "minor_delay"
            else:
                delay_class = "on_time"
                
            data.append({
                'total_distance_km': round(distance, 2),
                'num_stops': num_stops,
                'traffic_density_score': round(traffic_score, 2),
                'weather_severity_score': round(weather_score, 2),
                'historical_route_avg_delay_mins': round(hist_delay, 2),
                'departure_hour': departure_hour,
                'is_weekend': is_weekend,
                'vehicle_age_years': vehicle_age,
                'delay_class': delay_class
            })
            
        df = pd.DataFrame(data)
        output_path = self.output_dir / "delay_prediction.csv"
        df.to_csv(output_path, index=False)
        print(f"✓ Generated {len(df)} delay prediction records → {output_path}")
        return df

    def generate_incident_risk_data(self, n_samples=1000):
        """Generate synthetic incident risk data"""
        data = []
        for _ in range(n_samples):
            weather = np.random.uniform(0, 100) # 0=clear, 100=storm
            traffic = np.random.uniform(0, 100)
            road_quality = np.random.uniform(0, 100) # 0=poor, 100=good
            fatigue = np.random.uniform(0, 10) # hours driven
            vehicle_maint = np.random.uniform(0, 100) # 0=poor, 100=perfect
            hist_accident = np.random.uniform(0, 0.05) # rate per km
            
            time_of_day_risk = np.random.uniform(0, 1)
            
            # Risk formula
            risk = (
                (weather / 100) * 20 +
                (traffic / 100) * 15 +
                ((100 - road_quality) / 100) * 15 +
                (fatigue / 10) * 20 +
                ((100 - vehicle_maint) / 100) * 15 +
                (hist_accident * 100) * 10 +
                time_of_day_risk * 5
            )
            risk = np.clip(risk + np.random.normal(0, 5), 0, 100)
            
            data.append({
                'weather_condition_score': round(weather, 2),
                'traffic_density': round(traffic, 2),
                'road_quality_score': round(road_quality, 2),
                'driver_fatigue_score': round(fatigue, 2),
                'vehicle_maintenance_score': round(vehicle_maint, 2),
                'route_historical_accident_rate': round(hist_accident, 4),
                'time_of_day_risk': round(time_of_day_risk, 2),
                'incident_risk_score': round(risk, 2)
            })
            
        df = pd.DataFrame(data)
        output_path = self.output_dir / "incident_risk.csv"
        df.to_csv(output_path, index=False)
        print(f"✓ Generated {len(df)} incident risk records → {output_path}")
        return df

    def generate_fuel_anomaly_data(self, n_samples=1000):
        """Generate fuel consumption data with anomalies"""
        data = []
        for _ in range(n_samples):
            distance = np.random.uniform(50, 500)
            load = np.random.uniform(0, 10000) # kg
            speed = np.random.uniform(40, 80)
            idle = np.random.uniform(10, 120)
            elevation = np.random.uniform(0, 1000)
            
            # Baseline fuel calc (approx)
            # Base 8km/l -> 0.125 l/km
            # Load impact: +0.05 l/km per ton
            # Speed impact: optimal 60, quadratic penalty
            # Idle: 1L per hour
            
            base_rate = 0.125
            load_factor = (load / 1000) * 0.01
            speed_factor = ((speed - 60)**2) * 0.0001
            elevation_factor = (elevation / 100) * 0.005
            
            rate = base_rate + load_factor + speed_factor + elevation_factor
            consumed = (distance * rate) + (idle / 60)
            
            # Introduce anomalies (10% chance)
            is_anomaly = False
            if np.random.random() < 0.1:
                is_anomaly = True
                anomaly_type = np.random.choice(['theft', 'leak', 'inefficient'])
                if anomaly_type == 'theft':
                    consumed *= np.random.uniform(1.2, 1.5) # Sudden drop not visible here, but total consumed is high for distance
                elif anomaly_type == 'leak':
                    consumed *= np.random.uniform(1.3, 2.0)
                else:
                    consumed *= 1.15
            
            data.append({
                'distance_km': round(distance, 2),
                'fuel_consumed_liters': round(consumed, 2),
                'load_weight_kg': round(load, 2),
                'avg_speed_kmh': round(speed, 2),
                'idle_time_mins': round(idle, 2),
                'route_elevation_gain_m': round(elevation, 2),
                'is_anomaly': is_anomaly # Label for verification, unsupervised training won't use it
            })
            
        df = pd.DataFrame(data)
        output_path = self.output_dir / "fuel_anomaly.csv"
        df.to_csv(output_path, index=False)
        print(f"✓ Generated {len(df)} fuel records ({df['is_anomaly'].sum()} anomalies) → {output_path}")
        return df
        
    def generate_driver_clustering_data(self, n_drivers=200):
        """Generate driver profiling data for clustering"""
        data = []
        
        # Define prototypes
        profiles = [
            # Aggressive: Fast, harsh, night driving
            {'speed': (70, 90), 'harsh': (5, 15), 'idle': (0.05, 0.1), 'night': (0.4, 0.8), 'dist': (200, 400)},
            # Eco/Cautious: Slow, smooth, low idle
            {'speed': (40, 60), 'harsh': (0, 3), 'idle': (0.05, 0.2), 'night': (0.0, 0.2), 'dist': (100, 300)},
            # Long-Haul: Moderate speed, high distance, high night
            {'speed': (50, 70), 'harsh': (2, 8), 'idle': (0.1, 0.3), 'night': (0.3, 0.6), 'dist': (500, 1000)},
            # City/balanced: Moderate everything, high idle
            {'speed': (30, 50), 'harsh': (3, 7), 'idle': (0.3, 0.6), 'night': (0.1, 0.3), 'dist': (50, 150)}
        ]
        
        for _ in range(n_drivers):
            profile = np.random.choice(profiles)
            
            avg_speed = np.random.uniform(*profile['speed'])
            harsh_acc = np.random.uniform(*profile['harsh'])
            harsh_brake = np.random.uniform(*profile['harsh'])
            idle_ratio = np.random.uniform(*profile['idle'])
            night_ratio = np.random.uniform(*profile['night'])
            avg_dist = np.random.uniform(*profile['dist'])
            
            data.append({
                'avg_speed_kmh': round(avg_speed, 2),
                'harsh_acceleration_count_per_100km': round(harsh_acc, 2),
                'harsh_braking_count_per_100km': round(harsh_brake, 2),
                'idling_ratio': round(idle_ratio, 3),
                'night_driving_ratio': round(night_ratio, 3),
                'average_trip_distance_km': round(avg_dist, 2)
            })
            
        df = pd.DataFrame(data)
        output_path = self.output_dir / "driver_clustering.csv"
        df.to_csv(output_path, index=False)
        print(f"✓ Generated {len(df)} driver profiles → {output_path}")
        return df

    def generate_eta_data(self, n_samples=1000):
        """Generate synthetic ETA training data"""
        data = []
        for _ in range(n_samples):
            distance = np.random.uniform(10, 1000)
            base_speed = 60 # km/h
            base_duration = (distance / base_speed) * 60 # minutes
            
            traffic = np.random.uniform(0, 100)
            weather = np.random.uniform(1.0, 1.5) # multiplier
            hour = np.random.randint(0, 24)
            weekend = np.random.choice([0, 1], p=[0.7, 0.3])
            urban = np.random.uniform(0, 100)
            
            # Rush hour impact
            rush_hour = 0
            if (7 <= hour <= 10) or (16 <= hour <= 19):
                rush_hour = 1
                
            # Calculate actual duration
            # Traffic impact increases with urban density
            traffic_factor = 1.0 + (traffic / 100) * (urban / 100) * 0.5 
            rush_factor = 1.0 + (rush_hour * 0.3 * (urban / 100))
            
            actual_duration = base_duration * traffic_factor * weather * rush_factor
            
            # Add noise
            actual_duration *= np.random.normal(1.0, 0.05)
            
            data.append({
                'distance_km': round(distance, 2),
                'base_duration_mins': round(base_duration, 2),
                'traffic_density_score': round(traffic, 2),
                'weather_factor': round(weather, 2),
                'hour_of_day': hour,
                'is_weekend': weekend,
                'urban_density_score': round(urban, 2),
                'actual_duration_mins': round(actual_duration, 2)
            })
            
        df = pd.DataFrame(data)
        output_path = self.output_dir / "eta_prediction.csv"
        df.to_csv(output_path, index=False)
        print(f"✓ Generated {len(df)} ETA records → {output_path}")
        return df

    def generate_all(self):
        """Generate all synthetic datasets"""
        print("\n🔄 Generating synthetic training data...\n")
        
        driver_df = self.generate_driver_data(n_drivers=150)
        maintenance_df = self.generate_maintenance_data(n_vehicles=100)
        demand_df = self.generate_demand_forecast_data(n_days=730)
        
        # New datasets
        delay_df = self.generate_delay_prediction_data(n_samples=1000)
        risk_df = self.generate_incident_risk_data(n_samples=1000)
        fuel_df = self.generate_fuel_anomaly_data(n_samples=1000)
        cluster_df = self.generate_driver_clustering_data(n_drivers=200)
        eta_df = self.generate_eta_data(n_samples=1000)
        
        print(f"\n✅ All datasets generated successfully!")
        print(f"\nDataset Statistics:")
        print(f"  - Drivers: {len(driver_df)} records")
        print(f"  - Vehicles: {len(maintenance_df)} records")
        print(f"  - Demand History: {len(demand_df)} days")
        print(f"  - Delay Samples: {len(delay_df)}")
        print(f"  - Incident Risk Samples: {len(risk_df)}")
        print(f"  - Fuel Samples: {len(fuel_df)}")
        print(f"  - Driver Profiles: {len(cluster_df)}")
        print(f"  - ETA Samples: {len(eta_df)}")
        
        return driver_df, maintenance_df, demand_df, delay_df, risk_df, fuel_df, cluster_df, eta_df


if __name__ == "__main__":
    generator = SyntheticDataGenerator()
    generator.generate_all()
