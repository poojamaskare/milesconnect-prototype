"use client";

import Link from "next/link";
import KpiCard, { type KpiTrend } from "./components/KpiCard";
import FleetUtilizationChart from "./components/FleetUtilizationChart";
import { useDashboardSummary } from "../../lib/hooks/useDashboard";
import { useLogistics } from "../../lib/context/LogisticsProvider";
import { useVehicles } from "../../lib/hooks/useVehicles";
import { WidgetErrorBoundary } from "../../components/WidgetErrorBoundary";
import { ComplianceAlerts } from "./components/ComplianceAlerts";

type Kpi = {
    label: string;
    value: string;
    sublabel: string;
    trend?: KpiTrend;
    realtime?: boolean;
    href: string;
};

type Alert = {
    title: string;
    description: string;
    count: number;
    severity: "high" | "medium" | "low";
    href: string;
};

type Activity = {
    id: string;
    title: string;
    description: string;
    when: string;
    tone: "info" | "success" | "warning";
};

function formatCurrencyFromCentsString(centsString: string | number) {
    const cents = typeof centsString === 'string' ? parseInt(centsString, 10) : centsString;
    if (!Number.isFinite(cents)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

function formatRelativeWhen(iso: string) {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return "—";
    const diffMs = Date.now() - t;
    const diffMin = Math.max(0, Math.round(diffMs / 60000));
    if (diffMin < 2) return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.round(diffHr / 24);
    return `${diffDays}d ago`;
}

function TonePill({
    tone,
    children,
}: {
    tone: "positive" | "negative" | "neutral" | "high" | "medium" | "low";
    children: React.ReactNode;
}) {
    const classes =
        tone === "positive"
            ? "border-emerald-500/25 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
            : tone === "negative"
                ? "border-rose-500/25 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                : tone === "high"
                    ? "border-rose-500/25 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                    : tone === "medium"
                        ? "border-amber-500/25 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        : tone === "low"
                            ? "border-emerald-500/25 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "border-border bg-muted/50 text-muted-foreground";

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
        <section className="rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-3 border-b border-border p-4">
                <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-foreground">
                        {title}
                    </h2>
                    {description ? (
                        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                    ) : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
            <div className="p-4">{children}</div>
        </section>
    );
}

function KpiIcon({
    variant,
}: {
    variant: "shipments" | "transit" | "delivered" | "revenue";
}) {
    const common = "h-5 w-5";

    if (variant === "revenue") {
        return (
            <svg
                viewBox="0 0 24 24"
                className={common}
                fill="none"
                aria-hidden="true"
            >
                <path
                    d="M4 7h16M4 12h16M4 17h10"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                />
                <path
                    d="M18 16.5c0 1.657-1.343 3-3 3"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                />
            </svg>
        );
    }

    if (variant === "delivered") {
        return (
            <svg
                viewBox="0 0 24 24"
                className={common}
                fill="none"
                aria-hidden="true"
            >
                <path
                    d="M20 6H4v12h16V6Z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                />
                <path
                    d="m8 12 2.5 2.5L16 9"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    if (variant === "transit") {
        return (
            <svg
                viewBox="0 0 24 24"
                className={common}
                fill="none"
                aria-hidden="true"
            >
                <path
                    d="M3 7h13v10H3V7Z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                />
                <path
                    d="M16 10h3l2 3v4h-5v-7Z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                />
                <path
                    d="M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm12 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                    fill="currentColor"
                    opacity="0.6"
                />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden="true">
            <path
                d="M7 7h10v10H7V7Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
            />
            <path
                d="M7 11h10"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
            />
        </svg>
    );
}

function ActivityDot({ tone }: { tone: Activity["tone"] }) {
    const cls =
        tone === "success"
            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
            : tone === "warning"
                ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                : "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]";
    return <span className={`mt-1.5 h-2 w-2 rounded-full ${cls}`} />;
}

export default function DashboardClient() {
    const { data: summary, isLoading: isLoadingSummary } = useDashboardSummary();
    const { telemetry, isLoading: isLoadingLogistics } = useLogistics();
    const { data: vehicles } = useVehicles(); // For utilization chart details if needed, but telemetry has counts

    // Calculate Fleet Stats from Telemetry (Real-time) or Summary (Fallback)
    const carsTotal = telemetry?.totalVehiclesCount ?? vehicles?.length ?? 0;
    const carsMaint = telemetry?.maintenanceVehiclesCount ?? 0;

    // Let's use computedStatus logic mapping
    const activeCount = telemetry?.activeVehiclesCount ?? 0;
    const idleCount = telemetry?.idleVehiclesCount ?? 0;
    const maintCount = telemetry?.maintenanceVehiclesCount ?? 0;

    // Recalculate utilization based on Real-time
    const totalFleetCount = activeCount + idleCount + maintCount || carsTotal || 1;

    const utilizationPct = Math.round((activeCount / totalFleetCount) * 100);
    const targetPct = 78;
    const gap = Math.max(0, targetPct - utilizationPct);

    // Kpi Data merging Real-time telemetry with historical summary
    const kpis: Kpi[] = [
        {
            label: "Total Shipments",
            value: String(summary?.kpis.shipmentsLast30 ?? "—"),
            sublabel: "Last 30 days",
            trend: undefined, // Could calculate if we had prev month
            realtime: false,
            href: "/dashboard/shipments",
        },
        {
            label: "In Transit",
            value: String(telemetry?.activeShipmentsCount ?? summary?.kpis.inTransit ?? "—"),
            sublabel: "Actively moving",
            trend: undefined, // Real-time
            realtime: true,
            href: "/dashboard/shipments?status=IN_TRANSIT",
        },
        {
            label: "Delivered",
            value: String(summary?.kpis.delivered ?? "—"),
            sublabel: "Last 30 days",
            trend: undefined,
            href: "/dashboard/shipments?status=DELIVERED",
        },
        {
            label: "Revenue",
            value: formatCurrencyFromCentsString(summary?.kpis.revenueMtdCents ?? "0"),
            sublabel: "Month-to-date",
            trend: undefined,
            href: "/dashboard/billing",
        },
    ];

    const overdueInvoices = summary?.kpis.overdueInvoices ?? 0;

    const alerts: Alert[] = ([
        {
            title: "Overdue Invoices",
            description: "Invoices past due date that may impact cash flow.",
            count: overdueInvoices,
            severity: overdueInvoices > 0 ? "high" : "low",
            href: "/dashboard/billing",
        },
        {
            title: "Vehicles in Maintenance",
            description: "Currently unavailable due to maintenance.",
            count: maintCount,
            severity: maintCount > 0 ? "medium" : "low",
            href: "/dashboard/maintenance",
        },
        {
            title: "In-Transit Shipments",
            description: "Active shipments currently moving.",
            count: telemetry?.activeShipmentsCount ?? 0,
            severity: "low",
            href: "/dashboard/shipments",
        },
    ] as Alert[]).sort((a, b) => (a.severity === "high" ? -1 : 1)); // Sort high severity first

    const recentShipments = summary?.recent.shipments ?? [];
    const recentTripSheets = summary?.recent.tripSheets ?? [];

    const shipmentActivity: Activity[] = recentShipments.map((s) => {
        const status = String(s.status ?? "");
        const tone: Activity["tone"] =
            status === "DELIVERED"
                ? "success"
                : status === "IN_TRANSIT"
                    ? "info"
                    : "warning";
        return {
            id: `shp_${s.id}`,
            title: `Shipment ${s.referenceNumber}`,
            description: `Status: ${status}`,
            when: formatRelativeWhen(s.createdAt),
            tone,
        };
    });

    const tripSheetActivity: Activity[] = recentTripSheets.map((t) => {
        const driverName = t.driver?.user?.name ?? "Driver";
        const vehicleNumber = t.vehicle?.registrationNumber ?? "—";
        return {
            id: `trip_${t.id}`,
            title: "Trip sheet created",
            description: `${driverName} · ${vehicleNumber}`,
            when: formatRelativeWhen(t.createdAt),
            tone: "info",
        };
    });

    // Merge and sort activity
    const activity: Activity[] = [...shipmentActivity, ...tripSheetActivity]
        .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
        .slice(0, 6);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Command Center</h1>
                <p className="text-sm text-muted-foreground">
                    Prioritize exceptions, allocate capacity, and stay ahead of SLA risk.
                </p>
            </div>

            {/* KPI Row */}
            <WidgetErrorBoundary title="KPI Metrics">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {kpis.map((kpi, i) => (
                        <KpiCard
                            key={i}
                            title={kpi.label}
                            value={kpi.value}
                            subtitle={kpi.sublabel}
                            icon={
                                <KpiIcon
                                    variant={
                                        i === 0 ? "shipments" : i === 1 ? "transit" : i === 2 ? "delivered" : "revenue"
                                    }
                                />
                            }
                            accent={
                                i === 0 ? "sky" : i === 1 ? "amber" : i === 2 ? "emerald" : "violet"
                            }
                            trend={kpi.trend}
                            realtime={kpi.realtime}
                            href={kpi.href}
                        />
                    ))}
                </div>
            </WidgetErrorBoundary>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Compliance Alerts */}
                <ComplianceAlerts />

                {/* Standard Alerts (Financial/Ops) */}
                <Card
                    title="Ops Alerts"
                    description="Focus on exceptions that impact service levels."
                    action={
                        <Link
                            href="/dashboard/shipments"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            View all
                        </Link>
                    }
                >
                    <div className="space-y-3">
                        {alerts.slice(0, 3).map((a) => (
                            <Link
                                key={a.title}
                                href={a.href}
                                className="group block rounded-lg border border-border p-3 transition-all hover:bg-muted/50 hover:border-foreground/20"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <TonePill tone={a.severity}>{a.severity === 'high' ? 'Critical' : a.severity === 'medium' ? 'Warning' : 'Info'}</TonePill>
                                            <span className="truncate text-sm font-medium text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {a.title}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground pl-1">
                                            {a.description}
                                        </div>
                                    </div>
                                    <div className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-bold ${a.severity === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' :
                                        a.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' :
                                            'bg-muted text-muted-foreground'
                                        }`}>
                                        {a.count}
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {alerts.length === 0 && (
                            <div className="text-center py-6 text-sm text-muted-foreground">
                                No active alerts. System healthy.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Fleet utilization */}
                <WidgetErrorBoundary title="Fleet Utilization">
                    <Card
                        title="Fleet Utilization"
                        description="Real-time capacity signal."
                        action={
                            <Link
                                href="/dashboard/fleet"
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                                Map View
                            </Link>
                        }
                    >
                        <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-3xl font-bold text-foreground">
                                        {utilizationPct}%
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground font-medium">
                                        Target: {targetPct}%
                                        {gap > 0 ? <span className="text-rose-600 dark:text-rose-400 ml-1">• Gap: {gap} pts</span> : <span className="text-emerald-600 dark:text-emerald-400 ml-1">• On Target</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-muted-foreground">Active Now</div>
                                    <div className="text-xl font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 rounded-md inline-block">
                                        {activeCount}
                                    </div>
                                </div>
                            </div>

                            <FleetUtilizationChart
                                active={activeCount}
                                idle={idleCount}
                                maintenance={maintCount}
                            />

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-2 dark:bg-emerald-950/10 dark:border-emerald-900/50">
                                    <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Active</div>
                                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-500">{activeCount}</div>
                                </div>
                                <div className="rounded-lg bg-muted p-2 border border-border">
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Idle</div>
                                    <div className="text-lg font-bold text-foreground">{idleCount}</div>
                                </div>
                                <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-2 dark:bg-amber-950/10 dark:border-amber-900/50">
                                    <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Maint</div>
                                    <div className="text-lg font-bold text-amber-700 dark:text-amber-500">{maintCount}</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </WidgetErrorBoundary>

                {/* Activity feed */}
                <Card
                    title="Recent Activity"
                    description="Latest operational events."
                    action={
                        <Link
                            href="/dashboard/documents"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                            Audit Log
                        </Link>
                    }
                >
                    <ol className="space-y-4 relative border-l border-border ml-2" aria-label="Recent activity">
                        {activity.map((item, idx) => (
                            <li
                                key={item.id + idx}
                                className="ml-4"
                            >
                                <span className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-background ring-1 ring-border ${item.tone === 'success' ? 'bg-emerald-500' :
                                    item.tone === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}></span>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">
                                            {item.title}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {item.description}
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-[10px] text-muted-foreground font-medium">
                                        {item.when}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </Card>
            </div>
        </div>
    );
}
