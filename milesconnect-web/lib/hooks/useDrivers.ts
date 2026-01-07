import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { queryKeys } from "../queryKeys";
import type { Shipment } from "./useShipments";

export interface Driver {
    id: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
    licenseNumber: string;
    phone: string | null;
    isActive: boolean;
    isAvailable: boolean; // Calculated field
    currentStatus: 'AVAILABLE' | 'BUSY' | 'INACTIVE';
    currentShipment: Shipment | null;
    performanceScore: number;
    totalTrips: number;
}

export function useDrivers(sort?: string) {
    return useQuery({
        queryKey: [...queryKeys.drivers.list(), sort],
        queryFn: async () => {
            const query = sort ? `?sort=${sort}` : "";
            const res = await api.get<{ data: Driver[] }>(`/api/drivers${query}`);
            return res.data;
        },
        staleTime: 10000, // 10 seconds
    });
}

export function useDriver(id: string) {
    return useQuery({
        queryKey: queryKeys.drivers.detail(id),
        queryFn: async () => {
            const res = await api.get<{ data: Driver }>(`/api/drivers/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
}

// Logic for assigning implies updating a shipment, which we handle in useShipments.
// But we might want to update driver profile itself.
export function useUpdateDriver() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<Driver> & { id: string }) => {
            return api.patch<{ data: Driver }>(`/api/drivers/${id}`, data);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.drivers.detail(data.data.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.drivers.list() });
        },
    });
}
