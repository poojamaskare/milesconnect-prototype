"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useMaintenanceLogs, useCreateMaintenanceLog, MaintenanceType, MaintenanceStatus } from "@/lib/hooks/useMaintenance";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface MaintenanceHistoryModalProps {
    vehicleId: string;
    vehicleReg: string;
    onClose: () => void;
}

export function MaintenanceHistoryModal({ vehicleId, vehicleReg, onClose }: MaintenanceHistoryModalProps) {
    const { data: logs = [], isLoading } = useMaintenanceLogs(vehicleId);
    const createMutation = useCreateMaintenanceLog();

    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [type, setType] = useState<MaintenanceType>("ROUTINE");
    const [description, setDescription] = useState("");
    const [cost, setCost] = useState("");
    const [odometerKm, setOdometerKm] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [providerName, setProviderName] = useState("");
    const [nextServiceDate, setNextServiceDate] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            vehicleId,
            type,
            description,
            cost,
            odometerKm: odometerKm ? parseInt(odometerKm) : undefined,
            date: new Date(date).toISOString(),
            providerName: providerName || undefined,
            nextServiceDate: nextServiceDate ? new Date(nextServiceDate).toISOString() : undefined,
            status: "COMPLETED"
        }, {
            onSuccess: () => {
                toast.success("Maintenance logged");
                setIsCreating(false);
                // Reset form
                setDescription("");
                setCost("");
                setOdometerKm("");
                setProviderName("");
            },
            onError: (err) => toast.error("Failed to log maintenance")
        });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Maintenance History - ${vehicleReg}`}>
            <div className="space-y-6">

                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-slate-500">Service Record</h3>
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
                    >
                        {isCreating ? "Cancel Log" : "+ Log Service"}
                    </button>
                </div>

                {/* Create Form */}
                {isCreating && (
                    <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-lg space-y-3 border border-slate-200">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-700">Type</label>
                                <select
                                    value={type} onChange={e => setType(e.target.value as MaintenanceType)}
                                    className="w-full mt-1 rounded-md border-slate-300 text-sm p-2"
                                >
                                    <option value="ROUTINE">Routine Service</option>
                                    <option value="REPAIR">Repair</option>
                                    <option value="ACCIDENT">Accident</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">Date</label>
                                <input
                                    type="date"
                                    value={date} onChange={e => setDate(e.target.value)}
                                    className="w-full mt-1 rounded-md border-slate-300 text-sm p-2"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700">Description</label>
                            <input
                                type="text"
                                value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="e.g. Oil Change, Brake Pad Replacement"
                                className="w-full mt-1 rounded-md border-slate-300 text-sm p-2"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-700">Cost (₹)</label>
                                <input
                                    type="number"
                                    value={cost} onChange={e => setCost(e.target.value)}
                                    className="w-full mt-1 rounded-md border-slate-300 text-sm p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">Odometer (km)</label>
                                <input
                                    type="number"
                                    value={odometerKm} onChange={e => setOdometerKm(e.target.value)}
                                    className="w-full mt-1 rounded-md border-slate-300 text-sm p-2"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-700">Provider</label>
                                <input
                                    type="text"
                                    value={providerName} onChange={e => setProviderName(e.target.value)}
                                    placeholder="Service Center Name"
                                    className="w-full mt-1 rounded-md border-slate-300 text-sm p-2"
                                />
                            </div>                               <div className="flex justify-end pt-5">
                                <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded text-sm w-full">
                                    {createMutation.isPending ? "Logging..." : "Save Log"}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* List */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {isLoading ? (
                        <p className="text-center text-slate-500 py-4">Loading history...</p>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-slate-500 py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            No maintenance records found.
                        </p>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-200 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded capitalize ${log.type === 'ROUTINE' ? 'bg-green-100 text-green-700' :
                                                    log.type === 'REPAIR' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {log.type.toLowerCase()}
                                            </span>
                                            <span className="text-sm font-medium text-slate-900">{log.description}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {new Date(log.date).toLocaleDateString()} • {log.providerName || "Internal"}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-slate-900">
                                            {formatCurrency((log.costCents || 0) / 100)}
                                        </div>
                                        {log.odometerKm && (
                                            <div className="text-xs text-slate-500">
                                                {log.odometerKm.toLocaleString()} km
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
}
