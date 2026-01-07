"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import KpiCard from "../../dashboard/components/KpiCard";
import { api } from "@/lib/api";

type PaymentStatusUi = "Paid" | "Pending" | "Failed" | "Refunded";
type PaymentMethodUi = "UPI" | "NetBanking" | "Card" | "Wallet";

type InvoiceRow = {
	id: string;
	customer: string;
	issuedOn: string;
	dueOn: string;
	amount: string;
	status: PaymentStatusUi;
	method: PaymentMethodUi;
	reference: string;
};

type ApiPayment = {
	status: "PENDING" | "SUCCEEDED" | "FAILED" | "REVERSED";
	method: "CASH" | "BANK_TRANSFER" | "CARD" | "UPI" | "OTHER";
	amountCents: string | number;
	providerReference: string | null;
	idempotencyKey: string;
	receivedAt: string;
};

type ApiInvoice = {
	id: string;
	invoiceNumber: string;
	status: "DRAFT" | "ISSUED" | "PAID" | "VOID";
	totalCents: string | number;
	issuedAt: string | null;
	dueAt: string | null;
	shipment: { id: string; referenceNumber: string; originAddress: string; destinationAddress: string } | null;
	createdBy: { id: string; name: string | null; email: string };
	payments: ApiPayment[];
};

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

function StatusBadge({ status }: { status: PaymentStatusUi }) {
	const classes =
		status === "Paid"
			? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
			: status === "Pending"
				? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
				: status === "Failed"
					? "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300"
					: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300";

	return (
		<span
			className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${classes}`}
		>
			{status}
		</span>
	);
}

function Button({
	children,
	disabled,
}: {
	children: React.ReactNode;
	disabled?: boolean;
}) {
	const base =
		"inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-foreground/30";

	const cls = disabled
		? "border border-foreground/10 bg-card text-foreground/50"
		: "border border-foreground/10 bg-card text-foreground hover:bg-foreground/5";

	return (
		<button type="button" disabled={disabled} className={`${base} ${cls}`}>
			{children}
		</button>
	);
}

function MoneyIcon() {
	return (
		<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
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

function InvoiceIcon() {
	return (
		<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
			<path
				d="M7 3h10v18l-2-1-3 1-3-1-2 1V3Z"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinejoin="round"
			/>
			<path
				d="M9 8h6M9 12h6"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function ClockIcon() {
	return (
		<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
			<path
				d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
				stroke="currentColor"
				strokeWidth="1.75"
			/>
			<path
				d="M12 7v6l4 2"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function ShieldIcon() {
	return (
		<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
			<path
				d="M12 3 20 7v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4Z"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinejoin="round"
			/>
			<path
				d="m9.5 12 1.8 1.8L15 10"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function inrFromCents(cents: string | number) {
	const n = typeof cents === "string" ? Number(cents) : cents;
	if (!Number.isFinite(n)) return "₹0";
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(n / 100);
}

function shortPlace(addr: string) {
	const first = addr.split(",")[0]?.trim();
	return first || addr;
}

function toUiMethod(method: ApiPayment["method"]): PaymentMethodUi {
	if (method === "UPI") return "UPI";
	if (method === "BANK_TRANSFER") return "NetBanking";
	if (method === "CARD") return "Card";
	return "Wallet";
}

function toUiStatus(inv: ApiInvoice): PaymentStatusUi {
	if (inv.status === "VOID") return "Refunded";
	if (inv.payments.some((p) => p.status === "FAILED")) return "Failed";
	if (inv.status === "PAID") return "Paid";
	return "Pending";
}

function latestPayment(inv: ApiInvoice): ApiPayment | null {
	if (!inv.payments?.length) return null;
	return [...inv.payments].sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))[0] ?? null;
}

async function fetchInvoices(): Promise<ApiInvoice[]> {
	const res = await api.get<{ data: ApiInvoice[] }>("/api/invoices");
	return res?.data ?? [];
}

export default function BillingClient() {
	const invoicesQuery = useQuery({
		queryKey: ["invoices"],
		queryFn: fetchInvoices,
	});

	const rows: InvoiceRow[] = useMemo(() => {
		return (invoicesQuery.data ?? []).slice(0, 10).map((inv) => {
			const pay = latestPayment(inv);
			const status = toUiStatus(inv);
			const method = pay ? toUiMethod(pay.method) : "Wallet";
			const reference = pay?.providerReference ?? pay?.idempotencyKey ?? "—";
			const issuedOn = inv.issuedAt ? inv.issuedAt.slice(0, 10) : "—";
			const dueOn = inv.dueAt ? inv.dueAt.slice(0, 10) : "—";

			const customer = inv.shipment
				? `${shortPlace(inv.shipment.originAddress)} → ${shortPlace(inv.shipment.destinationAddress)}`
				: inv.createdBy.name ?? inv.createdBy.email;

			return {
				id: inv.invoiceNumber,
				customer,
				issuedOn,
				dueOn,
				amount: inrFromCents(inv.totalCents),
				status,
				method,
				reference,
			};
		});
	}, [invoicesQuery.data]);

	const kpis = useMemo(() => {
		const invoices = invoicesQuery.data ?? [];
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		let revenueMtdCents = 0;
		let paidCount = 0;
		let pendingCount = 0;
		let overdueRiskCents = 0;

		for (const inv of invoices) {
			const status = toUiStatus(inv);
			if (inv.issuedAt) {
				const issued = new Date(inv.issuedAt);
				if (!Number.isNaN(issued.getTime()) && issued >= monthStart) {
					revenueMtdCents += Number(inv.totalCents);
				}
			}

			if (status === "Paid") paidCount += 1;
			else if (status === "Pending") pendingCount += 1;

			if (status === "Pending" && inv.dueAt) {
				const due = new Date(inv.dueAt);
				if (!Number.isNaN(due.getTime()) && due < now) {
					overdueRiskCents += Number(inv.totalCents);
				}
			}
		}

		return {
			revenueMtd: inrFromCents(revenueMtdCents),
			paidCount: String(paidCount),
			pendingCount: String(pendingCount),
			overdueRisk: inrFromCents(overdueRiskCents),
		};
	}, [invoicesQuery.data]);

	const payout = useMemo(() => {
		const invoices = invoicesQuery.data ?? [];
		let successCents = 0;
		let pendingCents = 0;
		let refundedCents = 0;

		for (const inv of invoices) {
			for (const p of inv.payments ?? []) {
				if (p.status === "SUCCEEDED") successCents += Number(p.amountCents);
				else if (p.status === "PENDING") pendingCents += Number(p.amountCents);
				else if (p.status === "REVERSED") refundedCents += Number(p.amountCents);
			}
			if (inv.status === "VOID") refundedCents += Number(inv.totalCents);
		}

		return {
			success: inrFromCents(successCents),
			pending: inrFromCents(pendingCents),
			refunded: inrFromCents(refundedCents),
		};
	}, [invoicesQuery.data]);

	return (
		<main id="main" className="mx-auto w-full max-w-6xl px-4 py-6">
			<div className="mb-6">
				<h1 className="text-xl font-semibold text-foreground">Billing & Payments</h1>
				<p className="mt-1 text-sm text-foreground/60">
					Invoices, payment statuses, and receipt downloads. UI is prepared for Paytm
					sandbox integration later.
				</p>
			</div>

			{invoicesQuery.isError ? (
				<div className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
					Failed to load invoices.
				</div>
			) : null}

			{invoicesQuery.isLoading ? (
				<div className="mb-4 rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-sm text-foreground/70">
					Loading invoices…
				</div>
			) : null}

			<div className="grid gap-4 lg:grid-cols-4">
				<KpiCard
					title="Revenue (MTD)"
					value={kpis.revenueMtd}
					subtitle="Billed this month"
					trend={{ label: "Live from invoices", tone: "neutral" }}
					icon={<MoneyIcon />}
					accent="violet"
				/>
				<KpiCard
					title="Paid Invoices"
					value={kpis.paidCount}
					subtitle="Settled"
					trend={{ label: "Live from invoices", tone: "neutral" }}
					icon={<ShieldIcon />}
					accent="emerald"
				/>
				<KpiCard
					title="Pending"
					value={kpis.pendingCount}
					subtitle="Awaiting payment"
					trend={{ label: "Live from invoices", tone: "neutral" }}
					icon={<ClockIcon />}
					accent="amber"
				/>
				<KpiCard
					title="Overdue Risk"
					value={kpis.overdueRisk}
					subtitle="At risk of overdue"
					trend={{ label: "Computed from due dates", tone: "neutral" }}
					icon={<InvoiceIcon />}
					accent="rose"
				/>
			</div>

			<div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
				<Card
					title="Invoices"
					description="Recent invoices with payment statuses and receipt download placeholders."
					action={
						<div className="text-xs text-foreground/60">Showing: last {Math.min(rows.length, 10)}</div>
					}
				>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[780px] border-separate border-spacing-0">
							<thead>
								<tr className="text-left text-xs font-semibold uppercase tracking-wide text-foreground/60">
									<th className="pb-3 pr-4">Invoice</th>
									<th className="pb-3 pr-4">Customer</th>
									<th className="pb-3 pr-4">Issued</th>
									<th className="pb-3 pr-4">Due</th>
									<th className="pb-3 pr-4">Amount</th>
									<th className="pb-3 pr-4">Status</th>
									<th className="pb-3 pr-4">Method</th>
									<th className="pb-3">Receipt</th>
								</tr>
							</thead>
							<tbody>
								{rows.length === 0 && !invoicesQuery.isLoading ? (
									<tr>
										<td colSpan={8} className="py-6">
											<div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-sm text-foreground/70">
												No invoices found.
											</div>
									</td>
								</tr>
								) : null}

								{rows.map((inv) => {
									const canDownload = inv.status === "Paid";
									return (
										<tr key={inv.id} className="border-t border-foreground/10">
											<td className="py-3 pr-4 align-top">
												<div className="text-sm font-semibold text-foreground">{inv.id}</div>
												<div className="mt-1 text-xs text-foreground/60">Ref: {inv.reference}</div>
											</td>
											<td className="py-3 pr-4 align-top">
												<div className="text-sm text-foreground">{inv.customer}</div>
											</td>
											<td className="py-3 pr-4 align-top">
												<div className="text-sm text-foreground/80">{inv.issuedOn}</div>
											</td>
											<td className="py-3 pr-4 align-top">
												<div className="text-sm text-foreground/80">{inv.dueOn}</div>
											</td>
											<td className="py-3 pr-4 align-top">
												<div className="text-sm font-semibold text-foreground">{inv.amount}</div>
											</td>
											<td className="py-3 pr-4 align-top">
												<StatusBadge status={inv.status} />
											</td>
											<td className="py-3 pr-4 align-top">
												<div className="text-sm text-foreground/80">{inv.method}</div>
											</td>
											<td className="py-3 align-top">
												<Button disabled={!canDownload}>Download receipt</Button>
												{!canDownload ? (
													<div className="mt-1 text-xs text-foreground/60">Available after payment.</div>
												) : (
													<div className="mt-1 text-xs text-foreground/60">Placeholder (PDF generation later).</div>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</Card>

				<div className="space-y-4">
					<Card
						title="Paytm Sandbox (Prep)"
						description="These inputs map to Paytm order creation & transaction verification. Wiring comes later."
					>
						<div className="space-y-3">
							<div>
								<div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Order ID</div>
								<div className="mt-1 rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground/80">
									ORDER_20251223_0001
								</div>
							</div>

							<div>
								<div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Customer ID</div>
								<div className="mt-1 rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground/80">
									CUST_10482
								</div>
							</div>

							<div>
								<div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Amount</div>
								<div className="mt-1 rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground/80">
									{kpis.revenueMtd}
								</div>
							</div>

							<div>
								<div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Callback URL</div>
								<div className="mt-1 rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm text-foreground/80">
									/api/paytm/callback
								</div>
								<div className="mt-1 text-xs text-foreground/60">Placeholder route for Paytm responses.</div>
							</div>

							<div className="grid gap-2">
								<Button disabled>Create Paytm order</Button>
								<Button disabled>Verify transaction</Button>
							</div>

							<div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3">
								<div className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Integration notes</div>
								<ul className="mt-2 space-y-1 text-xs text-foreground/60">
									<li>Store invoice → order mapping (invoiceId, orderId).</li>
									<li>Generate txnToken on server (sandbox key/secret).</li>
									<li>Redirect to Paytm checkout or invoke JS checkout.</li>
									<li>Verify checksum server-side on callback.</li>
								</ul>
							</div>
						</div>
					</Card>

					<Card title="Payout Summary" description="High-level breakdown for reconciliation (placeholder).">
						<div className="space-y-3">
							<div className="flex items-center justify-between gap-3">
								<div className="text-sm text-foreground/80">Successful payments</div>
								<div className="text-sm font-semibold text-foreground">{payout.success}</div>
							</div>
							<div className="flex items-center justify-between gap-3">
								<div className="text-sm text-foreground/80">Pending settlement</div>
								<div className="text-sm font-semibold text-foreground">{payout.pending}</div>
							</div>
							<div className="flex items-center justify-between gap-3">
								<div className="text-sm text-foreground/80">Refunded</div>
								<div className="text-sm font-semibold text-foreground">{payout.refunded}</div>
							</div>
							<div className="pt-2 text-xs text-foreground/60">
								Tip: This section can later pull from Paytm settlement reports.
							</div>
						</div>
					</Card>
				</div>
			</div>
		</main>
	);
}
