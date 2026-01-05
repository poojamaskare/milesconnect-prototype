"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";

type MaintenanceStatus = "Green" | "Yellow" | "Red";

type VehicleMaintenanceRow = {
	vehicle: string;
	status: MaintenanceStatus;
	nextServiceDate: string;
	aiRiskScore: number | null;
	predictedDate: string | null;
};

type ApiVehicle = {
	id: string;
	registrationNumber: string;
	make: string | null;
	model: string | null;
	status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
	name: string | null;
	maintenanceCycleDays: number | null;
	lastMaintenanceDate: string | null;
	nextMaintenanceDate: string | null;
	maintenanceHealth?: {
		riskScore: number;
		predictedFailureDate: string | null;
		status: string;
	};
};

function StatusBadge({ status }: { status: MaintenanceStatus }) {
	const classes =
		status === "Green"
			? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
			: status === "Yellow"
				? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
				: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300";

	return (
		<span
			className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${classes}`}
		>
			{status}
		</span>
	);
}

function RiskBadge({ score }: { score: number | null }) {
	if (score === null) return <span className="text-slate-400">—</span>;

	let colorClass = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
	let Icon = CheckCircle;

	if (score > 70) {
		colorClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
		Icon = AlertCircle;
	} else if (score > 40) {
		colorClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
		Icon = AlertTriangle;
	} else {
		colorClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
	}

	return (
		<div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${colorClass}`}>
			<Icon className="h-3.5 w-3.5" />
			{score}% Risk
		</div>
	);
}

function Card({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-xl border border-foreground/10 bg-card">
			<div className="border-b border-foreground/10 p-4">
				<h2 className="text-sm font-semibold text-foreground">{title}</h2>
				{description ? (
					<p className="mt-1 text-xs text-foreground/60">{description}</p>
				) : null}
			</div>
			<div className="p-4">{children}</div>
		</section>
	);
}

function toDateOnly(d: Date) {
	return d.toISOString().slice(0, 10);
}

function addDays(base: Date, days: number) {
	const d = new Date(base);
	d.setDate(d.getDate() + days);
	return d;
}

function statusForVehicle(v: ApiVehicle): MaintenanceStatus {
	// Priority: ML Health Status
	if (v.maintenanceHealth) {
		if (v.maintenanceHealth.status === 'CRITICAL') return "Red";
		if (v.maintenanceHealth.status === 'WARNING') return "Yellow";
		if (v.maintenanceHealth.status === 'GOOD') return "Green";
	}

	// Use next maintenance date to determine status
	if (v.nextMaintenanceDate) {
		const nextDate = new Date(v.nextMaintenanceDate);
		const today = new Date();
		const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

		if (daysUntil <= 0) return "Red"; // Overdue
		if (daysUntil <= 7) return "Yellow"; // Due within a week
		return "Green";
	}

	// Fallback to status-based
	if (v.status === "MAINTENANCE") return "Red";
	if (v.status === "INACTIVE") return "Yellow";
	return "Green";
}

function nextServiceDateFor(v: ApiVehicle): string {
	// Use ML Predicted Date if available
	if (v.maintenanceHealth?.predictedFailureDate) {
		return v.maintenanceHealth.predictedFailureDate.slice(0, 10) + " (AI Predicted)";
	}

	// Use actual next maintenance date if available
	if (v.nextMaintenanceDate) {
		return v.nextMaintenanceDate.slice(0, 10);
	}

	// Fallback to computed date based on status
	const today = new Date();
	if (v.status === "MAINTENANCE") return toDateOnly(addDays(today, -1)); // overdue
	if (v.status === "INACTIVE") return toDateOnly(addDays(today, 14));
	return toDateOnly(addDays(today, 30));
}

function calculateRiskScore(v: ApiVehicle): number | null {
	if (v.maintenanceHealth) {
		return v.maintenanceHealth.riskScore;
	}

	if (!v.nextMaintenanceDate || !v.maintenanceCycleDays) {
		return null;
	}

	const nextDate = new Date(v.nextMaintenanceDate);
	const today = new Date();
	const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

	// Risk score based on percentage through maintenance cycle
	const percentThrough = 1 - (daysUntil / v.maintenanceCycleDays);
	return Math.round(Math.max(0, Math.min(1, percentThrough)) * 100);
}

async function fetchMaintenanceRows(): Promise<VehicleMaintenanceRow[]> {
	const res = await api.get<{ data: ApiVehicle[] }>("/api/vehicles");
	const vehicles = res?.data ?? [];

	return vehicles.map((v) => {
		const label = v.name ?? `${v.registrationNumber} · ${`${v.make ?? ""} ${v.model ?? ""}`.trim() || "Vehicle"}`;
		return {
			vehicle: label,
			status: statusForVehicle(v),
			nextServiceDate: nextServiceDateFor(v),
			aiRiskScore: calculateRiskScore(v),
			predictedDate: v.maintenanceHealth?.predictedFailureDate || null
		};
	});
}

export default function MaintenanceClient() {
	const router = useRouter();
	const rowsQuery = useQuery({
		queryKey: ["maintenance", "vehicles"],
		queryFn: fetchMaintenanceRows,
	});

	const rows = rowsQuery.data ?? [];

	// Calculate summary statistics
	const redCount = rows.filter(r => r.status === "Red").length;
	const yellowCount = rows.filter(r => r.status === "Yellow").length;
	const greenCount = rows.filter(r => r.status === "Green").length;

	return (
		<main id="main" className="mx-auto w-full max-w-6xl px-4 py-6">
			<div className="mb-6 flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-xl font-semibold text-foreground">Vehicle Maintenance</h1>
					<p className="mt-1 text-sm text-foreground/60">
						Fleet maintenance overview with status tracking and risk assessment based on maintenance cycles.
					</p>
				</div>
				<button
					type="button"
					onClick={() => router.push("/dashboard/vehicles/add")}
					className="inline-flex items-center justify-center rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background outline-none transition hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-foreground/30"
				>
					+ Add Vehicle
				</button>
			</div>

			{/* Summary Cards */}
			<div className="mb-6 grid gap-4 sm:grid-cols-3">
				<div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
					<div className="text-2xl font-bold text-rose-600 dark:text-rose-300">{redCount}</div>
					<div className="mt-1 text-xs font-semibold uppercase tracking-wide text-rose-600/70 dark:text-rose-300/70">
						Overdue / Critical
					</div>
				</div>
				<div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
					<div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{yellowCount}</div>
					<div className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-700/70 dark:text-amber-300/70">
						Due Soon
					</div>
				</div>
				<div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
					<div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">{greenCount}</div>
					<div className="mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-600/70 dark:text-emerald-300/70">
						Good Standing
					</div>
				</div>
			</div>

			<Card
				title="Vehicle List"
				description="Status is based on maintenance cycle dates. Risk score shows progress through the maintenance period."
			>
				{rowsQuery.isError ? (
					<div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
						Failed to load vehicles.
					</div>
				) : null}

				{rowsQuery.isLoading ? (
					<div className="mb-4 rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/70">
						Loading vehicles…
					</div>
				) : null}

				{!rowsQuery.isLoading && rows.length === 0 ? (
					<div className="mb-4 rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/70">
						No vehicles found.
					</div>
				) : null}

				<div className="overflow-x-auto">
					<table className="w-full min-w-[720px] border-separate border-spacing-0">
						<thead>
							<tr className="text-left">
								<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
									Vehicle
								</th>
								<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
									Maintenance Status
								</th>
								<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
									Next Service Date
								</th>
								<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
									Risk Score
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row) => (
								<tr key={row.vehicle} className="align-top">
									<td className="border-b border-foreground/10 py-4 pr-4">
										<div className="text-sm font-semibold text-foreground">{row.vehicle}</div>
									</td>
									<td className="border-b border-foreground/10 py-4 pr-4">
										<StatusBadge status={row.status} />
									</td>
									<td className="border-b border-foreground/10 py-4 pr-4">
										<div className="text-sm text-foreground">{row.nextServiceDate}</div>
										{row.predictedDate && (
											<div className="mt-0.5 text-xs text-brand-500">AI Est. {row.predictedDate.slice(0, 10)}</div>
										)}
									</td>
									<td className="border-b border-foreground/10 py-4">
										<RiskBadge score={row.aiRiskScore} />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>
		</main>
	);
}
