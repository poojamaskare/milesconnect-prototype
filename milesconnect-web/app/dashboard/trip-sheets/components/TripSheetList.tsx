"use client";

import { useState } from "react";
import { TripSheet } from "@/lib/hooks/useTripSheets";
import { TripSettlementModal } from "./TripSettlementModal";

interface TripSheetListProps {
    data: TripSheet[];
    isLoading: boolean;
}

export function TripSheetList({ data, isLoading }: TripSheetListProps) {

    const [settleSheet, setSettleSheet] = useState<TripSheet | null>(null);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading trip sheets...</div>;
    }

    if (data.length === 0) {
        return (
            <div className="p-12 text-center rounded-lg border border-slate-200 bg-slate-50">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
                    <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-lg font-medium text-slate-900">No Trip Sheets Found</h3>
                <p className="mt-2 text-slate-500">
                    Create a new trip sheet to start planning routes and dispatching shipments.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-900 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Trip Sheet</th>
                                <th className="px-6 py-3">Driver</th>
                                <th className="px-6 py-3">Vehicle</th>
                                <th className="px-6 py-3">Route</th>
                                <th className="px-6 py-3 text-center">Load</th>
                                <th className="px-6 py-3 text-right">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((sheet) => (
                                <tr key={sheet.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {sheet.sheetNo}
                                        <div className="text-xs text-slate-400 font-normal">
                                            {new Date(sheet.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {sheet.driver?.user?.name || "Unassigned"}
                                        <div className="text-xs text-slate-400">{sheet.driver?.phone || "No Phone"}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {sheet.vehicle?.registrationNumber || "Unassigned"}
                                        <div className="text-xs text-slate-400">
                                            {sheet.vehicle?.make} {sheet.vehicle?.model}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium text-slate-700">{sheet.startLocation || "Unknown"}</span>
                                            <span className="text-slate-400">→</span>
                                            <span className="font-medium text-slate-700">{sheet.endLocation || "Unknown"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                                            {sheet.shipments?.length || 0} Ships
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <StatusBadge status={sheet.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {sheet.status !== "SETTLED" && sheet.status !== "CANCELLED" && (
                                            <button
                                                onClick={() => setSettleSheet(sheet)}
                                                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                Settle
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {settleSheet && (
                <TripSettlementModal
                    isOpen={!!settleSheet}
                    onClose={() => setSettleSheet(null)}
                    tripSheet={settleSheet}
                />
            )}
        </>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        DRAFT: "bg-slate-100 text-slate-800",
        SUBMITTED: "bg-blue-100 text-blue-800",
        APPROVED: "bg-green-100 text-green-800",
        CANCELLED: "bg-red-100 text-red-800",
        SETTLED: "bg-purple-100 text-purple-800",
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-800"}`}>
            {status}
        </span>
    );
}
