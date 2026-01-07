import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { queryKeys } from "../queryKeys";

export interface DashboardSummary {
    kpis: {
        shipmentsLast30: number;
        inTransit: number;
        delivered: number;
        revenueMtdCents: string;
        vehiclesTotal: number;
        vehiclesInMaintenance: number;
        overdueInvoices: number;
    };
    recent: {
        shipments: Array<{
            id: string;
            referenceNumber: string;
            status: string;
            createdAt: string;
        }>;
        tripSheets: Array<{
            id: string;
            createdAt: string;
            driver: { user: { name: string | null } };
            vehicle: { registrationNumber: string } | null;
        }>;
    };
}

export function useDashboardSummary() {
    return useQuery({
        queryKey: queryKeys.dashboard.kpis(),
        queryFn: async () => {
            const res = await api.get<{ data: DashboardSummary }>("/api/dashboard/summary");
            return res.data;
        },
        // Poll every 30s for freshness if no socket
        refetchInterval: 30000,
    });
}
