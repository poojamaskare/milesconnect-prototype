"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useShipments } from "../hooks/useShipments";
import { useDrivers } from "../hooks/useDrivers";
import { useVehicles } from "../hooks/useVehicles";

interface FleetTelemetry {
    activeShipmentsCount: number;
    availableDriversCount: number;
    activeVehiclesCount: number;
    maintenanceVehiclesCount: number;
    idleVehiclesCount: number;
    totalVehiclesCount: number;
    totalRevenueCents: number; // Placeholder or calculated
}

interface LogisticsContextValue {
    telemetry: FleetTelemetry;
    isLoading: boolean;
}

const LogisticsContext = createContext<LogisticsContextValue | null>(null);

export function useLogistics() {
    const context = useContext(LogisticsContext);
    if (!context) {
        throw new Error("useLogistics must be used within a LogisticsProvider");
    }
    return context;
}

export function LogisticsProvider({ children }: { children: ReactNode }) {
    // Subscribe to core data sources
    const { data: shipments, isLoading: loadingShipments } = useShipments();
    const { data: drivers, isLoading: loadingDrivers } = useDrivers();
    const { data: vehicles, isLoading: loadingVehicles } = useVehicles();

    const telemetry = useMemo(() => {
        const activeShipments = shipments?.data?.filter(s => s.status === 'IN_TRANSIT') || [];
        const availableDrivers = drivers?.filter(d => d.isAvailable) || [];
        const activeVehicles = vehicles?.filter(v => v.computedStatus === 'IN_USE') || [];
        const maintenanceVehicles = vehicles?.filter(v => v.status === 'MAINTENANCE') || [];
        const idleVehicles = vehicles?.filter(v => v.computedStatus === 'AVAILABLE') || [];

        return {
            activeShipmentsCount: activeShipments.length,
            availableDriversCount: availableDrivers.length,
            activeVehiclesCount: activeVehicles.length,
            maintenanceVehiclesCount: maintenanceVehicles.length,
            idleVehiclesCount: idleVehicles.length,
            totalVehiclesCount: vehicles?.length || 0,
            totalRevenueCents: 0, // Would come from invoices
        };
    }, [shipments, drivers, vehicles]);

    const value = useMemo(() => ({
        telemetry,
        isLoading: loadingShipments || loadingDrivers || loadingVehicles
    }), [telemetry, loadingShipments, loadingDrivers, loadingVehicles]);

    return (
        <LogisticsContext.Provider value={value}>
            {children}
        </LogisticsContext.Provider>
    );
}
