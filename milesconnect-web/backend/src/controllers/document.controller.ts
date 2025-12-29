import type { NextFunction, Request, Response } from "express";

import prisma from "../prisma/client";

export async function listDocuments(_req: Request, res: Response, next: NextFunction) {
	try {
		const documents = await prisma.document.findMany({
			orderBy: { createdAt: "desc" },
			include: {
				uploadedBy: { select: { id: true, name: true, email: true } },
				shipment: { select: { id: true, referenceNumber: true } },
				tripSheet: { select: { id: true, sheetNo: true } },
				vehicle: { select: { id: true, registrationNumber: true } },
				driver: { include: { user: { select: { id: true, name: true, email: true } } } },
				invoice: { select: { id: true, invoiceNumber: true } },
				payment: { select: { id: true, idempotencyKey: true, status: true } },
			},
		});

		res.status(200).json({ data: documents });
	} catch (err) {
		next(err);
	}
}
