import type { Metadata } from "next";
import Link from "next/link";
import KpiCard, { type KpiTrend } from "./components/KpiCard";

export const metadata: Metadata = {
	title: "Command Center · MilesConnect",
};

type Kpi = {
	label: string;
	value: string;
	sublabel: string;
	trend?: KpiTrend;
	realtime?: boolean;
	href: string;
};

type Alert = {
	title: string;
	description: string;
	count: number;
	severity: "high" | "medium" | "low";
	href: string;
};

type Activity = {
	id: string;
	title: string;
	description: string;
	when: string;
	tone: "info" | "success" | "warning";
};

type DashboardSummaryResponse = {
	data: {
		kpis: {
			shipmentsLast30: number;
			inTransit: number;
			delivered: number;
			revenueMtdCents: string;
			vehiclesTotal: number;
			vehiclesInMaintenance: number;
			overdueInvoices: number;
		};
		recent: {
			shipments: Array<{
				id: string;
				referenceNumber: string;
				status: string;
				createdAt: string;
			}>;
			tripSheets: Array<{
				id: string;
				createdAt: string;
				driver: { user: { name: string | null } };
				vehicle: { registrationNumber: string } | null;
			}>;
		};
	};
};

type ApiVehicle = { status: "ACTIVE" | "INACTIVE" | "MAINTENANCE" };

function formatCurrencyFromCentsString(centsString: string) {
	const cents = Number.parseInt(centsString, 10);
	if (!Number.isFinite(cents)) return "₹0";
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(cents / 100);
}

function formatRelativeWhen(iso: string) {
	const t = new Date(iso).getTime();
	if (!Number.isFinite(t)) return "—";
	const diffMs = Date.now() - t;
	const diffMin = Math.max(0, Math.round(diffMs / 60000));
	if (diffMin < 2) return "just now";
	if (diffMin < 60) return `${diffMin} min ago`;
	const diffHr = Math.round(diffMin / 60);
	if (diffHr < 24) return `${diffHr}h ago`;
	const diffDays = Math.round(diffHr / 24);
	return `${diffDays}d ago`;
}

async function fetchDashboardSummary(): Promise<DashboardSummaryResponse["data"] | null> {
	const base =
		process.env.BACKEND_URL ??
		process.env.NEXT_PUBLIC_BACKEND_URL ??
		process.env.NEXT_PUBLIC_API_BASE_URL ??
		"http://localhost:3001";

	try {
		const res = await fetch(`${base}/api/dashboard/summary`, { cache: "no-store" });
		if (!res.ok) return null;
		const json = (await res.json()) as DashboardSummaryResponse;
		return json?.data ?? null;
	} catch {
		return null;
	}
}

async function fetchVehicles(): Promise<ApiVehicle[]> {
	const base =
		process.env.BACKEND_URL ??
		process.env.NEXT_PUBLIC_BACKEND_URL ??
		process.env.NEXT_PUBLIC_API_BASE_URL ??
		"http://localhost:3001";

	try {
		const res = await fetch(`${base}/api/vehicles`, { cache: "no-store" });
		if (!res.ok) return [];
		const json = (await res.json()) as { data?: ApiVehicle[] };
		return Array.isArray(json?.data) ? json.data : [];
	} catch {
		return [];
	}
}

function TonePill({
	tone,
	children,
}: {
	tone: "positive" | "negative" | "neutral" | "high" | "medium" | "low";
	children: React.ReactNode;
}) {
	const classes =
		tone === "positive"
			? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
			: tone === "negative"
				? "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300"
				: tone === "high"
					? "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300"
					: tone === "medium"
						? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
						: tone === "low"
							? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
							: "border-foreground/10 bg-card text-foreground/80";

	return (
		<span
			className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${classes}`}
		>
			{children}
		</span>
	);
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
					<h2 className="truncate text-sm font-semibold text-foreground">
						{title}
					</h2>
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

function KpiIcon({ variant }: { variant: "shipments" | "transit" | "delivered" | "revenue" }) {
	const common = "h-5 w-5";

	if (variant === "revenue") {
		return (
			<svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden="true">
				<path
					d="M4 7h16M4 12h16M4 17h10"
					stroke="currentColor"
					strokeWidth="1.75"
					strokeLinecap="round"
				/>
				<path
					d="M18 16.5c0 1.657-1.343 3-3 3"
					stroke="currentColor"
					strokeWidth="1.75"
					strokeLinecap="round"
				/>
			</svg>
		);
	}

	if (variant === "delivered") {
		return (
			<svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden="true">
				<path
					d="M20 6H4v12h16V6Z"
					stroke="currentColor"
					strokeWidth="1.75"
					strokeLinejoin="round"
				/>
				<path
					d="m8 12 2.5 2.5L16 9"
					stroke="currentColor"
					strokeWidth="1.75"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		);
	}

	if (variant === "transit") {
		return (
			<svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden="true">
				<path
					d="M3 7h13v10H3V7Z"
					stroke="currentColor"
					strokeWidth="1.75"
					strokeLinejoin="round"
				/>
				<path
					d="M16 10h3l2 3v4h-5v-7Z"
					stroke="currentColor"
					strokeWidth="1.75"
					strokeLinejoin="round"
				/>
				<path
					d="M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm12 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
					fill="currentColor"
					opacity="0.6"
				/>
			</svg>
		);
	}

	return (
		<svg viewBox="0 0 24 24" className={common} fill="none" aria-hidden="true">
			<path
				d="M7 7h10v10H7V7Z"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinejoin="round"
			/>
			<path
				d="M7 11h10"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function UtilizationBar({
	label,
	value,
	total,
}: {
	label: string;
	value: number;
	total: number;
}) {
	const pct = total === 0 ? 0 : Math.round((value / total) * 100);
	return (
		<div>
			<div className="flex items-center justify-between gap-3">
				<div className="text-sm text-foreground/80">{label}</div>
				<div className="text-sm font-semibold text-foreground">{pct}%</div>
			</div>
			<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
				<div
					className="h-full rounded-full bg-sky-500/60"
					style={{ width: `${pct}%` }}
					aria-hidden="true"
				/>
			</div>
			<div className="mt-2 text-xs text-foreground/60">
				{value} of {total} vehicles
			</div>
		</div>
	);
}

function ActivityDot({ tone }: { tone: Activity["tone"] }) {
	const cls =
		tone === "success"
			? "bg-emerald-500"
			: tone === "warning"
				? "bg-amber-500"
				: "bg-sky-500";
	return <span className={`mt-1.5 h-2 w-2 rounded-full ${cls}`} />;
}

export default async function DashboardPage() {
	const summary = await fetchDashboardSummary();
	const vehicles = await fetchVehicles();

	const vehiclesTotal = summary?.kpis.vehiclesTotal ?? vehicles.length;
	const vehiclesInMaintenance = summary?.kpis.vehiclesInMaintenance ?? vehicles.filter((v) => v.status === "MAINTENANCE").length;
	const vehiclesActive = vehicles.filter((v) => v.status === "ACTIVE").length;
	const vehiclesIdle = vehicles.filter((v) => v.status === "INACTIVE").length;

	const utilizationPct = vehiclesTotal === 0 ? 0 : Math.round((vehiclesActive / vehiclesTotal) * 100);
	const targetPct = 78;
	const gap = Math.max(0, targetPct - utilizationPct);

	const kpis: Kpi[] = [
		{
			label: "Total Shipments",
			value: String(summary?.kpis.shipmentsLast30 ?? 0),
			sublabel: "Last 30 days",
			trend: undefined,
			realtime: true,
			href: "/dashboard/shipments",
		},
		{
			label: "In Transit",
			value: String(summary?.kpis.inTransit ?? 0),
			sublabel: "Actively moving",
			trend: undefined,
			realtime: true,
			href: "/dashboard/shipments",
		},
		{
			label: "Delivered",
			value: String(summary?.kpis.delivered ?? 0),
			sublabel: "Last 30 days",
			trend: undefined,
			href: "/dashboard/shipments",
		},
		{
			label: "Revenue",
			value: formatCurrencyFromCentsString(summary?.kpis.revenueMtdCents ?? "0"),
			sublabel: "Month-to-date",
			trend: undefined,
			href: "/dashboard/billing",
		},
	];

	const overdueInvoices = summary?.kpis.overdueInvoices ?? 0;
	const alerts: Alert[] = [
		{
			title: "Overdue Invoices",
			description: "Invoices past due date that may impact cash flow.",
			count: overdueInvoices,
			severity: overdueInvoices > 0 ? "high" : "low",
			href: "/dashboard/billing",
		},
		{
			title: "Vehicles in Maintenance",
			description: "Currently unavailable due to maintenance status.",
			count: vehiclesInMaintenance,
			severity: vehiclesInMaintenance > 0 ? "medium" : "low",
			href: "/dashboard/maintenance",
		},
		{
			title: "In-Transit Shipments",
			description: "Active shipments currently moving.",
			count: summary?.kpis.inTransit ?? 0,
			severity: "low",
			href: "/dashboard/shipments",
		},
	];

	const fleet = {
		totalVehicles: vehiclesTotal,
		active: vehiclesActive,
		idle: vehiclesIdle,
		maintenance: vehiclesInMaintenance,
		utilizationPct,
		targetPct,
	};

	const recentShipments = summary?.recent.shipments ?? [];
	const recentTripSheets = summary?.recent.tripSheets ?? [];

	const shipmentActivity: Activity[] = recentShipments.map((s) => {
		const status = String(s.status ?? "");
		const tone: Activity["tone"] =
			status === "DELIVERED" ? "success" : status === "IN_TRANSIT" ? "info" : "warning";
		return {
			id: `shp_${s.id}`,
			title: `Shipment ${s.referenceNumber}`,
			description: `Status: ${status}`,
			when: formatRelativeWhen(s.createdAt),
			tone,
		};
	});

	const tripSheetActivity: Activity[] = recentTripSheets.map((t) => {
		const driverName = t.driver?.user?.name ?? "Driver";
		const vehicleNumber = t.vehicle?.registrationNumber ?? "—";
		return {
			id: `trip_${t.id}`,
			title: "Trip sheet created",
			description: `${driverName} · ${vehicleNumber}`,
			when: formatRelativeWhen(t.createdAt),
			tone: "info",
		};
	});

	const activity: Activity[] = [...shipmentActivity, ...tripSheetActivity].slice(0, 6);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-1">
				<h1 className="text-lg font-semibold text-foreground">Command Center</h1>
				<p className="text-sm text-foreground/60">
					Prioritize exceptions, allocate capacity, and stay ahead of SLA risk.
				</p>
			</div>

			{/* KPI Row */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<KpiCard
					title={kpis[0]!.label}
					value={kpis[0]!.value}
					subtitle={kpis[0]!.sublabel}
					icon={<KpiIcon variant="shipments" />}
					accent="shipments"
					trend={kpis[0]!.trend}
					realtime={kpis[0]!.realtime}
					href={kpis[0]!.href}
				/>
				<KpiCard
					title={kpis[1]!.label}
					value={kpis[1]!.value}
					subtitle={kpis[1]!.sublabel}
					icon={<KpiIcon variant="transit" />}
					accent="transit"
					trend={kpis[1]!.trend}
					realtime={kpis[1]!.realtime}
					href={kpis[1]!.href}
				/>
				<KpiCard
					title={kpis[2]!.label}
					value={kpis[2]!.value}
					subtitle={kpis[2]!.sublabel}
					icon={<KpiIcon variant="delivered" />}
					accent="delivered"
					trend={kpis[2]!.trend}
					href={kpis[2]!.href}
				/>
				<KpiCard
					title={kpis[3]!.label}
					value={kpis[3]!.value}
					subtitle={kpis[3]!.sublabel}
					icon={<KpiIcon variant="revenue" />}
					accent="revenue"
					trend={kpis[3]!.trend}
					href={kpis[3]!.href}
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
				{/* Alerts */}
				<Card
					title="Alerts"
					description="Focus on exceptions that impact service levels and cash flow."
					action={
						<Link
							href="/dashboard/shipments"
							className="rounded-md border border-foreground/10 bg-card px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
						>
							Review
						</Link>
					}
				>
					<div className="space-y-3">
						{alerts.map((a) => (
							<Link
								key={a.title}
								href={a.href}
								className="block rounded-lg border border-foreground/10 p-3 outline-none transition hover:bg-foreground/[0.03] focus-visible:ring-2 focus-visible:ring-foreground/30"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<div className="truncate text-sm font-semibold text-foreground">
												{a.title}
											</div>
											<TonePill tone={a.severity}>{a.severity}</TonePill>
										</div>
										<div className="mt-1 text-xs text-foreground/60">
											{a.description}
										</div>
									</div>
										<div className="shrink-0 rounded-lg border border-foreground/10 bg-card px-2 py-1 text-sm font-semibold text-foreground">
										{a.count}
									</div>
								</div>
							</Link>
						))}
					</div>
				</Card>

				{/* Fleet utilization */}
				<Card
					title="Fleet Utilization"
					description="Capacity vs demand signal to adjust dispatch and maintenance windows."
					action={
						<Link
							href="/dashboard/fleet"
							className="rounded-md border border-foreground/10 bg-card px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
						>
							Fleet map
						</Link>
					}
				>
					<div className="space-y-4">
						<div className="flex items-start justify-between gap-4">
							<div>
								<div className="text-3xl font-semibold text-foreground">
									{fleet.utilizationPct}%
								</div>
								<div className="mt-1 text-xs text-foreground/60">
									Target: {fleet.targetPct}%
									{gap > 0 ? ` • Gap: ${gap} pts` : " • On target"}
								</div>
							</div>
							<div className="rounded-lg border border-foreground/10 bg-card px-3 py-2">
								<div className="text-xs text-foreground/60">Active now</div>
								<div className="text-lg font-semibold text-foreground">
									{fleet.active}
								</div>
							</div>
						</div>

						<UtilizationBar
							label="Active vehicles"
							value={fleet.active}
							total={fleet.totalVehicles}
						/>

						<div className="grid grid-cols-3 gap-3">
							<div className="rounded-lg border border-foreground/10 bg-card p-3">
								<div className="text-xs text-foreground/60">Idle</div>
								<div className="mt-1 text-lg font-semibold text-foreground">
									{fleet.idle}
								</div>
							</div>
							<div className="rounded-lg border border-foreground/10 bg-card p-3">
								<div className="text-xs text-foreground/60">Maintenance</div>
								<div className="mt-1 text-lg font-semibold text-foreground">
									{fleet.maintenance}
								</div>
							</div>
							<div className="rounded-lg border border-foreground/10 bg-card p-3">
								<div className="text-xs text-foreground/60">Total</div>
								<div className="mt-1 text-lg font-semibold text-foreground">
									{fleet.totalVehicles}
								</div>
							</div>
						</div>
					</div>
				</Card>

				{/* Activity feed */}
				<Card
					title="Recent Activity"
					description="Operational events and signals worth following up."
					action={
						<Link
							href="/dashboard/documents"
							className="rounded-md border border-foreground/10 bg-card px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
						>
							Audit
						</Link>
					}
				>
					<ol className="space-y-3" aria-label="Recent activity">
						{activity.map((item) => (
							<li
								key={item.id}
								className="rounded-lg border border-foreground/10 p-3"
							>
								<div className="flex items-start gap-3">
									<ActivityDot tone={item.tone} />
									<div className="min-w-0 flex-1">
										<div className="flex items-start justify-between gap-3">
											<div className="truncate text-sm font-semibold text-foreground">
												{item.title}
											</div>
											<div className="shrink-0 text-xs text-foreground/50">
												{item.when}
											</div>
										</div>
										<div className="mt-1 text-xs text-foreground/60">
											{item.description}
										</div>
									</div>
								</div>
							</li>
						))}
					</ol>
				</Card>
			</div>
		</div>
	);
}

