"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : tone === "warning"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "border-foreground/10 bg-card text-foreground/80";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${classes}`}
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
    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-foreground/30";
  const classes =
    variant === "primary"
      ? "bg-foreground text-background hover:bg-foreground/90"
      : "border border-foreground/10 bg-card text-foreground hover:bg-foreground/5";

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
      ? "bg-emerald-500/60"
      : perfTone === "warning"
        ? "bg-amber-500/60"
        : "bg-sky-500/50";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full rounded-xl border border-foreground/10 bg-card p-4 text-left outline-none transition hover:bg-foreground/[0.03] focus-visible:ring-2 focus-visible:ring-foreground/30"
      aria-label={`View ${driver.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {driver.name}
          </div>
          <div className="mt-1 text-xs text-foreground/60">{driver.licenseNumber}</div>
        </div>
        <div className="shrink-0">
          <TonePill tone={statusTone(driver.status)}>{driver.status}</TonePill>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
              Performance
            </div>
            <TonePill tone={scoreTone(pct)}>{pct}/100</TonePill>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className={`h-full rounded-full ${perfBarClass}`}
              style={{ width: `${pct}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Assigned Vehicle
          </div>
          <span className="truncate text-sm font-semibold text-foreground">
            {driver.assignedVehicle}
          </span>
        </div>
      </div>

      <div className="mt-4 text-xs text-foreground/60 group-hover:text-foreground/70">
        Open details
      </div>
    </button>
  );
}

function DriverDetailModal({
  driver,
  onClose,
}: {
  driver: Driver;
  onClose: () => void;
}) {
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
              Placeholder modal (details coming soon)
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
              This modal will eventually include contact info, recent trips, safety
              events, and documents.
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => alert(`Edit ${driver.id} (mock)`) }
            >
              Edit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriversPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  const driversQuery = useQuery({
    queryKey: ["drivers"],
    queryFn: fetchDrivers,
  });

  const drivers = driversQuery.data ?? [];

  const openDriver = useMemo(() => {
    if (!openId) return null;
    return drivers.find((d) => d.id === openId) ?? null;
  }, [openId, drivers]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Drivers</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Manage drivers and review assignment + performance.
        </p>
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
            onOpen={() => setOpenId(driver.id)}
          />
        ))}
      </div>

      {openDriver ? (
        <DriverDetailModal driver={openDriver} onClose={() => setOpenId(null)} />
      ) : null}
    </div>
  );
}
