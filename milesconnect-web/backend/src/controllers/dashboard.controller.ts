import type { NextFunction, Request, Response } from "express";

import prisma from "../prisma/client";

function startOfMonth(d: Date) {
	return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysAgo(days: number) {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return d;
}

export async function getDashboardSummary(_req: Request, res: Response, next: NextFunction) {
	try {
		const now = new Date();
		const monthStart = startOfMonth(now);
		const last30 = daysAgo(30);

		const [
			shipmentsLast30,
			inTransit,
			delivered,
			revenueMtd,
			vehiclesTotal,
			vehiclesInMaintenance,
			overdueInvoices,
			recentShipments,
			recentTripSheets,
		] = await Promise.all([
			prisma.shipment.count({ where: { createdAt: { gte: last30 } } }),
			prisma.shipment.count({ where: { status: "IN_TRANSIT" } }),
			prisma.shipment.count({ where: { status: "DELIVERED" } }),
			prisma.invoice.aggregate({
				_sum: { totalCents: true },
				where: { issuedAt: { gte: monthStart } },
			}),
			prisma.vehicle.count(),
			prisma.vehicle.count({ where: { status: "MAINTENANCE" } }),
			prisma.invoice.count({
				where: {
					status: { in: ["ISSUED", "DRAFT"] },
					dueAt: { lt: now },
				},
			}),
			prisma.shipment.findMany({
				take: 5,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					referenceNumber: true,
					status: true,
					createdAt: true,
				},
			}),
			prisma.tripSheet.findMany({
				take: 5,
				orderBy: { createdAt: "desc" },
				include: {
					driver: { include: { user: { select: { name: true } } } },
					vehicle: { select: { registrationNumber: true } },
				},
			}),
		]);

		const sumCents = revenueMtd._sum.totalCents ?? BigInt(0);

		res.status(200).json({
			data: {
				kpis: {
					shipmentsLast30,
					inTransit,
					delivered,
					revenueMtdCents: sumCents.toString(),
					vehiclesTotal,
					vehiclesInMaintenance,
					overdueInvoices,
				},
				recent: {
					shipments: recentShipments,
					tripSheets: recentTripSheets,
				},
			},
		});
	} catch (err) {
		next(err);
	}
}
