import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { queryKeys } from "../queryKeys";
import type { Shipment } from "./useShipments";

export interface Vehicle {
    id: string;
    registrationNumber: string;
    vin: string | null;
    make: string | null;
    model: string | null;
    capacityKg: number | null;
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
    computedStatus: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'INACTIVE';
    name: string | null;
    imageUrl: string | null;
    currentShipment: Shipment | null;
    primaryDriver?: {
        id: string;
        user: {
            name: string | null;
        };
    } | null;
}

export function useVehicles() {
    return useQuery({
        queryKey: queryKeys.vehicles.list(),
        queryFn: async () => {
            const res = await api.get<{ data: Vehicle[] }>("/api/vehicles");
            return res.data;
        },
        staleTime: 10000,
    });
}

export function useVehicle(id: string) {
    return useQuery({
        queryKey: queryKeys.vehicles.detail(id),
        queryFn: async () => {
            const res = await api.get<{ data: Vehicle }>(`/api/vehicles/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
}

export function useUpdateVehicle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<Vehicle> & { id: string }) => {
            return api.patch<{ data: Vehicle }>(`/api/vehicles/${id}`, data);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(data.data.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.fleet.all });
        },
    });
}

export function useCreateVehicle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            registrationNumber: string;
            make: string;
            model: string;
            year: number;
            capacityKg?: number;
            fuelType: string;
            status: string;
        }) => {
            return api.post<{ data: Vehicle }>("/api/vehicles", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.fleet.all });
        },
    });
}

export function useDeleteVehicle() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/api/vehicles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.fleet.all });
        },
    });
}
