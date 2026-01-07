"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useCreateShipment } from "@/lib/hooks/useShipments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { MLPredictionCard } from "./MLPredictionCard";

interface QuickCreateShipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QuickCreateShipmentModal({ isOpen, onClose }: QuickCreateShipmentModalProps) {
    const [referenceNumber, setReferenceNumber] = useState("");
    const [originAddress, setOriginAddress] = useState("");
    const [destinationAddress, setDestinationAddress] = useState("");
    const [weightKg, setWeightKg] = useState("");
    const [price, setPrice] = useState("");

    const createMutation = useCreateShipment();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        createMutation.mutate(
            {
                referenceNumber,
                originAddress,
                destinationAddress,
                weightKg: weightKg ? Number(weightKg) : undefined,
                price: price ? price : undefined,
                createdById: "00000000-0000-0000-0000-000000000001", // Default Admin
            } as any,
            {
                onSuccess: () => {
                    toast.success("Shipment created successfully");
                    onClose();
                    // Reset form
                    setReferenceNumber("");
                    setOriginAddress("");
                    setDestinationAddress("");
                    setWeightKg("");
                    setPrice("");
                    // Navigate to shipments page
                    router.push("/dashboard/shipments");
                },
                onError: (err) => {
                    toast.error("Failed to create shipment: " + err.message);
                },
            }
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Shipment">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Reference Number
                    </label>
                    <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                        required
                        placeholder="SHP-001"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Origin Address
                    </label>
                    <input
                        type="text"
                        value={originAddress}
                        onChange={(e) => setOriginAddress(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                        required
                        placeholder="Mumbai, Maharashtra"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Destination Address
                    </label>
                    <input
                        type="text"
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                        required
                        placeholder="Delhi, Delhi"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Weight (kg) - Optional
                    </label>
                    <input
                        type="number"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                        placeholder="1000"
                        min="0"
                    />
                </div>

                {/* ML Prediction */}
                <MLPredictionCard
                    originAddress={originAddress}
                    destinationAddress={destinationAddress}
                    weightKg={Number(weightKg)}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {createMutation.isPending ? "Creating..." : "Create Shipment"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
