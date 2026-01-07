import type { NextFunction, Request, Response } from "express";

import prisma from "../prisma/client";

export async function listInvoices(_req: Request, res: Response, next: NextFunction) {
	try {
		const invoices = await prisma.invoice.findMany({
			orderBy: { createdAt: "desc" },
			include: {
				shipment: { select: { id: true, referenceNumber: true, originAddress: true, destinationAddress: true } },
				createdBy: { select: { id: true, name: true, email: true } },
				payments: true,
				documents: true,
			},
		});

		res.status(200).json({ data: invoices });
	} catch (err) {
		next(err);
	}
}

export async function getInvoice(req: Request, res: Response, next: NextFunction) {
	try {
		const { id } = req.params;
		const invoice = await prisma.invoice.findUnique({
			where: { id },
			include: {
				shipment: true,
				createdBy: { select: { id: true, name: true, email: true } },
				payments: true,
				documents: true,
			},
		});

		if (!invoice) {
			res.status(404).json({ error: { message: "Invoice not found", code: "INVOICE_NOT_FOUND" } });
			return;
		}

	} catch (err) {
		next(err);
	}
}

// Internal helper to generate invoice from shipment
export async function createInvoiceFromShipment(shipmentId: string, tx: any) {
	const shipment = await tx.shipment.findUnique({
		where: { id: shipmentId }
	});

	if (!shipment) throw new Error("Shipment not found for invoice generation");

	// Check if invoice already exists
	const existing = await tx.invoice.findUnique({
		where: { shipmentId }
	});

	if (existing) return existing; // Idempotency

	// Simple pricing logic: Base + Weight * Rate
	// This is a placeholder. Real logic would be more complex.
	const baseRateCents = 5000; // $50.00
	const weightRateCents = 10; // $0.10 per kg
	const weight = shipment.weightKg || 0;

	const subtotal = baseRateCents + (weight * weightRateCents);
	const tax = Math.round(subtotal * 0.18); // 18% GST/VAT
	const total = subtotal + tax;

	const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

	return await tx.invoice.create({
		data: {
			invoiceNumber,
			shipmentId,
			status: "DRAFT",
			subtotalCents: BigInt(subtotal),
			taxCents: BigInt(tax),
			totalCents: BigInt(total),
			createdById: shipment.createdById, // Assign to whoever created the shipment
			issuedAt: new Date(),
			dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days due
		}
	});
}
