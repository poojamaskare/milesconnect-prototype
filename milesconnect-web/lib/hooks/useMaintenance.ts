import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export type MaintenanceType = "ROUTINE" | "REPAIR" | "ACCIDENT" | "OTHER";
export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface MaintenanceLog {
    id: string;
    vehicleId: string;
    type: MaintenanceType;
    status: MaintenanceStatus;
    description: string;
    date: string;
    odometerKm?: number;
    costCents?: number;
    providerName?: string;
    notes?: string;
    nextServiceDate?: string;
    createdAt: string;
}

export function useMaintenanceLogs(vehicleId: string) {
    return useQuery({
        queryKey: ["maintenance", vehicleId],
        queryFn: async () => {
            if (!vehicleId) return [];
            const res = await api.get<{ data: MaintenanceLog[] }>(`/api/maintenance/vehicles/${vehicleId}`);
            return res.data;
        },
        enabled: !!vehicleId,
    });
}

export function useCreateMaintenanceLog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: Partial<MaintenanceLog> & { cost?: string }) => {
            return api.post<{ data: MaintenanceLog }>("/api/maintenance", payload);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["maintenance", variables.vehicleId] });
            // Invalidate vehicle details as dates might have updated
            queryClient.invalidateQueries({ queryKey: ["vehicles", variables.vehicleId] }); // Check if this key matches useVehicles
        },
    });
}
