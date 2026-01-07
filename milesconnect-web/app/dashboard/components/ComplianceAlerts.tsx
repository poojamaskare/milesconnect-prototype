"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { WidgetErrorBoundary } from "@/components/WidgetErrorBoundary";

type ComplianceAlert = {
    id: string;
    type: string;
    fileName: string;
    expiryDate: string;
    linkedEntity: string;
    entityId: string;
    daysUntilExpiry: number;
};

function AlertCard({ alert }: { alert: ComplianceAlert }) {
    const isOverdue = alert.daysUntilExpiry < 0;
    const isUrgent = alert.daysUntilExpiry <= 7;

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${isOverdue ? "bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30" :
                isUrgent ? "bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30" :
                    "bg-slate-50 border-slate-100 dark:bg-slate-900/20 dark:border-slate-800"
            }`}>
            <div className={`mt-0.5 ${isOverdue ? "text-rose-600" : isUrgent ? "text-amber-600" : "text-slate-500"
                }`}>
                <AlertTriangle size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                    {alert.linkedEntity}
                </div>
                <div className="text-muted-foreground text-xs mt-0.5 truncate">
                    {alert.type} • {alert.fileName}
                </div>
                <div className={`text-xs font-semibold mt-1.5 ${isOverdue ? "text-rose-700" : isUrgent ? "text-amber-700" : "text-slate-600"
                    }`}>
                    {isOverdue ? `Expired ${Math.abs(alert.daysUntilExpiry)} days ago` : `Expires in ${alert.daysUntilExpiry} days`}
                </div>
            </div>
        </div>
    );
}

export function ComplianceAlerts() {
    const { data: alerts = [], isLoading, isError } = useQuery({
        queryKey: ["compliance", "alerts"],
        queryFn: async () => {
            const res = await api.get<{ data: ComplianceAlert[] }>("/api/compliance/alerts");
            return res.data;
        }
    });

    if (isLoading) return <div className="h-48 bg-muted/10 animate-pulse rounded-xl" />;

    if (isError) return (
        <div className="p-4 text-sm text-rose-500 bg-rose-50 rounded-xl border border-rose-100">
            Failed to load compliance alerts.
        </div>
    );

    const urgentCount = alerts.filter(a => a.daysUntilExpiry <= 30).length;

    return (
        <WidgetErrorBoundary title="Compliance Alerts">
            <div className="rounded-xl border border-border bg-card">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            Compliance Watch
                            {urgentCount > 0 && (
                                <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full">
                                    {urgentCount} Issues
                                </span>
                            )}
                        </h3>
                    </div>
                </div>

                <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto">
                    {alerts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="mx-auto mb-2 text-emerald-500" size={24} />
                            <p className="text-sm">All documents are up to date.</p>
                        </div>
                    ) : (
                        alerts.map(alert => (
                            <AlertCard key={alert.id} alert={alert} />
                        ))
                    )}
                </div>
            </div>
        </WidgetErrorBoundary>
    );
}
