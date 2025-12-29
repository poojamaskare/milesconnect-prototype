"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type VehicleStatus = "Active" | "Idle" | "Maintenance";

type VehicleType = "Truck" | "Van" | "Reefer" | "Trailer";

type RiskLevel = "Low" | "Medium" | "High";

type Vehicle = {
	id: string;
	name: string;
	number: string;
	type: VehicleType;
	status: VehicleStatus;
	assignedDriver: string;
	currentShipment?: {
		id: string;
		href: string;
	};
	maintenanceRisk: RiskLevel;
	imageUrl: string | null;
	nextMaintenanceDate: string | null;
	maintenanceCycleDays: number | null;
};

type ViewMode = "table" | "cards";

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
		<section className="rounded-xl border border-foreground/10 border-t-2 border-t-sky-500/20 bg-card">
			<div className="flex items-start justify-between gap-3 border-b border-foreground/10 p-4">
				<div className="min-w-0">
					<h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
					{description ? (
						<p className="mt-1 text-xs text-foreground/60">{description}</p>
					) : null}
				</div>
				{action ? <div className="shrink-0">{action}</div> : null}
			</div>
			<div className="p-4">{children}</div>
		</section>
	);
}

function ToggleButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	const base =
		"inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-foreground/30";

	const cls = active
		? "border border-sky-500/20 bg-sky-500/10 text-sky-600 hover:bg-sky-500/15 dark:text-sky-300"
		: "border border-foreground/10 bg-card text-foreground hover:bg-foreground/5";

	return (
		<button type="button" onClick={onClick} className={`${base} ${cls}`}>
			{children}
		</button>
	);
}

function Pill({
	children,
	variant = "muted",
}: {
	children: React.ReactNode;
	variant?: "muted" | "soft";
}) {
	const cls =
		variant === "soft"
			? "border-foreground/15 bg-foreground/7 text-foreground"
			: "border-foreground/10 bg-card text-foreground/80";

	return (
		<span
			className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}
		>
			{children}
		</span>
	);
}

function StatusBadge({ status }: { status: VehicleStatus }) {
	const cls =
		status === "Active"
			? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
			: status === "Idle"
				? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
				: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300";

	return (
		<span
			className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}
		>
			{status}
		</span>
	);
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
	const cls =
		risk === "Low"
			? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
			: risk === "Medium"
				? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
				: "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300";

	return (
		<span
			className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}
		>
			{risk} risk
		</span>
	);
}

function IconX() {
	return (
		<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
			<path
				d="M6 6l12 12M18 6 6 18"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function slugifyVehicleName(name: string) {
	return name
		.trim()
		.toLowerCase()
		.replace(/["']/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function VehicleImage({ name, className }: { name: string; className?: string }) {
	const slug = useMemo(() => slugifyVehicleName(name), [name]);
	const [src, setSrc] = useState<string>(() => `/${slug}.jpg`);
	const [triedJpeg, setTriedJpeg] = useState(false);

	if (!src) {
		return (
			<div
				className={`grid place-items-center overflow-hidden rounded-lg border border-sky-500/15 bg-sky-500/5 ${className ?? ""}`}
				aria-label="Vehicle image placeholder"
				role="img"
			>
				<div className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
					Image
				</div>
			</div>
		);
	}

	return (
		<div
			className={`relative overflow-hidden rounded-lg border border-sky-500/15 bg-sky-500/5 ${className ?? ""}`}
		>
			<Image
				src={src}
				alt={name}
				fill
				sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
				className="object-cover"
				onError={() => {
					if (!triedJpeg) {
						setTriedJpeg(true);
						setSrc(`/${slug}.jpeg`);
						return;
					}
					setSrc("");
				}}
			/>
		</div>
	);
}


type ApiVehicle = {
	id: string;
	registrationNumber: string;
	make: string | null;
	model: string | null;
	capacityKg: number | null;
	status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
	primaryDriver: { user: { name: string | null; email: string } } | null;
	name: string | null;
	imageUrl: string | null;
	maintenanceCycleDays: number | null;
	lastMaintenanceDate: string | null;
	nextMaintenanceDate: string | null;
};

type ApiShipment = {
	id: string;
	referenceNumber: string;
	status: "DRAFT" | "PLANNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
	vehicleId: string | null;
	createdAt: string;
};

function mapVehicleStatus(status: ApiVehicle["status"]): VehicleStatus {
	if (status === "ACTIVE") return "Active";
	if (status === "INACTIVE") return "Idle";
	return "Maintenance";
}

function mapVehicleType(capacityKg: number | null): VehicleType {
	if (capacityKg && capacityKg >= 2500) return "Truck";
	if (capacityKg && capacityKg <= 1200) return "Van";
	return "Truck";
}

function mapRisk(status: VehicleStatus, nextMaintenanceDate: string | null): RiskLevel {
	if (status === "Maintenance") return "High";
	
	// Calculate risk based on maintenance date
	if (nextMaintenanceDate) {
		const nextDate = new Date(nextMaintenanceDate);
		const today = new Date();
		const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		
		if (daysUntil <= 0) return "High"; // Overdue
		if (daysUntil <= 7) return "Medium"; // Due within a week
		return "Low";
	}
	
	// Fallback to status-based risk
	if (status === "Idle") return "Medium";
	return "Low";
}

async function fetchVehiclesAndShipments(): Promise<Vehicle[]> {
	const [vehiclesRes, shipmentsRes] = await Promise.all([
		api.get<{ data: ApiVehicle[] }>("/api/vehicles"),
		api.get<{ data: ApiShipment[] }>("/api/shipments"),
	]);

	const vehicles = vehiclesRes?.data ?? [];
	const shipments = shipmentsRes?.data ?? [];

	return vehicles.map((v) => {
		const uiStatus = mapVehicleStatus(v.status);
		const name = v.name ?? (`${v.make ?? ""} ${v.model ?? ""}`.trim() || v.registrationNumber);
		const assignedDriver = v.primaryDriver?.user.name ?? v.primaryDriver?.user.email ?? "—";

		const activeShipment = shipments
			.filter(
				(s) =>
					s.vehicleId === v.id &&
					(s.status === "IN_TRANSIT" || s.status === "PLANNED")
			)
			.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];

		return {
			id: v.id,
			name,
			number: v.registrationNumber,
			type: mapVehicleType(v.capacityKg),
			status: uiStatus,
			assignedDriver,
			currentShipment: activeShipment
				? { id: activeShipment.referenceNumber, href: "/dashboard/shipments" }
				: undefined,
			maintenanceRisk: mapRisk(uiStatus, v.nextMaintenanceDate),
			imageUrl: v.imageUrl,
			nextMaintenanceDate: v.nextMaintenanceDate,
			maintenanceCycleDays: v.maintenanceCycleDays,
		};
	});
}

function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="grid grid-cols-2 gap-3">
			<div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
				{label}
			</div>
			<div className="text-sm text-foreground">{value}</div>
		</div>
	);
}

export default function VehiclesPage() {
	const router = useRouter();
	const [view, setView] = useState<ViewMode>("table");
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const vehiclesQuery = useQuery({
		queryKey: ["vehicles", "shipments"],
		queryFn: fetchVehiclesAndShipments,
	});

	const vehicles = vehiclesQuery.data ?? [];
	const selected = useMemo(
		() => vehicles.find((v) => v.id === selectedId) ?? null,
		[vehicles, selectedId]
	);

	return (
		<main id="main" className="mx-auto w-full max-w-6xl px-4 py-6">
			<div className="mb-6 flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-xl font-semibold text-foreground">Vehicles</h1>
					<p className="mt-1 text-sm text-foreground/60">
						Manage fleet assets, assignments, current shipments, and maintenance risk.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<ToggleButton active={view === "table"} onClick={() => setView("table")}>
						Table
					</ToggleButton>
					<ToggleButton active={view === "cards"} onClick={() => setView("cards")}>
						Cards
					</ToggleButton>
				</div>
			</div>

			<Card
				title="Vehicle Directory"
				description="Click a vehicle to open the detail side panel."
			>
				{vehiclesQuery.isError ? (
					<div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
						Failed to load vehicles.
					</div>
				) : null}

				{vehiclesQuery.isLoading ? (
					<div className="mb-4 rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/70">
						Loading vehicles…
					</div>
				) : null}

				{!vehiclesQuery.isLoading && vehicles.length === 0 ? (
					<div className="mb-4 rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground/70">
						No vehicles found.
					</div>
				) : null}

				{view === "table" ? (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[980px] border-separate border-spacing-0">
							<thead>
								<tr className="text-left">
									<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
										Vehicle
									</th>
									<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
										Type
									</th>
									<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
										Status
									</th>
									<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
										Assigned Driver
									</th>
									<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
										Current Shipment
									</th>
									<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
										Maintenance Risk
									</th>
								</tr>
							</thead>
							<tbody>
								{vehicles.map((v) => (
									<tr
										key={v.id}
										className="cursor-pointer align-top outline-none hover:bg-foreground/[0.03]"
										onClick={() => setSelectedId(v.id)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												setSelectedId(v.id);
											}
										}}
										tabIndex={0}
										aria-label={`Open details for ${v.name}`}
									>
										<td className="border-b border-foreground/10 py-4 pr-4">
											<div className="flex items-start gap-3">
												<VehicleImage name={v.name} className="h-12 w-16" />
												<div className="min-w-0">
													<div className="truncate text-sm font-semibold text-foreground">
														{v.name}
													</div>
													<div className="mt-1 text-xs text-foreground/60">{v.number}</div>
												</div>
											</div>
										</td>
										<td className="border-b border-foreground/10 py-4 pr-4">
											<div className="text-sm text-foreground">{v.type}</div>
										</td>
										<td className="border-b border-foreground/10 py-4 pr-4">
											<StatusBadge status={v.status} />
										</td>
										<td className="border-b border-foreground/10 py-4 pr-4">
											<div className="text-sm text-foreground">{v.assignedDriver}</div>
										</td>
										<td className="border-b border-foreground/10 py-4 pr-4">
											{v.currentShipment ? (
												<span className="text-sm font-semibold text-foreground">
													{v.currentShipment.id}
												</span>
											) : (
												<span className="text-sm text-foreground/60">—</span>
											)}
										</td>
										<td className="border-b border-foreground/10 py-4">
											<RiskBadge risk={v.maintenanceRisk} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{vehicles.map((v) => (
							<button
								key={v.id}
								type="button"
								onClick={() => setSelectedId(v.id)}
								className="rounded-xl border border-foreground/10 bg-card p-4 text-left outline-none transition hover:bg-foreground/[0.03] focus-visible:ring-2 focus-visible:ring-foreground/30"
								aria-label={`Open details for ${v.name}`}
							>
								<VehicleImage name={v.name} className="h-28 w-full" />
								<div className="mt-3 flex items-start justify-between gap-3">
									<div className="min-w-0">
										<div className="truncate text-sm font-semibold text-foreground">
											{v.name}
										</div>
										<div className="mt-1 text-xs text-foreground/60">{v.number}</div>
									</div>
									<div className="shrink-0">
										<StatusBadge status={v.status} />
									</div>
								</div>

								<div className="mt-3 flex flex-wrap items-center gap-2">
									<Pill variant="soft">{v.type}</Pill>
									<RiskBadge risk={v.maintenanceRisk} />
								</div>

								<div className="mt-3 space-y-2">
									<div className="flex items-center justify-between gap-3">
										<div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
											Driver
										</div>
										<div className="truncate text-sm text-foreground">
											{v.assignedDriver}
										</div>
									</div>
									<div className="flex items-center justify-between gap-3">
										<div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
											Shipment
										</div>
										<div className="truncate text-sm text-foreground">
											{v.currentShipment ? v.currentShipment.id : "—"}
										</div>
									</div>
								</div>
							</button>
						))}
					</div>
				)}
			</Card>

			{selected ? (
				<div
					className="fixed inset-0 z-50"
					role="dialog"
					aria-modal="true"
					aria-label="Vehicle details"
				>
					<button
						type="button"
						className="absolute inset-0 bg-foreground/20"
						aria-label="Close"
						onClick={() => setSelectedId(null)}
					/>

					<aside className="absolute inset-y-0 right-0 w-full max-w-md border-l border-foreground/10 bg-card">
						<div className="flex items-start justify-between gap-3 border-b border-foreground/10 p-4">
							<div className="min-w-0">
								<div className="truncate text-sm font-semibold text-foreground">
									{selected.name}
								</div>
								<div className="mt-1 text-xs text-foreground/60">{selected.number}</div>
							</div>
							<button
								type="button"
								onClick={() => setSelectedId(null)}
								className="inline-flex items-center justify-center rounded-md border border-foreground/10 bg-card p-2 text-foreground outline-none transition hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-foreground/30"
								aria-label="Close panel"
							>
								<IconX />
							</button>
						</div>

						<div className="p-4">
							<VehicleImage name={selected.name} className="h-40 w-full" />

							<div className="mt-4 flex flex-wrap items-center gap-2">
								<StatusBadge status={selected.status} />
								<Pill variant="soft">{selected.type}</Pill>
								<RiskBadge risk={selected.maintenanceRisk} />
							</div>

							<div className="mt-5 space-y-4">
								<KeyValue label="Vehicle" value={selected.name} />
								<KeyValue label="Number" value={selected.number} />
								<KeyValue label="Assigned driver" value={selected.assignedDriver} />
								<KeyValue
									label="Current shipment"
									value={selected.currentShipment ? selected.currentShipment.id : "—"}
								/>
								<KeyValue label="Maintenance risk" value={<RiskBadge risk={selected.maintenanceRisk} />} />
							</div>
						</div>
					</aside>
				</div>
			) : null}
		</main>
	);
}
