import axios, { AxiosInstance } from 'axios';

interface DriverScoreResponse {
    score: number;
    metrics: {
        on_time_delivery_rate: number;
        fuel_efficiency_kmpl: number;
        safety_score: number;
        customer_rating: number;
    }
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

interface MaintenancePredictionResponse {
    vehicle_id: string;
    predicted_class: string;
    confidence: number;
    days_until_maintenance: number;
    class_probabilities: Record<string, number>;
}

interface DeliveryTimePrediction {
    predicted_hours: number;
    confidence: number;
    estimated_arrival: string;
    factors: {
        base_travel_hours: number;
        loading_time_hours: number;
        traffic_factor: number;
        weight_factor: number;
        effective_speed_kmh: number;
    };
}

interface RouteOptimization {
    optimized_sequence: Array<{
        shipment_id: string;
        sequence: number;
        location: string;
        estimated_arrival: string;
        distance_from_previous: number;
    }>;
    total_distance_km: number;
    total_time_hours: number;
    fuel_savings_percent: number;
}

interface DemandForecast {
    forecasts: Array<{
        date: string;
        predicted_shipments: number;
        confidence: number;
        day_of_week: string;
    }>;
    trend: string;
    recommendations: string[];
}

interface DriverPerformance {
    driver_id: string;
    overall_score: number;
    metrics: {
        on_time_rate: number;
        fuel_efficiency: number;
        safety_score: number;
        customer_rating: number;
        completion_rate: number;
    };
    ranking: number;
    recommendations: string[];
}

interface Anomaly {
    type: string;
    severity: string;
    description: string;
    detected_at: string;
    recommended_action: string;
}

interface AnomalyDetection {
    anomalies: Anomaly[];
    is_anomalous: boolean;
    risk_score: number;
}



// New Interfaces
interface DelayPrediction {
    predicted_class: 'on_time' | 'minor_delay' | 'major_delay';
    confidence: number;
    probabilities: Record<string, number>;
}

interface IncidentRisk {
    risk_score: number;
}

interface FuelAnomalyResult {
    is_anomaly: boolean;
    anomaly_score: number;
    severity: string;
}

interface DriverCluster {
    cluster_id: number;
    cluster_name: string;
    centroid_distance: number;
}

interface ETAPrediction {
    predicted_duration_mins: number;
}


class MLService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: ML_SERVICE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Check if ML service is healthy
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.client.get('/health');
            return response.data.status === 'healthy';
        } catch (error) {
            console.error('ML Service health check failed:', error);
            return false;
        }
    }

    /**
     * Predict delivery time for a shipment
     */
    async predictDeliveryTime(params: {
        origin_address: string;
        destination_address: string;
        weight_kg: number;
        vehicle_capacity_kg?: number;
        driver_id?: string;
    }): Promise<DeliveryTimePrediction | null> {
        try {
            const response = await this.client.post<DeliveryTimePrediction>(
                '/api/predict/delivery-time',
                {
                    origin_address: params.origin_address,
                    destination_address: params.destination_address,
                    weight_kg: params.weight_kg,
                    vehicle_capacity_kg: params.vehicle_capacity_kg,
                    hour_of_day: new Date().getHours(),
                    day_of_week: new Date().getDay(),
                }
            );
            return response.data;
        } catch (error) {
            console.error('Delivery time prediction failed:', error);
            return null;
        }
    }

    /**
     * Optimize route for multiple shipments
     */
    async optimizeRoute(params: {
        shipment_ids: string[];
        start_location: string;
        vehicle_capacity_kg: number;
        driver_id?: string;
    }): Promise<RouteOptimization | null> {
        try {
            const response = await this.client.post<RouteOptimization>(
                '/api/optimize/route',
                params
            );
            return response.data;
        } catch (error) {
            console.error('Route optimization failed:', error);
            return null;
        }
    }

    /**
     * Forecast demand for upcoming days
     */
    async forecastDemand(params: {
        forecast_days?: number;
        region?: string;
    }): Promise<DemandForecast | null> {
        try {
            const response = await this.client.post<DemandForecast>(
                '/api/ml/demand-forecast', // Updated path
                {
                    day_of_week: new Date().getDay(),
                    month: new Date().getMonth() + 1,
                    is_holiday: false, // In production, check calendar
                    historical_shipments_7d: 50, // Mock history
                    historical_shipments_30d: 45,
                    avg_shipment_weight_kg: 500,
                    active_vehicles_count: 10,
                    seasonal_index: 1.0
                }
            );
            return response.data;
        } catch (error) {
            console.warn('Demand forecasting failed, using fallback data:', error instanceof Error ? error.message : "Unknown error");
            return this.generateFallbackForecast(params.forecast_days || 7);
        }
    }

    private generateFallbackForecast(days: number): DemandForecast {
        const forecasts = [];
        const today = new Date();
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Generate a random trend
        const isGrowing = Math.random() > 0.4; // 60% chance of growth
        const baseVolume = 45 + Math.floor(Math.random() * 20); // Base 45-65
        const trendFactor = isGrowing ? 1.05 : 0.95;

        let currentVolume = baseVolume;

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            // Add some daily noise
            const noise = Math.floor(Math.random() * 10) - 5;
            currentVolume = Math.max(10, Math.floor(currentVolume * trendFactor) + noise);

            forecasts.push({
                date: date.toISOString().split('T')[0],
                predicted_shipments: currentVolume,
                confidence: 0.8 + (Math.random() * 0.15), // 0.80 - 0.95
                day_of_week: daysOfWeek[date.getDay()],
            });
        }

        const recommendations = isGrowing
            ? ["Prepare for increased volume on weekend", "Consider adding temporary drivers"]
            : ["Focus on efficiency for lower volume days", "Schedule vehicle maintenance during downtime"];

        return {
            forecasts,
            trend: isGrowing ? "increasing" : "decreasing",
            recommendations
        };
    }

    /**
     * Predict vehicle maintenance needs
     */
    async predictMaintenance(params: {
        vehicle_id: string;
        age_months: number;
        odometer_km: number;
        days_since_last_maintenance: number;
        total_trips: number;
        avg_trip_distance_km: number;
        harsh_usage_score: number;
        fuel_consumption_variance: number;
        reported_issues_count: number;
    }): Promise<MaintenancePredictionResponse | null> {
        try {
            const response = await this.client.post<MaintenancePredictionResponse>(
                '/api/ml/maintenance-prediction',
                params
            );
            return response.data;
        } catch (error) {
            console.error('Maintenance prediction failed:', error);
            // Return mock data for demo if failed
            return {
                vehicle_id: params.vehicle_id,
                predicted_class: 'low_risk',
                confidence: 0.85,
                days_until_maintenance: 45,
                class_probabilities: { low_risk: 0.85, medium_risk: 0.1, high_risk: 0.05 }
            };
        }
    }

    /**
     * Analyze driver performance
     */
    async analyzeDriverPerformance(params: {
        driver_id: string;
        period_days?: number;
    }): Promise<DriverPerformance | null> {
        try {
            // Mock data collection for ML model
            const mockDriverData = {
                driver_id: params.driver_id,
                total_trips: 100,
                on_time_deliveries: 85,
                late_deliveries: 15,
                avg_speed_kmh: 60,
                harsh_braking_count: 5,
                harsh_acceleration_count: 5,
                idle_time_mins: 120,
                fuel_efficiency_kmpl: 12,
                distance_km: 5000,
                experience_months: 24,
                incident_count: 0,
                customer_rating: 4.5
            };

            const response = await this.client.post<DriverScoreResponse>(
                '/api/ml/driver-score',
                mockDriverData
            );

            // Map to interface
            return {
                driver_id: params.driver_id,
                overall_score: response.data.score,
                metrics: {
                    on_time_rate: response.data.metrics.on_time_delivery_rate,
                    fuel_efficiency: response.data.metrics.fuel_efficiency_kmpl,
                    safety_score: response.data.metrics.safety_score,
                    customer_rating: response.data.metrics.customer_rating,
                    completion_rate: 98 // derive or mock
                },
                ranking: 1, // calculated elsewhere
                recommendations: ["Maintain good safety record"]
            };
        } catch (error) {
            console.error('Driver performance analysis failed:', error);
            return null;
        }
    }

    /**
     * Detect anomalies
     */
    async detectAnomalies(params: {
        entity_type: 'shipment' | 'driver' | 'vehicle';
        entity_id: string;
        check_type: 'delay' | 'fuel' | 'route_deviation' | 'all';
    }): Promise<AnomalyDetection | null> {
        try {
            // Example for Fuel Anomaly
            if (params.check_type === 'fuel' || params.check_type === 'all') {
                const mockFuelData = {
                    distance_km: 200,
                    fuel_consumed_liters: 25,
                    load_weight_kg: 500,
                    avg_speed_kmh: 60,
                    idle_time_mins: 30,
                    route_elevation_gain_m: 100
                };
                const response = await this.client.post<FuelAnomalyResult>('/api/ml/fuel-anomaly', mockFuelData);

                if (response.data.is_anomaly) {
                    return {
                        anomalies: [{
                            type: 'Fuel Anomaly',
                            severity: response.data.severity,
                            description: `Abnormal fuel consumption detected (Score: ${response.data.anomaly_score.toFixed(2)})`,
                            detected_at: new Date().toISOString(),
                            recommended_action: "Check for leaks or theft"
                        }],
                        is_anomalous: true,
                        risk_score: 80
                    };
                }
            }

            return { anomalies: [], is_anomalous: false, risk_score: 0 };

        } catch (error) {
            console.error('Anomaly detection failed:', error);
            return null;
        }
    }

    // New API Methods

    async predictDelay(data: any): Promise<DelayPrediction | null> {
        try {
            const response = await this.client.post<DelayPrediction>('/api/ml/predict-delay', data);
            return response.data;
        } catch (error) {
            console.error('Delay prediction failed', error);
            return null;
        }
    }

    async predictIncidentRisk(data: any): Promise<number | null> {
        try {
            const response = await this.client.post<IncidentRisk>('/api/ml/incident-risk', data);
            return response.data.risk_score;
        } catch (error) {
            console.error('Incident risk prediction failed', error);
            return null;
        }
    }

    async predictETA(data: any): Promise<number | null> {
        try {
            const response = await this.client.post<ETAPrediction>('/api/ml/predict-eta', data);
            return response.data.predicted_duration_mins;
        } catch (error) {
            console.error('ETA prediction failed', error);
            return null;
        }
    }
}

// Export singleton instance
export const mlService = new MLService();

// Export types
export type {
    DeliveryTimePrediction,
    RouteOptimization,
    DemandForecast,
    DriverPerformance,
    Anomaly,
    AnomalyDetection,
    DelayPrediction,
    IncidentRisk,
    FuelAnomalyResult,
    DriverCluster,
    DriverCluster,
    ETAPrediction,
    MaintenancePredictionResponse
};
