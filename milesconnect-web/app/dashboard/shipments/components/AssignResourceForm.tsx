"use client";

import { useState } from "react";
import { useDrivers } from "@/lib/hooks/useDrivers";
import { useVehicles } from "@/lib/hooks/useVehicles";
import { useUpdateShipmentStatus } from "@/lib/hooks/useShipments";
import { toast } from "sonner";

interface AssignResourceFormProps {
    shipmentId: string;
    currentDriverId?: string; // or null
    currentVehicleId?: string; // or null
    onSuccess: () => void;
    onCancel: () => void;
}

export function AssignResourceForm({
    shipmentId,
    currentDriverId,
    currentVehicleId,
    onSuccess,
    onCancel,
}: AssignResourceFormProps) {
    const { data: drivers = [], isLoading: isLoadingDrivers } = useDrivers();
    const { data: vehicles = [], isLoading: isLoadingVehicles } = useVehicles();
    const mutation = useUpdateShipmentStatus();

    const [driverId, setDriverId] = useState(currentDriverId || "");
    const [vehicleId, setVehicleId] = useState(currentVehicleId || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(
            {
                id: shipmentId,
                driverId: driverId || undefined,
                vehicleId: vehicleId || undefined,
            },
            {
                onSuccess: () => {
                    toast.success("Resources assigned successfully");
                    onSuccess();
                },
                onError: (err) => {
                    toast.error("Assignment Failed: " + err.message);
                },
            }
        );
    };

    const availableDrivers = drivers.filter(d => d.currentStatus === "AVAILABLE" || d.id === currentDriverId);
    const availableVehicles = vehicles; // status filtering if needed

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                    Assign Driver
                </label>
                <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                >
                    <option value="">-- Unassigned --</option>
                    {availableDrivers.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.user?.name || "Unknown"} ({d.licenseNumber})
                        </option>
                    ))}
                </select>
                {isLoadingDrivers && <p className="text-xs text-muted-foreground">Loading drivers...</p>}
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                    Assign Vehicle
                </label>
                <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                >
                    <option value="">-- Unassigned --</option>
                    {availableVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                            {v.registrationNumber} - {v.make} {v.model}
                        </option>
                    ))}
                </select>
                {isLoadingVehicles && <p className="text-xs text-muted-foreground">Loading vehicles...</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="px-3 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
                >
                    {mutation.isPending ? "Assigning..." : "Confirm Assignment"}
                </button>
            </div>
        </form>
    );
}
