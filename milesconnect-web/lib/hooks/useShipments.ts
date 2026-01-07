import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { queryKeys } from "../queryKeys";

export type ShipmentStatus = "DRAFT" | "PLANNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export interface Shipment {
    id: string;
    referenceNumber: string;
    status: ShipmentStatus;
    originAddress: string;
    destinationAddress: string;
    scheduledPickupAt: string | null;
    scheduledDropAt: string | null;
    actualPickupAt: string | null;
    actualDropAt: string | null;
    weightKg: number | null;
    priceCents?: number;
    driverId: string | null;
    vehicleId: string | null;
    driver?: {
        user: { name: string | null; email: string };
    } | null;
    vehicle?: {
        registrationNumber: string;
        make?: string;
        model?: string;
    } | null;
    createdAt: string;
}

interface UseShipmentsFilters {
    status?: ShipmentStatus;
    driverId?: string;
    vehicleId?: string;
    page?: number;
    limit?: number;
}

export function useShipments(filters: UseShipmentsFilters = {}) {
    return useQuery({
        queryKey: [...queryKeys.shipments.list(), filters],
        queryFn: async () => {
            const res = await api.get<{ data: Shipment[]; pagination: any }>("/api/shipments", {
                query: filters as Record<string, string | number>
            });
            return res;
        },
        staleTime: 5000, // 5 seconds
        refetchOnWindowFocus: true,
    });
}

export function useShipment(id: string) {
    return useQuery({
        queryKey: queryKeys.shipments.detail(id),
        queryFn: async () => {
            const res = await api.get<{ data: Shipment }>(`/api/shipments/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
}

export function useUpdateShipmentStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            status,
            driverId,
            vehicleId
        }: {
            id: string;
            status?: ShipmentStatus;
            driverId?: string;
            vehicleId?: string;
        }) => {
            return api.patch<{ data: Shipment; meta?: any }>(`/api/shipments/${id}`, {
                status,
                driverId,
                vehicleId
            });
        },
        onSuccess: (data) => {
            // Invalidate specific shipment
            queryClient.invalidateQueries({ queryKey: queryKeys.shipments.detail(data.data.id) });
            // Invalidate list
            queryClient.invalidateQueries({ queryKey: queryKeys.shipments.list() });

            // Intelligent invalidation based on backend metadata
            if (data.meta?.driverUpdated) {
                queryClient.invalidateQueries({ queryKey: queryKeys.drivers.list() });
            }
            if (data.meta?.vehicleUpdated) {
                queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.list() });
                queryClient.invalidateQueries({ queryKey: queryKeys.fleet.all });
            }
            if (data.meta?.analyticsUpdated) {
                queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
                queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
            }
        },
    });
}

export function useCreateShipment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: Partial<Shipment>) => {
            return api.post<{ data: Shipment }>("/api/shipments", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shipments.list() });
        },
    });
}
