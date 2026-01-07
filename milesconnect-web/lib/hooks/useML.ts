import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../api";

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

/**
 * Hook to predict delivery time
 */
export function usePredictDeliveryTime() {
    return useMutation({
        mutationFn: async (params: {
            origin_address: string;
            destination_address: string;
            weight_kg: number;
            vehicle_capacity_kg?: number;
        }) => {
            const response = await api.post<{ data: DeliveryTimePrediction }>(
                "/api/ml/predict-delivery-time",
                params
            );
            return response.data;
        },
    });
}

/**
 * Hook to get demand forecast
 */
export function useDemandForecast(forecast_days: number = 7) {
    return useQuery({
        queryKey: ["demand-forecast", forecast_days],
        queryFn: async () => {
            const response = await api.post<{ data: DemandForecast }>(
                "/api/ml/forecast-demand",
                { forecast_days }
            );
            return response.data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

/**
 * Hook to analyze driver performance
 */
export function useDriverPerformance(driver_id: string, period_days: number = 30) {
    return useQuery({
        queryKey: ["driver-performance", driver_id, period_days],
        queryFn: async () => {
            const response = await api.post<{ data: DriverPerformance }>(
                "/api/ml/analyze-driver-performance",
                { driver_id, period_days }
            );
            return response.data;
        },
        enabled: !!driver_id,
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}

// Export types
export type { DeliveryTimePrediction, DemandForecast, DriverPerformance };
