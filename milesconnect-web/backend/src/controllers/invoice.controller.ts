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

		res.status(200).json({ data: invoice });
	} catch (err) {
		next(err);
	}
}
