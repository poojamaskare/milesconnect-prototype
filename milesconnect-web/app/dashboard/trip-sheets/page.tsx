"use client";

import { useState } from "react";
import { WidgetErrorBoundary } from "@/components/WidgetErrorBoundary";
import { TripSheetList } from "./components/TripSheetList";
import { CreateTripSheetModal } from "./components/CreateTripSheetModal";
import { useTripSheets } from "@/lib/hooks/useTripSheets";

export default function TripSheetsPage() {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const { data: tripSheets = [], isLoading } = useTripSheets();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trip Sheets</h1>
          <p className="text-slate-500">Manage daily trip sheets and routing</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + New Trip Sheet
        </button>
      </div>

      <WidgetErrorBoundary title="Trip Sheets">
        <TripSheetList data={tripSheets} isLoading={isLoading} />
      </WidgetErrorBoundary>

      <CreateTripSheetModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
