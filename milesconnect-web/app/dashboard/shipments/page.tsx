"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ShipmentStatusTimeline, {
  type ShipmentLifecycleStatus,
} from "./components/ShipmentStatusTimeline";
import { api } from "@/lib/api";

type ShipmentStatus =
  | "Created"
  | "Dispatched"
  | "In Transit"
  | "At Hub"
  | "Out for Delivery"
  | "Delivered"
  | "Delayed";

type PaymentStatus = "Paid" | "Pending" | "Overdue";

type ShipmentEvent = {
  id: string;
  label: string;
  at: string;
  location?: string;
  tone: "complete" | "current" | "upcoming";
};

type Shipment = {
  id: string;
  reference: string;
  customer: string;
  status: ShipmentStatus;
  serviceLevel: "Standard" | "Express";
  origin: { city: string; code: string };
  destination: { city: string; code: string };
  eta: { value: string; confidence: "High" | "Medium" | "Low" };
  payment: { status: PaymentStatus; amount: string; invoiceId: string };
  route: { distanceKm: number; stops: number; vehicle: string };
  timeline: ShipmentEvent[];
};

type ApiShipmentStatus = "DRAFT" | "PLANNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

type ApiShipment = {
  id: string;
  referenceNumber: string;
  originAddress: string;
  destinationAddress: string;
  status: ApiShipmentStatus;
  createdAt?: string;
  scheduledDropAt?: string | null;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  vehicle?: {
    registrationNumber?: string | null;
  } | null;
  invoice?: {
    invoiceNumber?: string;
    totalCents?: string | number | bigint;
    status?: "DRAFT" | "ISSUED" | "PAID" | "VOID";
  } | null;
};

function safeFirstToken(value: string) {
  const token = value.split(",")[0]?.trim();
  return token && token.length > 0 ? token : value;
}

function formatTimeLabel(isoOrUndefined?: string) {
  if (!isoOrUndefined) return "—";
  const d = new Date(isoOrUndefined);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatEtaLabel(isoOrUndefined?: string | null) {
  if (!isoOrUndefined) return "—";
  const d = new Date(isoOrUndefined);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function apiStatusToUi(status: ApiShipmentStatus): ShipmentStatus {
  if (status === "DRAFT") return "Created";
  if (status === "PLANNED") return "Dispatched";
  if (status === "IN_TRANSIT") return "In Transit";
  if (status === "DELIVERED") return "Delivered";
  return "Delayed";
}

function formatInr(cents: unknown) {
  if (cents === undefined || cents === null) return "—";
  try {
    const n = typeof cents === "bigint" ? Number(cents) : Number(cents);
    if (!Number.isFinite(n)) return "—";
    const rupees = n / 100;
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "INR" }).format(rupees);
  } catch {
    return "—";
  }
}

function buildTimeline(status: ShipmentStatus, createdAt?: string): ShipmentEvent[] {
  const createdLabel = formatTimeLabel(createdAt);
  const base: Array<{ id: string; label: ShipmentEvent["label"] }> = [
    { id: "e1", label: "Created" },
    { id: "e2", label: "Dispatched" },
    { id: "e3", label: "In Transit" },
    { id: "e4", label: "Delivered" },
  ];

  const currentIndex =
    status === "Created"
      ? 0
      : status === "Dispatched"
        ? 1
        : status === "In Transit" || status === "At Hub" || status === "Out for Delivery"
          ? 2
          : status === "Delivered"
            ? 3
            : 2;

  return base.map((e, idx) => ({
    id: e.id,
    label: e.label,
    at: idx === 0 ? createdLabel : "—",
    location: undefined,
    tone: idx < currentIndex ? "complete" : idx === currentIndex ? "current" : "upcoming",
  }));
}

function mapApiShipment(s: ApiShipment): Shipment {
  const status = apiStatusToUi(s.status);
  const originCity = safeFirstToken(s.originAddress);
  const destinationCity = safeFirstToken(s.destinationAddress);

  const paymentStatus: PaymentStatus =
    s.invoice?.status === "PAID"
      ? "Paid"
      : s.invoice?.status === "ISSUED"
        ? "Pending"
        : "Pending";

  return {
    id: s.id,
    reference: s.referenceNumber,
    customer: s.createdBy?.name ?? s.createdBy?.email ?? "—",
    status,
    serviceLevel: "Standard",
    origin: { city: originCity, code: "ORG" },
    destination: { city: destinationCity, code: "DST" },
    eta: {
      value: formatEtaLabel(s.scheduledDropAt),
      confidence: s.scheduledDropAt ? "Medium" : "Low",
    },
    payment: {
      status: paymentStatus,
      amount: formatInr(s.invoice?.totalCents),
      invoiceId: s.invoice?.invoiceNumber ?? "—",
    },
    route: {
      distanceKm: 0,
      stops: 0,
      vehicle: s.vehicle?.registrationNumber ?? "—",
    },
    timeline: buildTimeline(status, s.createdAt),
  };
}

async function fetchShipments(): Promise<Shipment[]> {
  const body = await api.get<{ data: ApiShipment[] }>("/api/shipments");
  const shipments = body?.data ?? [];
  return shipments.filter(Boolean).map(mapApiShipment);
}

function toLifecycleStatus(status: ShipmentStatus): ShipmentLifecycleStatus {
  if (status === "Created") return "Created";
  if (status === "Dispatched") return "Assigned";
  if (status === "Delivered") return "Delivered";
  return "In Transit";
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
      {children}
    </span>
  );
}

function TonePill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "neutral";
  children: React.ReactNode;
}) {
  const classes =
    tone === "success"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : tone === "warning"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : tone === "danger"
          ? "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300"
          : "border-foreground/10 bg-card text-foreground/80";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${classes}`}
    >
      {children}
    </span>
  );
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
          <h2 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h2>
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

function formatMatches(shipment: Shipment, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    shipment.id,
    shipment.reference,
    shipment.customer,
    shipment.origin.city,
    shipment.origin.code,
    shipment.destination.city,
    shipment.destination.code,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function statusTone(
  status: ShipmentStatus
): "success" | "warning" | "danger" | "neutral" {
  if (status === "Delivered") return "success";
  if (status === "Delayed") return "danger";
  if (status === "At Hub" || status === "Out for Delivery") return "warning";
  if (
    status === "In Transit" ||
    status === "Dispatched" ||
    status === "Created"
  )
    return "neutral";
  return "neutral";
}

function paymentTone(
  status: PaymentStatus
): "success" | "warning" | "danger" | "neutral" {
  if (status === "Paid") return "success";
  if (status === "Overdue") return "danger";
  if (status === "Pending") return "warning";
  return "neutral";
}

function etaTone(confidence: "High" | "Medium" | "Low"): "success" | "warning" | "danger" {
  if (confidence === "High") return "success";
  if (confidence === "Medium") return "warning";
  return "danger";
}

export default function ShipmentsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ShipmentStatus>("All");
  const [paymentFilter, setPaymentFilter] = useState<"All" | PaymentStatus>("All");
  const [selectedId, setSelectedId] = useState<string>("");

  const shipmentsQuery = useQuery({
		queryKey: ["shipments"],
		queryFn: fetchShipments,
	});

	const shipments = shipmentsQuery.data ?? [];

  const resolvedSelectedId = selectedId || shipments[0]?.id || "";

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      if (!formatMatches(s, query)) return false;
      if (statusFilter !== "All" && s.status !== statusFilter) return false;
      if (paymentFilter !== "All" && s.payment.status !== paymentFilter) return false;
      return true;
    });
  }, [shipments, query, statusFilter, paymentFilter]);

  const selected = useMemo(() => {
    if (!resolvedSelectedId) return null;
    const found = shipments.find((s) => s.id === resolvedSelectedId);
    return found ?? filtered[0] ?? null;
  }, [shipments, resolvedSelectedId, filtered]);

  return (
    <main id="main" className="px-4 py-6 md:ml-64">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-foreground">Shipments</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Search, filter, and review shipment details.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          {/* Left: list */}
          <Card
            title="Shipment List"
            description="Search and filter shipments"
            action={
					shipmentsQuery.isLoading ? (
						<Pill>Loading…</Pill>
					) : (
						<Pill>{filtered.length} shown</Pill>
					)
				}
          >
            <div className="space-y-3">
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                  Search
                </label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ID, reference, customer, city…"
                  className="w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-foreground/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                  >
                    <option value="All">All</option>
                    <option value="Created">Created</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="In Transit">In Transit</option>
                    <option value="At Hub">At Hub</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Payment
                  </label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value as typeof paymentFilter)}
                    className="w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                  >
                    <option value="All">All</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="h-px bg-foreground/10" />

              <div className="max-h-[520px] overflow-y-auto pr-1">
                <div className="space-y-2">
                  {shipmentsQuery.isError ? (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
              Failed to load shipments.
              <span className="ml-2 text-xs text-foreground/70">
                {String(
                  shipmentsQuery.error instanceof Error
                    ? shipmentsQuery.error.message
                    : ""
                )}
              </span>
            </div>
          ) : null}

                  {shipmentsQuery.isLoading ? (
            <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-sm text-foreground/70">
              Loading shipments…
            </div>
          ) : null}

                  {filtered.length === 0 ? (
                    <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-sm text-foreground/70">
                      No shipments match your filters.
                    </div>
                  ) : null}

                  {filtered.map((s) => {
                    const active = selected?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedId(s.id)}
                        className={`w-full rounded-lg border p-3 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-foreground/30 ${
                          active
                            ? "border-foreground/20 bg-foreground/10"
                            : "border-foreground/10 bg-card hover:bg-foreground/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground">
                              {s.reference}
                            </div>
                            <div className="mt-1 truncate text-xs text-foreground/60">
                              {s.customer}
                            </div>
                          </div>
                          <div className="shrink-0">
                            <TonePill tone={statusTone(s.status)}>{s.status}</TonePill>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-foreground/60">
                          <span className="truncate">
                            {s.origin.code} → {s.destination.code}
                          </span>
                          <span className="shrink-0">ETA: {s.eta.value}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Right: details */}
          <Card
            title={selected ? `Shipment Details · ${selected.reference}` : "Shipment Details"}
            description={selected ? selected.customer : "Select a shipment"}
            action={
              selected ? <TonePill tone={statusTone(selected.status)}>{selected.status}</TonePill> : null
            }
          >
            {selected ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <section className="rounded-xl border border-foreground/10 bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                          Route Summary
                        </div>
                        <div className="mt-2 text-sm font-semibold text-foreground">
                          {selected.origin.city} ({selected.origin.code}) → {selected.destination.city} ({selected.destination.code})
                        </div>
                        <div className="mt-2 text-xs text-foreground/60">
                          {selected.route.distanceKm} km · {selected.route.stops} stop(s) · Vehicle {selected.route.vehicle}
                        </div>
                      </div>
                      <Pill>{selected.serviceLevel}</Pill>
                    </div>
                  </section>

                  <section className="rounded-xl border border-foreground/10 bg-card p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                      ETA
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-foreground">{selected.eta.value}</div>
                      <TonePill tone={etaTone(selected.eta.confidence)}>
                        {selected.eta.confidence} confidence
                      </TonePill>
                    </div>
                    <div className="mt-2 text-xs text-foreground/60">
                      Based on last known scan + route progress (mock).
                    </div>
                  </section>
                </div>

                <section className="rounded-xl border border-foreground/10 bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                        Payment Status
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <TonePill tone={paymentTone(selected.payment.status)}>
                          {selected.payment.status}
                        </TonePill>
                        <div className="text-sm font-semibold text-foreground">{selected.payment.amount}</div>
                        <div className="text-xs text-foreground/60">Invoice {selected.payment.invoiceId}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => alert(`View ${selected.id} (mock)`) }>
                        View
                      </Button>
                      <Button variant="secondary" onClick={() => alert(`Track ${selected.id} (mock)`) }>
                        Track
                      </Button>
                      <Button variant="primary" onClick={() => alert(`Invoice ${selected.id} (mock)`) }>
                        Invoice
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-foreground/10 bg-card p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    Status Timeline
                  </div>
                  <div className="mt-3">
                    <ShipmentStatusTimeline
                      current={toLifecycleStatus(selected.status)}
                      timestamps={{
                        Created: selected.timeline[0]?.at,
                        Assigned: selected.timeline[1]?.at,
                        "In Transit": selected.timeline[2]?.at,
                        Delivered:
                          selected.status === "Delivered"
                            ? selected.timeline[selected.timeline.length - 1]?.at
                            : undefined,
                      }}
                    />
                  </div>
                </section>
              </div>
            ) : (
              <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/70">
                Select a shipment from the list to view details.
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
