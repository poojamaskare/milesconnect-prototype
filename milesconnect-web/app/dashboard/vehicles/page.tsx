"use client";

import { useMemo, useState } from "react";
import { type Vehicle, useVehicles } from "@/lib/hooks/useVehicles";
import { WidgetErrorBoundary } from "@/components/WidgetErrorBoundary";

function VehicleStatusPill({ status }: { status: Vehicle["computedStatus"] }) {
  const color =
    status === "AVAILABLE"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400"
      : status === "IN_USE"
        ? "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400"
        : status === "MAINTENANCE"
          ? "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-400"
          : "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${color}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

import { Modal } from "@/components/ui/Modal";
import { AssignVehicleDriverForm } from "./components/AssignVehicleDriverForm";
import { MaintenanceHistoryModal } from "./components/MaintenanceHistoryModal";

// ... existing helper functions (VehicleStatusPill) ...

export default function VehiclesPage() {
  const { data: vehicles = [], isLoading, isError } = useVehicles();
  const [filter, setFilter] = useState("ALL");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [maintenanceVehicle, setMaintenanceVehicle] = useState<Vehicle | null>(null);

  const filteredVehicles = useMemo(() => {
    if (filter === "ALL") return vehicles;
    return vehicles.filter((v) => v.computedStatus === filter);
  }, [vehicles, filter]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading fleet data...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-rose-500">
        Failed to load fleet data.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Vehicles</h1>
          <p className="text-sm text-muted-foreground">Manage your fleet assignments</p>
        </div>
        <div className="flex gap-2">
          {["ALL", "AVAILABLE", "IN_USE", "MAINTENANCE"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${filter === s
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <WidgetErrorBoundary title="Vehicles List">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {vehicle.registrationNumber}
                  </h3>
                  <p className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model}</p>
                </div>
                <VehicleStatusPill status={vehicle.computedStatus} />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Load Capacity</span>
                  <span className="font-medium text-foreground">{vehicle.capacityKg} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Assigned Driver</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {vehicle.primaryDriver?.user?.name || "Unassigned"}
                    </span>
                    <button
                      onClick={() => setSelectedVehicle(vehicle)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      {vehicle.primaryDriver ? "Edit" : "Assign"}
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => setMaintenanceVehicle(vehicle)}
                      className="text-xs text-slate-600 hover:text-slate-900 hover:underline"
                    >
                      History
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                  <span className="text-xs text-muted-foreground font-mono">ID</span>
                  <span className="text-xs font-mono text-muted-foreground truncate max-w-[150px]" title={vehicle.id}>
                    {vehicle.id}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </WidgetErrorBoundary>

      <Modal
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        title={`Assign Driver - ${selectedVehicle?.registrationNumber}`}
      >
        {selectedVehicle && (
          <AssignVehicleDriverForm
            vehicleId={selectedVehicle.id}
            currentDriverId={selectedVehicle.primaryDriver?.id}
            onSuccess={() => setSelectedVehicle(null)}
            onCancel={() => setSelectedVehicle(null)}
          />
        )}
      </Modal>

      {maintenanceVehicle && (
        <MaintenanceHistoryModal
          vehicleId={maintenanceVehicle.id}
          vehicleReg={maintenanceVehicle.registrationNumber}
          onClose={() => setMaintenanceVehicle(null)}
        />
      )}
    </div>
  );
}
