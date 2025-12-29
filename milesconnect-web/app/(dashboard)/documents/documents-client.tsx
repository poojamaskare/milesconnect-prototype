"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type DocumentType = "POD" | "Invoice" | "Permit" | "Insurance";

type DocumentRow = {
	id: string;
	docNumber: string;
	name: string;
	type: DocumentType;
	linkedShipment: {
		id: string;
		href: string;
	};
	expiryDate: string;
};

type ApiDocument = {
	id: string;
	type: "POD" | "INVOICE" | "RC" | "INSURANCE" | "LICENSE" | "OTHER";
	fileName: string;
	createdAt: string;
	shipment: { id: string; referenceNumber: string } | null;
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

function Button({ children }: { children: React.ReactNode }) {
	return (
		<button
			type="button"
			className="inline-flex items-center justify-center rounded-md border border-foreground/10 bg-card px-3 py-2 text-sm font-semibold text-foreground outline-none transition hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-foreground/30"
		>
			{children}
		</button>
	);
}

function DocBadge({ type }: { type: DocumentType }) {
	const cls =
		type === "POD"
			? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
			: type === "Invoice"
				? "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300"
				: type === "Permit"
					? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
					: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300";

	return (
		<span
			className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}
		>
			{type}
		</span>
	);
}

function toUiType(t: ApiDocument["type"]): DocumentType {
	if (t === "POD") return "POD";
	if (t === "INVOICE") return "Invoice";
	if (t === "INSURANCE") return "Insurance";
	// RC/LICENSE/OTHER become Permit-like documents in the UI
	return "Permit";
}

function formatExpiry(createdAtIso: string, type: DocumentType) {
	// No explicit expiry in schema; derive a predictable date for permit/insurance-like docs.
	if (type === "POD" || type === "Invoice") return "—";
	const d = new Date(createdAtIso);
	if (Number.isNaN(d.getTime())) return "—";
	const days = type === "Insurance" ? 365 : 90;
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}

function generateDocNumber(type: DocumentType, index: number): string {
	const prefix = type === "POD" ? "POD" : type === "Invoice" ? "INV" : type === "Insurance" ? "INS" : "DOC";
	return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}

async function fetchDocuments(): Promise<DocumentRow[]> {
	const res = await api.get<{ data: ApiDocument[] }>("/api/documents");
	const docs = res?.data ?? [];
	return docs
		.filter((d) => d.shipment)
		.map((d, index) => {
			const uiType = toUiType(d.type);
			return {
				id: d.id,
				docNumber: generateDocNumber(uiType, index),
				name: d.fileName,
				type: uiType,
				linkedShipment: {
					id: d.shipment!.referenceNumber,
					href: "/dashboard/shipments",
				},
				expiryDate: formatExpiry(d.createdAt, uiType),
			};
		});
}

export default function DocumentsClient() {
	const documentsQuery = useQuery({
		queryKey: ["documents"],
		queryFn: fetchDocuments,
	});

	const rows = documentsQuery.data ?? [];

	return (
		<main id="main" className="mx-auto w-full max-w-6xl px-4 py-6">
			<div className="mb-6">
				<h1 className="text-xl font-semibold text-foreground">Documents</h1>
				<p className="mt-1 text-sm text-foreground/60">
					Manage shipment documents (PODs, invoices, permits). Upload is a placeholder.
				</p>
			</div>

			<Card
				title="Document List"
				description="Each row links to a shipment and shows expiry when applicable."
				action={<Button>Upload Document</Button>}
			>
				{documentsQuery.isError ? (
					<div className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300">
						Failed to load documents.
					</div>
				) : null}

				{documentsQuery.isLoading ? (
					<div className="mb-4 rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-sm text-foreground/70">
						Loading documents…
					</div>
				) : null}

				<div className="overflow-x-auto">
					<table className="w-full min-w-[820px] border-separate border-spacing-0">
						<thead>
							<tr className="text-left">
								<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
									Document
								</th>
								<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
									Linked Shipment
								</th>
								<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
									Expiry Date
								</th>
								<th className="border-b border-foreground/10 pb-3 text-xs font-semibold uppercase tracking-wide text-foreground/60">
									Action
								</th>
							</tr>
						</thead>
						<tbody>
							{rows.length === 0 && !documentsQuery.isLoading ? (
								<tr>
									<td colSpan={4} className="py-6">
										<div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-sm text-foreground/70">
											No documents found.
										</div>
									</td>
								</tr>
							) : null}

							{rows.map((row) => (
								<tr key={row.id} className="align-top">
									<td className="border-b border-foreground/10 py-4 pr-4">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<div className="text-sm font-semibold text-foreground">{row.name}</div>
												<div className="mt-1 text-xs text-foreground/60">{row.docNumber}</div>
											</div>
											<div className="shrink-0">
												<DocBadge type={row.type} />
											</div>
										</div>
									</td>
									<td className="border-b border-foreground/10 py-4 pr-4">
										<Link
											href={row.linkedShipment.href}
											className="text-sm font-semibold text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
										>
											{row.linkedShipment.id}
										</Link>
									</td>
									<td className="border-b border-foreground/10 py-4 pr-4">
										<div className="text-sm text-foreground">{row.expiryDate}</div>
									</td>
									<td className="border-b border-foreground/10 py-4">
										<Button>Upload</Button>
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
