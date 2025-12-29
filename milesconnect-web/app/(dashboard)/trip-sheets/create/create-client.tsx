"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type Driver = {
  id: string;
  user: { name: string | null; email: string };
};

type Vehicle = {
  id: string;
  registrationNumber: string;
};

type Shipment = {
  id: string;
  referenceNumber: string;
  status: string;
  originAddress: string;
  destinationAddress: string;
  driver?: Driver;
  vehicle?: Vehicle;
};

async function fetchDrivers(): Promise<Driver[]> {
  const res = await api.get<{ data: Driver[] }>("/api/drivers");
  return res?.data ?? [];
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await api.get<{ data: Vehicle[] }>("/api/vehicles");
  return res?.data ?? [];
}

async function fetchShipments(): Promise<Shipment[]> {
  const res = await api.get<{ data: Shipment[] }>("/api/shipments");
  return res?.data ?? [];
}

async function createTripSheet(data: any) {
  const res = await api.post("/api/trip-sheets", data);
  return res;
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-foreground/10 bg-card">
      <div className="border-b border-foreground/10 p-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-xs text-foreground/60">{description}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function CreateTripSheetClient() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    sheetNo: `TS-${Date.now()}`,
    driverId: "",
    vehicleId: "",
    startOdometerKm: "",
    startedAt: new Date().toISOString().slice(0, 16),
    startLocation: "",
    endLocation: "",
    routeDescription: "",
    fuelAtStart: "",
    notes: "",
    shipmentIds: [] as string[],
  });

  const driversQuery = useQuery({ queryKey: ["drivers"], queryFn: fetchDrivers });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles"], queryFn: fetchVehicles });
  const shipmentsQuery = useQuery({ queryKey: ["shipments"], queryFn: fetchShipments });

  const createMutation = useMutation({
    mutationFn: createTripSheet,
    onSuccess: () => {
      router.push("/trip-sheets");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the current user ID (in a real app, this would come from auth context)
    const createdById = "00000000-0000-0000-0000-000000000001"; // Placeholder

    const payload = {
      ...formData,
      createdById,
      startOdometerKm: formData.startOdometerKm ? parseInt(formData.startOdometerKm) : undefined,
      fuelAtStart: formData.fuelAtStart ? parseFloat(formData.fuelAtStart) : undefined,
      startedAt: formData.startedAt ? new Date(formData.startedAt) : undefined,
    };

    createMutation.mutate(payload);
  };

  const handleShipmentToggle = (shipmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      shipmentIds: prev.shipmentIds.includes(shipmentId)
        ? prev.shipmentIds.filter((id) => id !== shipmentId)
        : [...prev.shipmentIds, shipmentId],
    }));
  };

  const drivers = driversQuery.data ?? [];
  const vehicles = vehiclesQuery.data ?? [];
  const shipments = shipmentsQuery.data ?? [];

  // Filter shipments that are PLANNED or IN_TRANSIT
  const availableShipments = shipments.filter(
    (s) => s.status === "PLANNED" || s.status === "IN_TRANSIT"
  );

  return (
    <main id="main" className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Create Trip Sheet</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Create a new trip sheet for tracking vehicle journeys.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Basic Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground/60">
                Sheet Number *
              </label>
              <input
                type="text"
                required
                value={formData.sheetNo}
                onChange={(e) => setFormData({ ...formData, sheetNo: e.target.value })}
                className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/60">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.startedAt}
                onChange={(e) => setFormData({ ...formData, startedAt: e.target.value })}
                className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/60">Driver *</label>
              <select
                required
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              >
                <option value="">Select driver...</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user.name ?? d.user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/60">Vehicle *</label>
              <select
                required
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card title="Route Information">
          <div className="grid gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/60">
                Start Location
              </label>
              <input
                type="text"
                value={formData.startLocation}
                onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/60">
                End Location
              </label>
              <input
                type="text"
                value={formData.endLocation}
                onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
                className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/60">
                Route Description
              </label>
              <textarea
                value={formData.routeDescription}
                onChange={(e) => setFormData({ ...formData, routeDescription: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              />
            </div>
          </div>
        </Card>

        <Card title="Vehicle & Fuel">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground/60">
                Start Odometer (km)
              </label>
              <input
                type="number"
                value={formData.startOdometerKm}
                onChange={(e) => setFormData({ ...formData, startOdometerKm: e.target.value })}
                className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/60">
                Fuel at Start (liters)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.fuelAtStart}
                onChange={(e) => setFormData({ ...formData, fuelAtStart: e.target.value })}
                className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
              />
            </div>
          </div>
        </Card>

        <Card title="Shipments" description="Select shipments to include in this trip">
          <div className="space-y-2">
            {availableShipments.length === 0 ? (
              <p className="text-sm text-foreground/60">No available shipments</p>
            ) : (
              availableShipments.map((shipment) => (
                <label
                  key={shipment.id}
                  className="flex items-start gap-3 rounded-lg border border-foreground/10 p-3 hover:bg-foreground/5"
                >
                  <input
                    type="checkbox"
                    checked={formData.shipmentIds.includes(shipment.id)}
                    onChange={() => handleShipmentToggle(shipment.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">
                      {shipment.referenceNumber}
                    </div>
                    <div className="mt-1 text-xs text-foreground/60">
                      {shipment.originAddress} → {shipment.destinationAddress}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </Card>

        <Card title="Notes">
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            placeholder="Additional notes or instructions..."
            className="w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
          />
        </Card>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background outline-none transition hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create Trip Sheet"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-md border border-foreground/10 bg-card px-4 py-2 text-sm font-semibold text-foreground outline-none transition hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-foreground/30"
          >
            Cancel
          </button>
        </div>

        {createMutation.isError ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
            Failed to create trip sheet. Please try again.
          </div>
        ) : null}
      </form>
    </main>
  );
}
