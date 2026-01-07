"use client";

import { useState } from "react";
import { useDrivers } from "@/lib/hooks/useDrivers";
import { useVehicles } from "@/lib/hooks/useVehicles";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";

interface AssignVehicleDriverFormProps {
    vehicleId: string;
    currentDriverId?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function AssignVehicleDriverForm({
    vehicleId,
    currentDriverId,
    onSuccess,
    onCancel,
}: AssignVehicleDriverFormProps) {
    const { data: drivers = [], isLoading: isLoadingDrivers } = useDrivers();
    const queryClient = useQueryClient();

    // Define local mutation if useVehicles doesn't have it (likely)
    const mutation = useMutation({
        mutationFn: async (payload: { primaryDriverId: string | null }) => {
            return api.patch(`/api/vehicles/${vehicleId}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.list() });
            queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(vehicleId) });
            toast.success("Driver assignment updated");
            onSuccess();
        },
        onError: (err) => {
            toast.error("Failed to update driver: " + err.message);
        }
    });

    // State
    const [driverId, setDriverId] = useState(currentDriverId || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({ primaryDriverId: driverId || null });
    };

    const availableDrivers = drivers; // All drivers can be candidates, or maybe just non-assigned ones? 
    // Ideally show all, and if they are busy, maybe warn? But primary driver is a loose association usually.

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                    Primary Driver
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
                    {mutation.isPending ? "Saving..." : "Save Assignment"}
                </button>
            </div>
        </form>
    );
}
