"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type TripSheetStatus = "Draft" | "Submitted" | "Approved";

type TripSheet = {
  id: string;
  dbId: string;
  date: string; // YYYY-MM-DD
  vehicleNumber: string;
  driverName: string;
  startTime: string;
  endTime: string;
  distanceKm: number;
  status: TripSheetStatus;
};

type ApiTripSheet = {
  id: string;
  sheetNo: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "CANCELLED";
  startedAt: string | null;
  endedAt: string | null;
  startOdometerKm: number | null;
  endOdometerKm: number | null;
  createdAt: string;
  vehicle: { registrationNumber: string };
  driver: { user: { name: string | null; email: string } };
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toDateYmd(iso: string | null, fallbackIso: string) {
  const d = new Date(iso ?? fallbackIso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toTimeHm(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function mapStatus(status: ApiTripSheet["status"]): TripSheetStatus {
  if (status === "APPROVED") return "Approved";
  if (status === "SUBMITTED") return "Submitted";
  return "Draft";
}

async function fetchTripSheets(): Promise<TripSheet[]> {
  const res = await api.get<{ data: ApiTripSheet[] }>("/api/trip-sheets");
  const items = res?.data ?? [];
  return items.map((t) => {
    const distanceKm =
      t.startOdometerKm !== null && t.endOdometerKm !== null
        ? Math.max(0, t.endOdometerKm - t.startOdometerKm)
        : 0;
    return {
      id: t.sheetNo,
      dbId: t.id,
      date: toDateYmd(t.startedAt, t.createdAt),
      vehicleNumber: t.vehicle.registrationNumber,
      driverName: t.driver.user.name ?? t.driver.user.email,
      startTime: toTimeHm(t.startedAt),
      endTime: toTimeHm(t.endedAt),
      distanceKm,
      status: mapStatus(t.status),
    };
  });
}

async function createTripSheetsFromShipments() {
  // Placeholder user ID - in production, get from auth context
  const createdById = "00000000-0000-0000-0000-000000000001";
  return api.post("/api/trip-sheets/create-from-shipments", { createdById });
}

function Card({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-foreground/10 bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-foreground/10 p-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs text-foreground/60">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Button({ 
  children,
  onClick,
  variant = "default",
}: { 
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary";
}) {
  const baseClasses = "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-foreground/30";
  const variantClasses = variant === "primary"
    ? "bg-foreground text-background hover:bg-foreground/90"
    : "border border-foreground/10 bg-card text-foreground hover:bg-foreground/5";
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${variantClasses}`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: TripSheetStatus }) {
  const classes =
    status === "Approved"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : status === "Submitted"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${classes}`}
    >
      {status}
    </span>
  );
}

function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
        Date
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-foreground/10 bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
      />
    </label>
  );
}

export default function TripSheetsClient() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState("2025-12-23");

	const tripSheetsQuery = useQuery({
		queryKey: ["trip-sheets"],
		queryFn: fetchTripSheets,
	});

  const createFromShipmentsMutation = useMutation({
    mutationFn: createTripSheetsFromShipments,
    onSuccess: (data: any) => {
      tripSheetsQuery.refetch();
      alert(data?.message || "Trip sheets created successfully!");
    },
    onError: () => {
      alert("Failed to create trip sheets from shipments");
    },
  });

	const allTrips = tripSheetsQuery.data ?? [];

  const tripsForDate = useMemo(
    () => allTrips.filter((t) => t.date === selectedDate),
    [allTrips, selectedDate]
  );

  const handleEditClick = (tripDbId: string) => {
    router.push(`/trip-sheets/${tripDbId}/edit`);
  };

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Trip Sheets</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Daily fleet operations trip sheets by date.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateInput value={selectedDate} onChange={setSelectedDate} />
          <Button onClick={() => createFromShipmentsMutation.mutate()} variant="default">
            {createFromShipmentsMutation.isPending ? "Creating..." : "Create from Shipments"}
          </Button>
          <Button onClick={() => router.push("/trip-sheets/create")} variant="primary">
            Create Trip Sheet
          </Button>
        </div>
      </div>

      <Card
        title="Trip Sheets"
        description={`Showing ${tripsForDate.length} trip sheet(s) for ${selectedDate}.`}
      >
        {tripSheetsQuery.isError ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
          Failed to load trip sheets.
        </div>
      ) : null}

      {tripSheetsQuery.isLoading ? (
        <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/70">
          Loading trip sheets…
        </div>
      ) : null}

        {tripsForDate.length === 0 ? (
          <div className="rounded-xl border border-sky-500/15 bg-sky-500/5 p-6 text-center">
            <div className="text-sm font-semibold text-foreground">No trip sheets</div>
            <div className="mt-1 text-xs text-foreground/60">
              Create a trip sheet to start logging today’s routes.
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {tripsForDate.map((trip) => (
              <article
                key={trip.id}
                className="rounded-xl border border-foreground/10 bg-card p-4 hover:border-foreground/20 transition cursor-pointer"
                onClick={() => handleEditClick(trip.dbId)}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-foreground">
                        {trip.vehicleNumber}
                      </div>
                      <StatusBadge status={trip.status} />
                    </div>
                    <div className="mt-1 text-xs text-foreground/60">{trip.id}</div>
                  </div>

                  <div className="text-right text-xs text-foreground/60">
                    <div>
                      {trip.startTime} – {trip.endTime}
                    </div>
                    <div className="mt-1">
                      <span className="text-foreground">{trip.distanceKm} km</span>
                      <span className="text-foreground/60"> traveled</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">
                      Driver
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {trip.driverName}
                    </div>
                  </div>
                  <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">
                      Start & End
                    </div>
                    <div className="mt-1 text-sm text-foreground">
                      {trip.startTime} – {trip.endTime}
                    </div>
                  </div>
                  <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">
                      Distance
                    </div>
                    <div className="mt-1 text-sm text-foreground">{trip.distanceKm} km</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
