"use client";

import { useDrivers, Driver } from "@/lib/hooks/useDrivers";
import { WidgetErrorBoundary } from "@/components/WidgetErrorBoundary";
import { Medal, Trophy, TrendingUp, Truck } from "lucide-react";

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) return <Medal className="text-yellow-500 fill-yellow-500/20" size={24} />;
    if (rank === 2) return <Medal className="text-slate-400 fill-slate-400/20" size={24} />;
    if (rank === 3) return <Medal className="text-amber-700 fill-amber-700/20" size={24} />;
    return <span className="font-bold text-slate-400 w-6 text-center">#{rank}</span>;
}

function ScoreRing({ score }: { score: number }) {
    const color = score >= 90 ? "text-emerald-500" : score >= 70 ? "text-amber-500" : "text-rose-500";
    return (
        <div className={`flex items-center gap-1 font-bold text-lg ${color}`}>
            {score.toFixed(1)}
            <span className="text-xs font-normal text-muted-foreground">/ 100</span>
        </div>
    );
}

export default function DriverPerformancePage() {
    const { data: drivers = [], isLoading } = useDrivers("score_desc");

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading leaderboard...</div>;

    const topDriver = drivers[0];

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Driver Insights</h1>
                <p className="text-sm text-muted-foreground">
                    Performance leaderboard and productivity metrics.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <WidgetErrorBoundary title="Leaderboard">
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/30">
                                <h2 className="font-semibold flex items-center gap-2">
                                    <Trophy size={18} className="text-yellow-600" />
                                    Performance Leaderboard
                                </h2>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Rank</th>
                                        <th className="px-4 py-3">Driver</th>
                                        <th className="px-4 py-3 text-right">Score</th>
                                        <th className="px-4 py-3 text-right">Trips</th>
                                        <th className="px-4 py-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {drivers.map((driver, idx) => (
                                        <tr key={driver.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <RankBadge rank={idx + 1} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground">{driver.user.name}</div>
                                                <div className="text-xs text-muted-foreground">{driver.licenseNumber}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <ScoreRing score={driver.performanceScore || 0} />
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {driver.totalTrips}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${driver.isAvailable
                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                                                    }`}>
                                                    {driver.currentStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </WidgetErrorBoundary>
                </div>

                <div className="space-y-6">
                    {topDriver && (
                        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-amber-100 rounded-xl p-6 text-center dark:from-yellow-950/10 dark:to-amber-950/10 dark:border-amber-900/30">
                            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3 dark:bg-yellow-900/30">
                                <Trophy size={32} className="text-yellow-600 dark:text-yellow-500" />
                            </div>
                            <div className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-500 mb-1">
                                Top Performer
                            </div>
                            <div className="text-2xl font-bold text-foreground mb-1">
                                {topDriver.user.name}
                            </div>
                            <div className="text-sm text-muted-foreground mb-4">
                                {topDriver.totalTrips} Trips Completed
                            </div>
                            <div className="inline-block bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/50 rounded-lg px-4 py-2">
                                <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                                    {(topDriver.performanceScore || 0).toFixed(1)}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">Score</span>
                            </div>
                        </div>
                    )}

                    <div className="bg-card border border-border rounded-xl p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp size={16} />
                            Improvement Areas
                        </h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex gap-2">
                                <div className="mt-0.5 text-rose-500">•</div>
                                <div className="text-muted-foreground">
                                    <span className="font-medium text-foreground">Smooth Braking</span>: Fleet average dropped by 5% this week.
                                </div>
                            </li>
                            <li className="flex gap-2">
                                <div className="mt-0.5 text-amber-500">•</div>
                                <div className="text-muted-foreground">
                                    <span className="font-medium text-foreground">Idling Time</span>: 3 drivers exceeded 2 hours daily idling.
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}
