"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useDrivers } from "@/lib/hooks/useDrivers";
import { useVehicles } from "@/lib/hooks/useVehicles";
import { useShipments } from "@/lib/hooks/useShipments";
import { useCreateTripSheet } from "@/lib/hooks/useTripSheets";
import { toast } from "sonner";

interface CreateTripSheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialShipmentIds?: string[];
}

export function CreateTripSheetModal({ isOpen, onClose, initialShipmentIds = [] }: CreateTripSheetModalProps) {
    const [sheetNo, setSheetNo] = useState("");
    const [driverId, setDriverId] = useState("");
    const [vehicleId, setVehicleId] = useState("");
    const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);

    const [driverAdvance, setDriverAdvance] = useState<string>("0");
    const [driverAllowance, setDriverAllowance] = useState<string>("0");
    const [loadingUnloading, setLoadingUnloading] = useState<string>("0");
    const [policeExpense, setPoliceExpense] = useState<string>("0");
    const [adBlueExpense, setAdBlueExpense] = useState<string>("0");

    // Queries
    const { data: driversData } = useDrivers();
    const { data: vehiclesData } = useVehicles();
    const { data: shipmentsData } = useShipments();

    const drivers = driversData || [];
    const vehicles = vehiclesData || [];
    const shipments = shipmentsData?.data || [];

    const createMutation = useCreateTripSheet();

    // Filter available shipments: Must be (DRAFT) OR (PLANNED but not linked? - simplifying to DRAFT for new sheets)
    // Also include any explicitly passed initial IDs even if status differs (though ideally they should be draft)
    const availableShipments = shipments.filter((s: any) =>
        s.status === "DRAFT" || initialShipmentIds.includes(s.id)
    );

    useEffect(() => {
        if (isOpen) {
            // Auto-generate Sheet Number
            const random = Math.random().toString(36).substring(2, 7).toUpperCase();
            setSheetNo(`TS-${Date.now().toString().slice(-6)}-${random}`);
            setDriverId("");
            setVehicleId("");
            setSelectedShipmentIds(initialShipmentIds);

            // Reset numerical fields
            setDriverAdvance("0");
            setDriverAllowance("0");
            setLoadingUnloading("0");
            setPoliceExpense("0");
            setAdBlueExpense("0");
        }
    }, [isOpen, initialShipmentIds]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!sheetNo || !driverId || !vehicleId) {
            toast.error("Please fill in all required fields");
            return;
        }

        const parseCents = (val: string) => Math.round(parseFloat(val || "0") * 100);

        createMutation.mutate(
            {
                sheetNo,
                driverId,
                vehicleId,
                createdById: "00000000-0000-0000-0000-000000000001", // Default Admin
                shipmentIds: selectedShipmentIds,

                // New Advanced Fields (Converted to cents)
                driverAdvanceCents: parseCents(driverAdvance),
                driverAllowanceCents: parseCents(driverAllowance),
                loadingUnloadingCents: parseCents(loadingUnloading),
                policeExpenseCents: parseCents(policeExpense),
                adBlueExpenseCents: parseCents(adBlueExpense),
            },
            {
                onSuccess: () => {
                    toast.success("Trip Sheet created successfully");
                    onClose();
                },
                onError: (err) => {
                    toast.error("Failed to create Trip Sheet: " + err.message);
                },
            }
        );
    };

    const toggleShipment = (id: string) => {
        setSelectedShipmentIds((prev) =>
            prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Trip Sheet">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Trip Sheet No</label>
                    <input
                        type="text"
                        value={sheetNo}
                        onChange={(e) => setSheetNo(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Driver</label>
                        <select
                            value={driverId}
                            onChange={(e) => setDriverId(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            required
                        >
                            <option value="">Select Driver</option>
                            {drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.user?.name || "Unknown"} ({d.licenseNumber})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Vehicle</label>
                        <select
                            value={vehicleId}
                            onChange={(e) => setVehicleId(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            required
                        >
                            <option value="">Select Vehicle</option>
                            {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.registrationNumber} ({v.make} {v.model})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-900 mb-3">Initial Trip Costs & Allowances</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700">Driver Advance (Cash)</label>
                            <div className="relative mt-1">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-500">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={driverAdvance}
                                    onChange={(e) => setDriverAdvance(e.target.value)}
                                    className="block w-full rounded-md border border-slate-300 pl-6 pr-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700">Daily Allowance</label>
                            <div className="relative mt-1">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-500">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={driverAllowance}
                                    onChange={(e) => setDriverAllowance(e.target.value)}
                                    className="block w-full rounded-md border border-slate-300 pl-6 pr-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700">Loading/Unloading</label>
                            <div className="relative mt-1">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-500">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={loadingUnloading}
                                    onChange={(e) => setLoadingUnloading(e.target.value)}
                                    className="block w-full rounded-md border border-slate-300 pl-6 pr-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700">Police/Misc</label>
                            <div className="relative mt-1">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-500">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={policeExpense}
                                    onChange={(e) => setPoliceExpense(e.target.value)}
                                    className="block w-full rounded-md border border-slate-300 pl-6 pr-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700">AdBlue</label>
                            <div className="relative mt-1">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-500">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={adBlueExpense}
                                    onChange={(e) => setAdBlueExpense(e.target.value)}
                                    className="block w-full rounded-md border border-slate-300 pl-6 pr-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select Shipments (DRAFT)
                    </label>
                    <div className="max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2 space-y-2">
                        {availableShipments.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No draft shipments available</p>
                        ) : (
                            availableShipments.map((s: any) => (
                                <div
                                    key={s.id}
                                    className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${selectedShipmentIds.includes(s.id)
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-slate-200 bg-white hover:border-blue-300"
                                        }`}
                                    onClick={() => toggleShipment(s.id)}
                                >
                                    <div
                                        className={`flex h-5 w-5 items-center justify-center rounded border ${selectedShipmentIds.includes(s.id)
                                            ? "border-blue-600 bg-blue-600 text-white"
                                            : "border-slate-300 bg-white"
                                            }`}
                                    >
                                        {selectedShipmentIds.includes(s.id) && (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-3.5 w-3.5"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-900">{s.referenceNumber}</span>
                                            <span className="text-xs text-slate-500">
                                                {s.weightKg ? `${s.weightKg}kg` : "N/A"}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 truncate mt-0.5">
                                            {s.originAddress} → {s.destinationAddress}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {createMutation.isPending ? "Creating..." : "Create Trip Sheet"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
