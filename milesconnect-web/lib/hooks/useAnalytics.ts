import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { queryKeys } from "../queryKeys";

export interface MLServiceHealth {
    available: boolean;
    lastCheck: string | null;
    latencyMs: number | null;
}

export interface DriverPerformanceMetric {
    driverId: string;
    driverName: string;
    score: number;
    metrics: {
        on_time_delivery_rate?: number;
        fuel_efficiency_kmpl?: number;
        safety_score?: number;
    };
}

export interface AnalyticsData {
    drivers: DriverPerformanceMetric[];
    mlServiceAvailable: boolean;
}

export function useMLHealth() {
    return useQuery({
        queryKey: queryKeys.analytics.health(),
        queryFn: async () => {
            const res = await api.get<{ data: MLServiceHealth }>("/api/analytics/health");
            return res.data;
        },
        refetchInterval: 30000, // Check every 30s
    });
}

export function useDriverPerformance() {
    return useQuery({
        queryKey: queryKeys.analytics.performance(),
        queryFn: async () => {
            const res = await api.get<{ data: AnalyticsData }>("/api/analytics/driver-performance");
            return res.data;
        },
        staleTime: 60000, // 1 minute
    });
}
