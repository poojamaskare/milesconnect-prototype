
"use client";

import Link from "next/link";
import { WidgetErrorBoundary } from "../../../components/WidgetErrorBoundary";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useVehicles } from "@/lib/hooks/useVehicles";

// Dynamic import for Mapbox to avoid SSR issues
const FleetMap = dynamic(() => import("./FleetMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-sm text-foreground/60">Loading map...</div>
    </div>
  ),
});

type VehicleFilter = "Active" | "Idle" | "Maintenance";

type LegendItem = {
  label: VehicleFilter;
  description: string;
  dotClassName: string;
};

/* Removed unused ApiVehicle and fetchVehicleStatuses */
function toFilter(v: any): VehicleFilter {
  // Check computedStatus first as it's more accurate for UI
  if (v.computedStatus === 'MAINTENANCE' || v.status === 'MAINTENANCE') return "Maintenance";
  if (v.computedStatus === 'IN_USE') return "Active";
  return "Idle";
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
    <section className="rounded-xl border border-foreground/10 border-t-2 border-t-sky-500/20 bg-card">
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

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-foreground/30";

  const cls = active
    ? "border border-sky-500/20 bg-sky-500/10 text-sky-600 hover:bg-sky-500/15 dark:text-sky-300"
    : "border border-foreground/10 bg-card text-foreground hover:bg-foreground/5";

  return (
    <button type="button" onClick={onClick} className={`${base} ${cls}`}>
      {children}
    </button>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={`mt-0.5 h-2.5 w-2.5 rounded-full ${className}`} />;
}

export default function FleetMapPage() {
  const allFilters: VehicleFilter[] = useMemo(
    () => ["Active", "Idle", "Maintenance"],
    []
  );

  const [filters, setFilters] = useState<Set<VehicleFilter>>(
    () => new Set(allFilters)
  );

  /* Shared hook for SSOT */
  const { data: vehiclesData, isLoading, isError } = useVehicles();
  const vehiclesQuery = { isLoading, isError, data: vehiclesData }; // Adapter for existing code structure

  const vehicles = vehiclesData ?? [];
  const counts = useMemo(() => {
    const out: Record<VehicleFilter, number> = {
      Active: 0,
      Idle: 0,
      Maintenance: 0,
    };
    for (const v of vehicles) {
      const f = toFilter(v);
      out[f] += 1;
    }
    return out;
  }, [vehicles]);

  const filteredTotal = useMemo(() => {
    if (filters.size === 0) return 0;
    let n = 0;
    for (const v of vehicles) {
      if (filters.has(toFilter(v))) n += 1;
    }
    return n;
  }, [filters, vehicles]);

  const legend: LegendItem[] = useMemo(
    () => [
      {
        label: "Active",
        description: "Moving / on route",
        dotClassName: "bg-emerald-500",
      },
      {
        label: "Idle",
        description: "Stopped / waiting",
        dotClassName: "bg-amber-500",
      },
      {
        label: "Maintenance",
        description: "Unavailable",
        dotClassName: "bg-rose-500",
      },
    ],
    []
  );

  function toggleFilter(value: VehicleFilter) {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  const activeFiltersLabel = useMemo(() => {
    const enabled = allFilters.filter((f) => filters.has(f));
    if (enabled.length === 0) return "None";
    if (enabled.length === allFilters.length) return "All";
    return enabled.join(", ");
  }, [allFilters, filters]);

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Fleet Map</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Live vehicle tracking with real-time position updates
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card
          title="Live Map"
          description="Real-time vehicle positions on their routes"
          action={
            <div className="text-xs text-foreground/60">
              Filters: <span className="text-foreground">{activeFiltersLabel}</span>
              {vehiclesQuery.isLoading ? (
                <span className="ml-2">• Loading…</span>
              ) : vehiclesQuery.isError ? (
                <span className="ml-2">• Failed to load</span>
              ) : (
                <span className="ml-2">
                  • Showing <span className="text-foreground">{filteredTotal}</span>
                </span>
              )}
            </div>
          }
        >
          <div
            className="relative h-[520px] w-full overflow-hidden rounded-xl border border-sky-500/15"
            role="region"
            aria-label="Fleet tracking map"
          >
            <WidgetErrorBoundary title="Fleet Map">
              <FleetMap filters={filters} />
            </WidgetErrorBoundary>
          </div>
        </Card>

        <div className="space-y-4">
          <Card
            title="Filters"
            description="Use these to filter vehicles before rendering markers."
          >
            <div className="flex flex-wrap gap-2">
              {allFilters.map((f) => (
                <ToggleButton
                  key={f}
                  active={filters.has(f)}
                  onClick={() => toggleFilter(f)}
                >
                  {f}
                </ToggleButton>
              ))}
            </div>
            <div className="mt-3 text-xs text-foreground/60">
              Tip: Keep this state in sync with map source layers.
            </div>
          </Card>

          <Card
            title="Vehicle Status"
            description="Legend for marker styling and quick scanning."
          >
            <div className="space-y-3">
              {legend.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2">
                    <Dot className={item.dotClassName} />
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {item.label}
                      </div>
                      <div className="text-xs text-foreground/60">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-foreground/60">
                    {vehiclesQuery.isLoading ? "…" : vehiclesQuery.isError ? "—" : counts[item.label]}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
