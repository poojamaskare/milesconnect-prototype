"use client";

import { Modal } from "@/components/ui/Modal";
import { TripSheet, useSettleTripSheet } from "@/lib/hooks/useTripSheets";
import { toast } from "sonner";


interface TripSettlementModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripSheet: TripSheet;
}

export function TripSettlementModal({ isOpen, onClose, tripSheet }: TripSettlementModalProps) {
    const settleMutation = useSettleTripSheet();

    // Calculations (handling cents)
    const advance = (tripSheet.driverAdvanceCents || 0) / 100;
    const expenses = (tripSheet.totalExpenseCents || 0) / 100;
    const balance = advance - expenses;

    const handleSettle = () => {
        if (!confirm("Are you sure you want to settle and close this trip? This action cannot be undone.")) return;

        settleMutation.mutate(
            { id: tripSheet.id },
            {
                onSuccess: () => {
                    toast.success("Trip Sheet settled successfully");
                    onClose();
                },
                onError: (err) => {
                    toast.error("Failed to settle trip: " + err.message);
                },
            }
        );
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Settlement: ${tripSheet.sheetNo}`}>
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-500 mb-4">Financial Summary</h3>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Total Revenue (Freight)</span>
                            <span className="font-medium text-green-700">+{(tripSheet.totalRevenueCents ? (tripSheet.totalRevenueCents / 100) : 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Total Trip Expenses</span>
                            <span className="font-medium text-red-600">-{formatMoney(expenses)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200 border-dashed">
                            <span className="font-semibold text-slate-700">Net Profit</span>
                            <span className={`font-bold ${(tripSheet.totalRevenueCents ? tripSheet.totalRevenueCents / 100 : 0) - expenses >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {formatMoney((tripSheet.totalRevenueCents ? tripSheet.totalRevenueCents / 100 : 0) - expenses)}
                            </span>
                        </div>

                        <div className="h-px bg-slate-200 my-2"></div>

                        <div className="flex justify-between items-center text-sm text-slate-500">
                            <span>Driver Advance</span>
                            <span>{formatMoney(advance)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg mt-2">
                            <span className="font-bold text-slate-900">Cash Balance</span>
                            <span className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatMoney(balance)}
                            </span>
                        </div>
                        <div className="text-xs text-right text-slate-400 mt-1">
                            {balance >= 0 ? "To be returned by Driver" : "To be reimbursed to Driver"}
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                    <p><strong>Note:</strong> Settling this trip sheet will lock it from further editing. Ensure all expenses are recorded correctly.</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSettle}
                        disabled={settleMutation.isPending}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {settleMutation.isPending ? "Settling..." : "Unify & Settle"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
