"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

type DriverStatus = "Available" | "On Trip" | "Off Duty" | "On Break";

type Driver = {
  id: string;
  licenseNumber: string;
  name: string;
  status: DriverStatus;
  performanceScore: number; // 0-100
  assignedVehicle: string;
};

type ApiDriver = {
  id: string;
  licenseNumber: string;
  isActive: boolean;
  user: { id: string; name: string | null; email: string };
  vehicles: Array<{ id: string; registrationNumber: string; status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" }>;
  shipments: Array<{ id: string; status: "DRAFT" | "PLANNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED" }>;
  tripSheets: Array<{ id: string; status: "DRAFT" | "SUBMITTED" | "APPROVED" | "CANCELLED"; startedAt: string | null; endedAt: string | null }>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function deriveDriverStatus(d: ApiDriver): DriverStatus {
  if (!d.isActive) return "Off Duty";

  const hasActiveShipment = d.shipments.some(
    (s) => s.status === "IN_TRANSIT" || s.status === "PLANNED"
  );
  if (hasActiveShipment) return "On Trip";

  const hasOpenTripSheet = d.tripSheets.some((t) => t.startedAt && !t.endedAt);
  if (hasOpenTripSheet) return "On Trip";

  return "Available";
}

function derivePerformanceScore(d: ApiDriver): number {
  const delivered = d.shipments.filter((s) => s.status === "DELIVERED").length;
  const cancelled = d.shipments.filter((s) => s.status === "CANCELLED").length;
  const inTransit = d.shipments.filter((s) => s.status === "IN_TRANSIT").length;
  return clamp(78 + delivered * 4 + inTransit * 2 - cancelled * 8, 40, 100);
}

async function fetchDrivers(): Promise<Driver[]> {
  const res = await api.get<{ data: ApiDriver[] }>("/api/drivers");
  const drivers = res?.data ?? [];
  return drivers.map((d) => ({
    id: d.id,
    licenseNumber: d.licenseNumber,
    name: d.user.name ?? d.user.email,
    status: deriveDriverStatus(d),
    performanceScore: derivePerformanceScore(d),
    assignedVehicle: d.vehicles[0]?.registrationNumber ?? "—",
  }));
}

function TonePill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "neutral";
  children: React.ReactNode;
}) {
  const classes =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
      : tone === "warning"
        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
        : "bg-foreground/5 text-foreground/60 border-foreground/10";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${classes}`}
    >
      {children}
    </span>
  );
}

function statusTone(status: DriverStatus): "success" | "warning" | "neutral" {
  if (status === "Available") return "success";
  if (status === "On Trip" || status === "On Break") return "warning";
  return "neutral";
}

function scoreTone(score: number): "success" | "warning" | "neutral" {
  if (score >= 90) return "success";
  if (score >= 75) return "warning";
  return "neutral";
}

function Button({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-foreground/30";
  const classes =
    variant === "primary"
      ? "bg-foreground text-background shadow-md hover:bg-foreground/90 active:translate-y-0.5"
      : "border border-foreground/10 bg-card text-foreground hover:bg-foreground/5 active:bg-foreground/10";

  return (
    <button type="button" onClick={onClick} className={`${base} ${classes}`}>
      {children}
    </button>
  );
}

function DriverCard({
  driver,
  onOpen,
}: {
  driver: Driver;
  onOpen: () => void;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(driver.performanceScore)));
  const perfTone = scoreTone(pct);
  const perfBarClass =
    perfTone === "success"
      ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
      : perfTone === "warning"
        ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
        : "bg-sky-500/50";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full flex flex-col rounded-xl border border-foreground/10 bg-card p-4 text-left outline-none transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-foreground/30"
      aria-label={`View ${driver.name}`}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-foreground/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-foreground">
            {driver.name}
          </div>
          <div className="mt-1 text-xs font-medium text-foreground/50">{driver.licenseNumber}</div>
        </div>
        <div className="shrink-0">
          <TonePill tone={statusTone(driver.status)}>{driver.status}</TonePill>
        </div>
      </div>

      <div className="relative mt-4 grid gap-3">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">
              Performance
            </div>
            <div className={`text-xs font-bold ${perfTone === 'success' ? 'text-emerald-500' : 'text-foreground'}`}>
              {pct}/100
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${perfBarClass}`}
              style={{ width: `${pct}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-foreground/5 pt-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">
            Assigned Vehicle
          </div>
          <span className="truncate text-sm font-medium text-foreground">
            {driver.assignedVehicle}
          </span>
        </div>
      </div>
    </button>
  );
}

function DriverDetailModal({
  driver,
  onClose,
  onDelete,
  isDeleting,
  deleteError,
}: {

  driver: Driver;
  onClose: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  deleteError: string | null;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (isConfirming) {
    return (
      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
        <button
          type="button"
          className="absolute inset-0 bg-foreground/20"
          aria-label="Close"
          onClick={onClose}
        />
        <div className="absolute left-1/2 top-1/2 w-[min(92vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-foreground/10 bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Delete Driver?</h2>
          <p className="mt-2 text-sm text-foreground/60">
            Are you sure you want to delete <span className="font-semibold text-foreground">{driver.name}</span>? This action cannot be undone.
          </p>

          {deleteError ? (
            <div className="mt-3 rounded-md bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-400">
              {deleteError}
            </div>
          ) : null}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsConfirming(false)}>
              Cancel
            </Button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center rounded-md bg-rose-500 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/20"
        aria-label="Close driver details"
        onClick={onClose}
      />

      <div className="absolute left-1/2 top-1/2 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-foreground/10 bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-foreground/10 pb-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              Driver Details · {driver.name}
            </div>
            <div className="mt-1 text-xs text-foreground/60">
              {driver.licenseNumber}
            </div>
          </div>
          <div className="shrink-0">
            <TonePill tone={statusTone(driver.status)}>{driver.status}</TonePill>
          </div>
        </div>

        <div className="pt-3">
          <div className="grid gap-3 rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-sm text-foreground/80">
            <div className="flex items-center justify-between gap-3">
              <span className="text-foreground/60">Performance score</span>
              <span className="font-semibold text-foreground">
                {driver.performanceScore}/100
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-foreground/60">Assigned vehicle</span>
              <span className="font-semibold text-foreground">
                {driver.assignedVehicle}
              </span>
            </div>
            <div className="text-xs text-foreground/60">
              Manage driver status and details here.
            </div>
          </div>

          <div className="mt-4 flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              disabled={isDeleting}
              className="inline-flex items-center justify-center rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-500/20 disabled:opacity-50"
            >
              Delete Driver
            </button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => alert(`Edit ${driver.id} (mock)`)}
              >
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriversPage() {
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);

  const driversQuery = useQuery({
    queryKey: ["drivers"],
    queryFn: fetchDrivers,
  });

  const createDriverMutation = useMutation({
    mutationFn: async (newDriver: { name: string; email: string; licenseNumber: string; phone: string }) => {
      console.log("Mutate called, sending POST to /api/drivers", newDriver);
      const res = await api.post("/api/drivers", newDriver);
      console.log("API POST Response:", res);
      return res;
    },
    onSuccess: () => {
      console.log("Mutation Success!");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setCreateOpen(false);
    },
    onError: (err) => {
      console.error("Mutation Error:", err);
      alert("Failed to create driver: " + (err instanceof Error ? err.message : String(err)));
    },
  });

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteDriverMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/drivers/${id}`);
    },
    onMutate: () => {
      setDeleteError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setOpenId(null); // Close modal
    },
    onError: (err: any) => {
      console.error("Delete Error:", err);
      let message = "Failed to delete driver";
      if (err.status === 409) {
        message = "Cannot delete driver: They have active Trip Sheets or Shipments.";
      } else if (err instanceof Error) {
        message = err.message;
      }
      setDeleteError(message);
    },
  });

  const drivers = driversQuery.data ?? [];

  const openDriver = useMemo(() => {
    if (!openId) return null;
    return drivers.find((d) => d.id === openId) ?? null;
  }, [openId, drivers]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Drivers</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Manage drivers and review assignment + performance.
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          Add Driver
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {driversQuery.isError ? (
          <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
            Failed to load drivers.
          </div>
        ) : null}

        {driversQuery.isLoading ? (
          <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/70">
            Loading drivers…
          </div>
        ) : null}

        {drivers.map((driver) => (
          <DriverCard
            key={driver.id}
            driver={driver}
            onOpen={() => {
              setOpenId(driver.id);
              setDeleteError(null);
            }}
          />
        ))}
      </div>

      {openDriver ? (
        <DriverDetailModal
          driver={openDriver}
          onClose={() => setOpenId(null)}
          onDelete={() => deleteDriverMutation.mutate(openDriver.id)}
          isDeleting={deleteDriverMutation.isPending}
          deleteError={deleteError}
        />
      ) : null}

      {isCreateOpen ? (
        <CreateDriverModal
          onClose={() => setCreateOpen(false)}
          onSubmit={(data) => createDriverMutation.mutate(data)}
          isSubmitting={createDriverMutation.isPending}
        />
      ) : null}
    </div>
  );
}

function CreateDriverModal({
  onClose,
  onSubmit,
  isSubmitting,
}: {
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; licenseNumber: string; phone: string }) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/20"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-1/2 w-[min(92vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-foreground/10 bg-card p-4 shadow-sm z-50">
        <h2 className="text-lg font-semibold text-foreground">Add New Driver</h2>
        <p className="mt-1 text-xs text-foreground/60">
          Create a new driver account and profile.
        </p>

        <form
          className="mt-4 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            console.log("Form submitted locally with data:", { name, email, licenseNumber, phone });
            onSubmit({ name, email, licenseNumber, phone });
          }}
        >
          <div className="grid gap-1">
            <label className="text-xs font-semibold text-foreground/70">Full Name</label>
            <input
              required
              type="text"
              className="rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-semibold text-foreground/70">Email</label>
            <input
              required
              type="email"
              className="rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-semibold text-foreground/70">License Number</label>
            <input
              required
              type="text"
              className="rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-semibold text-foreground/70">Phone</label>
            <input
              type="tel"
              className="rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
            >
              {isSubmitting ? "Creating…" : "Create Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
