"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type TripSheet = {
  id: string;
  sheetNo: string;
  status: string;
  startOdometerKm: number | null;
  endOdometerKm: number | null;
  startedAt: string | null;
  endedAt: string | null;
  startLocation: string | null;
  endLocation: string | null;
  routeDescription: string | null;
  fuelAtStart: number | null;
  fuelAtEnd: number | null;
  fuelExpenseCents: number;
  tollExpenseCents: number;
  otherExpenseCents: number;
  notes: string | null;
  driver: { id: string; user: { name: string | null; email: string } };
  vehicle: { id: string; registrationNumber: string };
  shipments: Array<{
    shipment: {
      id: string;
      referenceNumber: string;
    };
  }>;
  fuelStops: Array<{
    id: string;
    location: string;
    fuelLiters: number;
    totalCostCents: number;
    fueledAt: string;
  }>;
  expenses: Array<{
    id: string;
    category: string;
    description: string | null;
    amountCents: number;
    expenseAt: string;
  }>;
};

async function fetchTripSheet(id: string): Promise<TripSheet> {
  const res = await api.get<{ data: TripSheet }>(`/api/trip-sheets/${id}`);
  return res.data;
}

async function updateTripSheet(id: string, data: any) {
  return api.patch(`/api/trip-sheets/${id}`, data);
}

async function addFuelStop(tripSheetId: string, data: any) {
  return api.post(`/api/trip-sheets/${tripSheetId}/fuel-stops`, data);
}

async function addExpense(tripSheetId: string, data: any) {
  return api.post(`/api/trip-sheets/${tripSheetId}/expenses`, data);
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
    <section className="rounded-xl border border-foreground/10 bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-foreground/10 p-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-xs text-foreground/60">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function EditTripSheetClient({ tripSheetId }: { tripSheetId: string }) {
  const router = useRouter();
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const tripSheetQuery = useQuery({
    queryKey: ["trip-sheet", tripSheetId],
    queryFn: () => fetchTripSheet(tripSheetId),
  });

  const [formData, setFormData] = useState({
    endOdometerKm: "",
    endedAt: "",
    endLocation: "",
    fuelAtEnd: "",
    fuelExpenseCents: "",
    tollExpenseCents: "",
    otherExpenseCents: "",
    notes: "",
  });

  const [fuelStopData, setFuelStopData] = useState({
    location: "",
    fuelLiters: "",
    pricePerLiter: "",
    totalCostCents: "",
    receiptNumber: "",
    notes: "",
    fueledAt: new Date().toISOString().slice(0, 16),
  });

  const [expenseData, setExpenseData] = useState({
    category: "Toll",
    description: "",
    amountCents: "",
    receiptNumber: "",
    notes: "",
    expenseAt: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    if (tripSheetQuery.data) {
      const ts = tripSheetQuery.data;
      setFormData({
        endOdometerKm: ts.endOdometerKm?.toString() ?? "",
        endedAt: ts.endedAt ? new Date(ts.endedAt).toISOString().slice(0, 16) : "",
        endLocation: ts.endLocation ?? "",
        fuelAtEnd: ts.fuelAtEnd?.toString() ?? "",
        fuelExpenseCents: (ts.fuelExpenseCents / 100).toFixed(2),
        tollExpenseCents: (ts.tollExpenseCents / 100).toFixed(2),
        otherExpenseCents: (ts.otherExpenseCents / 100).toFixed(2),
        notes: ts.notes ?? "",
      });
    }
  }, [tripSheetQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateTripSheet(tripSheetId, data),
    onSuccess: () => {
      tripSheetQuery.refetch();
      alert("Trip sheet updated successfully!");
    },
  });

  const fuelStopMutation = useMutation({
    mutationFn: (data: any) => addFuelStop(tripSheetId, data),
    onSuccess: () => {
      tripSheetQuery.refetch();
      setShowFuelForm(false);
      setFuelStopData({
        location: "",
        fuelLiters: "",
        pricePerLiter: "",
        totalCostCents: "",
        receiptNumber: "",
        notes: "",
        fueledAt: new Date().toISOString().slice(0, 16),
      });
    },
  });

  const expenseMutation = useMutation({
    mutationFn: (data: any) => addExpense(tripSheetId, data),
    onSuccess: () => {
      tripSheetQuery.refetch();
      setShowExpenseForm(false);
      setExpenseData({
        category: "Toll",
        description: "",
        amountCents: "",
        receiptNumber: "",
        notes: "",
        expenseAt: new Date().toISOString().slice(0, 16),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      endOdometerKm: formData.endOdometerKm ? parseInt(formData.endOdometerKm) : null,
      endedAt: formData.endedAt ? new Date(formData.endedAt) : null,
      endLocation: formData.endLocation || null,
      fuelAtEnd: formData.fuelAtEnd ? parseFloat(formData.fuelAtEnd) : null,
      fuelExpenseCents: formData.fuelExpenseCents ? Math.round(parseFloat(formData.fuelExpenseCents) * 100) : undefined,
      tollExpenseCents: formData.tollExpenseCents ? Math.round(parseFloat(formData.tollExpenseCents) * 100) : undefined,
      otherExpenseCents: formData.otherExpenseCents ? Math.round(parseFloat(formData.otherExpenseCents) * 100) : undefined,
      notes: formData.notes || null,
    };

    updateMutation.mutate(payload);
  };

  const handleFuelStopSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      location: fuelStopData.location,
      fuelLiters: parseFloat(fuelStopData.fuelLiters),
      pricePerLiter: fuelStopData.pricePerLiter ? parseFloat(fuelStopData.pricePerLiter) : undefined,
      totalCostCents: Math.round(parseFloat(fuelStopData.totalCostCents) * 100),
      receiptNumber: fuelStopData.receiptNumber || undefined,
      notes: fuelStopData.notes || undefined,
      fueledAt: new Date(fuelStopData.fueledAt),
    };

    fuelStopMutation.mutate(payload);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      category: expenseData.category,
      description: expenseData.description || undefined,
      amountCents: Math.round(parseFloat(expenseData.amountCents) * 100),
      receiptNumber: expenseData.receiptNumber || undefined,
      notes: expenseData.notes || undefined,
      expenseAt: new Date(expenseData.expenseAt),
    };

    expenseMutation.mutate(payload);
  };

  if (tripSheetQuery.isLoading) {
    return (
      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-6">
        <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/70">
          Loading trip sheet...
        </div>
      </main>
    );
  }

  if (tripSheetQuery.isError || !tripSheetQuery.data) {
    return (
      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-6">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
          Failed to load trip sheet.
        </div>
      </main>
    );
  }

  const tripSheet = tripSheetQuery.data;
  const canEdit = tripSheet.status === "DRAFT";

  return (
    <main id="main" className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Edit Trip Sheet</h1>
          <p className="mt-1 text-sm text-foreground/60">{tripSheet.sheetNo}</p>
        </div>
        <div className="rounded-full border border-foreground/20 bg-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
          {tripSheet.status}
        </div>
      </div>

      {!canEdit ? (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          This trip sheet cannot be edited because it is not in DRAFT status.
        </div>
      ) : null}

      <div className="space-y-6">
        <Card title="Trip Overview">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-foreground/60">Driver</div>
              <div className="mt-1 text-sm text-foreground">
                {tripSheet.driver.user.name ?? tripSheet.driver.user.email}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground/60">Vehicle</div>
              <div className="mt-1 text-sm text-foreground">
                {tripSheet.vehicle.registrationNumber}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground/60">Start Location</div>
              <div className="mt-1 text-sm text-foreground">
                {tripSheet.startLocation ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground/60">Start Odometer</div>
              <div className="mt-1 text-sm text-foreground">
                {tripSheet.startOdometerKm ? `${tripSheet.startOdometerKm} km` : "—"}
              </div>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title="Trip Completion">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-foreground/60">
                  End Odometer (km)
                </label>
                <input
                  type="number"
                  disabled={!canEdit}
                  value={formData.endOdometerKm}
                  onChange={(e) => setFormData({ ...formData, endOdometerKm: e.target.value })}
                  className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  disabled={!canEdit}
                  value={formData.endedAt}
                  onChange={(e) => setFormData({ ...formData, endedAt: e.target.value })}
                  className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60">
                  End Location
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.endLocation}
                  onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
                  className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60">
                  Fuel at End (liters)
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!canEdit}
                  value={formData.fuelAtEnd}
                  onChange={(e) => setFormData({ ...formData, fuelAtEnd: e.target.value })}
                  className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-50"
                />
              </div>
            </div>
          </Card>

          <Card title="Expenses Summary">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-foreground/60">
                  Fuel Expenses (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!canEdit}
                  value={formData.fuelExpenseCents}
                  onChange={(e) => setFormData({ ...formData, fuelExpenseCents: e.target.value })}
                  className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60">
                  Toll Expenses (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!canEdit}
                  value={formData.tollExpenseCents}
                  onChange={(e) => setFormData({ ...formData, tollExpenseCents: e.target.value })}
                  className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/60">
                  Other Expenses (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!canEdit}
                  value={formData.otherExpenseCents}
                  onChange={(e) => setFormData({ ...formData, otherExpenseCents: e.target.value })}
                  className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-50"
                />
              </div>
            </div>
          </Card>

          <Card title="Notes">
            <textarea
              disabled={!canEdit}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-50"
            />
          </Card>

          {canEdit ? (
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background outline-none transition hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-foreground/30 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center rounded-md border border-foreground/10 bg-card px-4 py-2 text-sm font-semibold text-foreground outline-none transition hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-foreground/30"
              >
                Cancel
              </button>
            </div>
          ) : null}
        </form>

        <Card
          title="Fuel Stops"
          action={
            canEdit ? (
              <button
                onClick={() => setShowFuelForm(!showFuelForm)}
                className="rounded-md border border-foreground/10 bg-card px-3 py-1 text-xs font-semibold text-foreground hover:bg-foreground/5"
              >
                {showFuelForm ? "Cancel" : "+ Add Fuel Stop"}
              </button>
            ) : undefined
          }
        >
          {showFuelForm ? (
            <form onSubmit={handleFuelStopSubmit} className="mb-4 space-y-3 rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground/60">Location *</label>
                  <input
                    type="text"
                    required
                    value={fuelStopData.location}
                    onChange={(e) => setFuelStopData({ ...fuelStopData, location: e.target.value })}
                    className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60">Fuel (liters) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fuelStopData.fuelLiters}
                    onChange={(e) => setFuelStopData({ ...fuelStopData, fuelLiters: e.target.value })}
                    className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60">Total Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fuelStopData.totalCostCents}
                    onChange={(e) => setFuelStopData({ ...fuelStopData, totalCostCents: e.target.value })}
                    className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={fuelStopData.fueledAt}
                    onChange={(e) => setFuelStopData({ ...fuelStopData, fueledAt: e.target.value })}
                    className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={fuelStopMutation.isPending}
                className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
              >
                {fuelStopMutation.isPending ? "Adding..." : "Add Fuel Stop"}
              </button>
            </form>
          ) : null}

          {tripSheet.fuelStops.length === 0 ? (
            <p className="text-sm text-foreground/60">No fuel stops recorded</p>
          ) : (
            <div className="space-y-2">
              {tripSheet.fuelStops.map((stop) => (
                <div key={stop.id} className="rounded-lg border border-foreground/10 p-3">
                  <div className="flex justify-between">
                    <div className="text-sm font-semibold text-foreground">{stop.location}</div>
                    <div className="text-sm text-foreground">₹{(stop.totalCostCents / 100).toFixed(2)}</div>
                  </div>
                  <div className="mt-1 text-xs text-foreground/60">
                    {stop.fuelLiters} L · {new Date(stop.fueledAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Expenses"
          action={
            canEdit ? (
              <button
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                className="rounded-md border border-foreground/10 bg-card px-3 py-1 text-xs font-semibold text-foreground hover:bg-foreground/5"
              >
                {showExpenseForm ? "Cancel" : "+ Add Expense"}
              </button>
            ) : undefined
          }
        >
          {showExpenseForm ? (
            <form onSubmit={handleExpenseSubmit} className="mb-4 space-y-3 rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground/60">Category *</label>
                  <select
                    required
                    value={expenseData.category}
                    onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                    className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                  >
                    <option value="Toll">Toll</option>
                    <option value="Parking">Parking</option>
                    <option value="Repair">Repair</option>
                    <option value="Food">Food</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/60">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseData.amountCents}
                    onChange={(e) => setExpenseData({ ...expenseData, amountCents: e.target.value })}
                    className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground/60">Description</label>
                  <input
                    type="text"
                    value={expenseData.description}
                    onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                    className="mt-1 w-full rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={expenseMutation.isPending}
                className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
              >
                {expenseMutation.isPending ? "Adding..." : "Add Expense"}
              </button>
            </form>
          ) : null}

          {tripSheet.expenses.length === 0 ? (
            <p className="text-sm text-foreground/60">No expenses recorded</p>
          ) : (
            <div className="space-y-2">
              {tripSheet.expenses.map((expense) => (
                <div key={expense.id} className="rounded-lg border border-foreground/10 p-3">
                  <div className="flex justify-between">
                    <div className="text-sm font-semibold text-foreground">{expense.category}</div>
                    <div className="text-sm text-foreground">₹{(expense.amountCents / 100).toFixed(2)}</div>
                  </div>
                  {expense.description ? (
                    <div className="mt-1 text-xs text-foreground/70">{expense.description}</div>
                  ) : null}
                  <div className="mt-1 text-xs text-foreground/60">
                    {new Date(expense.expenseAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Shipments">
          {tripSheet.shipments.length === 0 ? (
            <p className="text-sm text-foreground/60">No shipments linked</p>
          ) : (
            <div className="space-y-2">
              {tripSheet.shipments.map(({ shipment }) => (
                <div key={shipment.id} className="rounded-lg border border-foreground/10 p-3">
                  <div className="text-sm font-semibold text-foreground">
                    {shipment.referenceNumber}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
