import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { queryKeys } from "../queryKeys";
import { Shipment } from "./useShipments";
import { Driver } from "./useDrivers";
import { Vehicle } from "./useVehicles";

export type TripSheetStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "CANCELLED" | "SETTLED";

export interface TripSheet {
    id: string;
    sheetNo: string;
    status: TripSheetStatus;

    driverId: string;
    vehicleId: string;
    createdById: string;

    startOdometerKm?: number;
    endOdometerKm?: number;
    startedAt?: string;
    endedAt?: string;

    startLocation?: string;
    endLocation?: string;
    routeDescription?: string;

    fuelAtStart?: number;
    fuelAtEnd?: number;

    // Expense tracking (in cents)
    fuelExpenseCents?: number;
    tollExpenseCents?: number;
    otherExpenseCents?: number;
    totalExpenseCents?: number;

    // Revenue & Profit
    totalRevenueCents?: number;
    netProfitCents?: number;
    cashBalanceCents?: number;
    settledAt?: string;

    // Advanced Trip Costing (in cents)
    driverAdvanceCents?: number;
    driverAllowanceCents?: number;
    loadingUnloadingCents?: number;
    policeExpenseCents?: number;
    adBlueExpenseCents?: number;

    notes?: string;

    shipments?: {
        shipmentId: string;
        tripSheetId: string;
        sequence: number;
        shipment: Shipment;
    }[];

    driver?: Driver;
    vehicle?: Vehicle;
    createdBy?: { id: string; name: string | null; email: string };

    createdAt: string;
    updatedAt: string;
}

export function useTripSheets() {
    return useQuery({
        queryKey: queryKeys.tripSheets.list(),
        queryFn: async () => {
            const res = await api.get<{ data: TripSheet[] }>("/api/trip-sheets");
            return res.data;
        },
        staleTime: 5000,
    });
}

export function useTripSheet(id: string) {
    return useQuery({
        queryKey: queryKeys.tripSheets.detail(id),
        queryFn: async () => {
            const res = await api.get<{ data: TripSheet }>(`/api/trip-sheets/${id}`);
            return res.data;
        },
        enabled: !!id,
    });
}

export function useCreateTripSheet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: Partial<TripSheet> & { shipmentIds?: string[] }) => {
            return api.post<{ data: TripSheet }>("/api/trip-sheets", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tripSheets.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.shipments.list() }); // Because status changes
        },
    });
}

export function useUpdateTripSheetStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: TripSheetStatus }) => {
            return api.patch<{ data: TripSheet }>(`/api/trip-sheets/${id}/status`, { status });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tripSheets.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.tripSheets.detail(data.data.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.shipments.list() });
        },
    });
}

export function useUpdateTripSheet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            ...data
        }: { id: string } & Partial<TripSheet> & { shipmentIds?: string[] }) => {
            return api.patch<{ data: TripSheet }>(`/api/trip-sheets/${id}`, data);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tripSheets.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.tripSheets.detail(data.data.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.shipments.list() });
        },
    });
}

export function useSettleTripSheet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            return api.post<{ data: TripSheet }>(`/api/trip-sheets/${id}/settle`, {});
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tripSheets.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.tripSheets.detail(data.data.id) });
        },
    });
}


