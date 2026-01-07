"use client";

import { useMemo } from "react";
import { useMLHealth, useDriverPerformance } from "@/lib/hooks/useAnalytics";
import KpiCard from "../components/KpiCard";
import FleetUtilizationChart from "../components/FleetUtilizationChart";
import { DemandForecastWidget } from "@/components/DemandForecastWidget";

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

export default function AnalyticsClient() {
    const { data: mlHealth, isLoading: isLoadingHealth } = useMLHealth();
    const { data: performanceData, isLoading: isLoadingPerf } = useDriverPerformance();

    const drivers = performanceData?.drivers ?? [];
    const mlAvailable = performanceData?.mlServiceAvailable ?? true; // Default true if not loaded, or follow health

    // KPI Calculations
    const totalDrivers = drivers.length;
    const avgSafety = drivers.length > 0
        ? Math.round(drivers.reduce((acc, d) => acc + (d.metrics.safety_score ?? 0), 0) / drivers.length)
        : 0;
    const avgOnTime = drivers.length > 0
        ? Math.round(drivers.reduce((acc, d) => acc + (d.metrics.on_time_delivery_rate ?? 0), 0) / drivers.length * 100)
        : 0;

    const topPerformer = useMemo(() => {
        if (drivers.length === 0) return null;
        return [...drivers].sort((a, b) => b.score - a.score)[0];
    }, [drivers]);

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-6">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
                    <p className="mt-1 text-sm text-foreground/60">
                        Performance metrics and ML-driven insights
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-foreground/10 bg-card px-3 py-1.5 text-xs font-medium shadow-sm">
                    <div className={`h-2 w-2 rounded-full ${mlAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>ML Service: {isLoadingHealth ? "Checking..." : (mlAvailable ? "Online" : "Offline (Fallback Active)")}</span>
                </div>
            </div>

            <div className="grid gap-6">

                {/* Demand Forecast Widget */}
                {mlAvailable && (
                    <div className="w-full">
                        <DemandForecastWidget />
                    </div>
                )}

                {/* KPIs */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Reusing KpiCard style via manual Card/Divs or import if KpiCard is generic enough.
               KpiCard expects 'trend' which we might not have.
               Let's build simple ones.
           */}
                    <div className="rounded-xl border border-foreground/10 bg-card p-4">
                        <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide">Avg On-Time Rate</div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{avgOnTime}%</div>
                        <div className="mt-1 text-xs text-foreground/60">Target: 95%</div>
                    </div>

                    <div className="rounded-xl border border-foreground/10 bg-card p-4">
                        <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide">Avg Safety Score</div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{avgSafety}/100</div>
                        <div className="mt-1 text-xs text-emerald-600 font-medium">Excellent</div>
                    </div>

                    <div className="rounded-xl border border-foreground/10 bg-card p-4">
                        <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide">Active Drivers</div>
                        <div className="mt-2 text-2xl font-bold text-foreground">{totalDrivers}</div>
                        <div className="mt-1 text-xs text-foreground/60">tracked for metrics</div>
                    </div>

                    <div className="rounded-xl border border-foreground/10 bg-card p-4">
                        <div className="text-xs font-medium text-foreground/50 uppercase tracking-wide">Top Performer</div>
                        <div className="mt-2 text-xl font-bold text-foreground truncate">{topPerformer?.driverName ?? "—"}</div>
                        <div className="mt-1 text-xs text-sky-600 font-medium">Score: {Math.round(topPerformer?.score ?? 0)}</div>
                    </div>

                </div>

                {/* Driver Performance Table */}
                <Card title="Driver Performance" description="Ranked by overall efficiency and safety scores.">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-foreground/5 text-xs uppercase text-foreground/50">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Rank</th>
                                    <th className="px-4 py-3 font-semibold">Driver</th>
                                    <th className="px-4 py-3 font-semibold text-right">Score</th>
                                    <th className="px-4 py-3 font-semibold text-right">On-Time</th>
                                    <th className="px-4 py-3 font-semibold text-right">Safety</th>
                                    <th className="px-4 py-3 font-semibold text-right">Efficiency</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-foreground/10">
                                {isLoadingPerf ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-foreground/50">Loading metrics...</td></tr>
                                ) : drivers.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-foreground/50">No driver data available.</td></tr>
                                ) : (
                                    [...drivers].sort((a, b) => b.score - a.score).map((d, i) => (
                                        <tr key={d.driverId} className="group hover:bg-foreground/5 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-foreground/50">#{i + 1}</td>
                                            <td className="px-4 py-3 font-medium text-foreground">{d.driverName}</td>
                                            <td className="px-4 py-3 text-right font-bold text-foreground">{Math.round(d.score)}</td>
                                            <td className="px-4 py-3 text-right text-foreground/80">{Math.round((d.metrics.on_time_delivery_rate ?? 0) * 100)}%</td>
                                            <td className="px-4 py-3 text-right text-foreground/80">{d.metrics.safety_score ?? "—"}</td>
                                            <td className="px-4 py-3 text-right text-foreground/80">{d.metrics.fuel_efficiency_kmpl?.toFixed(1) ?? "—"} km/l</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </main>
    );
}
