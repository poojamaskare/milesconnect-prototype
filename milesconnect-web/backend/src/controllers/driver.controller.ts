import type { NextFunction, Request, Response } from "express";

import prisma from "../prisma/client";

type HttpError = Error & { statusCode?: number; code?: string };

import { z } from "zod";
import { UserRole } from "@prisma/client";


function httpError(statusCode: number, message: string, code?: string): HttpError {
	const err = new Error(message) as HttpError;
	err.statusCode = statusCode;
	if (code) err.code = code;
	return err;
}

export async function listDrivers(req: Request, res: Response, next: NextFunction) {
	try {
		const { sort } = req.query;
		let orderBy: any = { createdAt: "desc" };

		if (sort === "score_desc") {
			orderBy = { performanceScore: "desc" };
		} else if (sort === "trips_desc") {
			orderBy = { totalTrips: "desc" };
		}

		const drivers = await prisma.driver.findMany({
			orderBy,
			include: {
				user: { select: { id: true, name: true, email: true } },
				vehicles: { select: { id: true, registrationNumber: true, status: true } },
				shipments: {
					where: { status: "IN_TRANSIT" },
					select: { id: true, status: true, referenceNumber: true }
				},
				tripSheets: {
					where: { status: "APPROVED" },
					orderBy: { endedAt: "desc" },
					take: 1,
					select: { id: true, status: true, endedAt: true }
				}
			},
		});

		const driversWithAvailability = drivers.map((driver: any) => {
			const activeTripSheet = driver.tripSheets[0];
			const activeShipment = driver.shipments[0];
			// A driver is BUSY if they have an active shipment OR an active (approved/started) trip sheet
			// Note: We check tripSheets[0] which is the most ended or recent.
			// However, detailed check:
			const isOnTrip = activeTripSheet && activeTripSheet.status === 'APPROVED' && (!activeTripSheet.endedAt);

			const isBusy = !!activeShipment || !!isOnTrip;
			const isAvailable = driver.isActive && !isBusy;

			return {
				...driver,
				isAvailable,
				currentStatus: isBusy ? 'BUSY' : (driver.isActive ? 'AVAILABLE' : 'INACTIVE'),
				currentShipment: activeShipment || null,
			};
		});

		res.status(200).json({ data: driversWithAvailability });
	} catch (err) {
		next(err);
	}
}

export async function getDriver(req: Request, res: Response, next: NextFunction) {
	try {
		const { id } = req.params;
		const driver = await prisma.driver.findUnique({
			where: { id },
			include: {
				user: { select: { id: true, name: true, email: true } },
				vehicles: true,
				shipments: {
					orderBy: { createdAt: 'desc' },
					take: 5
				},
				tripSheets: {
					orderBy: { createdAt: 'desc' },
					take: 5
				},
				documents: true,
			},
		});

		if (!driver) throw httpError(404, "Driver not found", "DRIVER_NOT_FOUND");

		// Check for any active shipment (not just recent 5, need to be sure)
		// We can do a separate count or just trust the recent list if load is low,
		// but for correctness let's do a quick check if not found in top 5.
		let activeShipment = driver.shipments.find(s => s.status === 'IN_TRANSIT');

		if (!activeShipment) {
			const active = await prisma.shipment.findFirst({
				where: { driverId: id, status: 'IN_TRANSIT' },
				select: { id: true, status: true, referenceNumber: true }
			});
			if (active) activeShipment = active as any;
		}

		// Check for active Trip Sheet
		let activeTripSheet = driver.tripSheets.find(ts => ts.status === 'APPROVED' && !ts.endedAt);

		const isBusy = !!activeShipment || !!activeTripSheet;
		const isAvailable = driver.isActive && !isBusy;

		res.status(200).json({
			data: {
				...driver,
				isAvailable,
				currentStatus: isBusy ? 'BUSY' : (driver.isActive ? 'AVAILABLE' : 'INACTIVE'),
				currentShipment: activeShipment || null
			}
		});
	} catch (err) {
		next(err);
	}
}

const createDriverSchema = z
	.object({
		name: z.string().min(1),
		email: z.string().email(),
		password: z.string().min(6).optional(),
		licenseNumber: z.string().min(1),
		phone: z.string().optional(),
		address: z.string().optional(),
		isActive: z.boolean().optional(),
	});

export async function createDriver(req: Request, res: Response, next: NextFunction) {
	try {
		console.log("createDriver Req Body:", JSON.stringify(req.body, null, 2));
		const parsed = createDriverSchema.safeParse(req.body);
		if (!parsed.success) {
			console.error("Driver Validation Error:", JSON.stringify(parsed.error, null, 2));
			throw httpError(400, "Invalid request body", "VALIDATION_ERROR");
		}

		const body = parsed.data;

		// Transaction to create User and Driver
		const driver = await prisma.$transaction(async (tx) => {
			// 1. Create User
			const user = await tx.user.create({
				data: {
					email: body.email,
					name: body.name,
					passwordHash: body.password || "default_hash_123", // Placeholder hash
					role: UserRole.DRIVER,
					isActive: body.isActive ?? true,
				},
			});

			// 2. Create Driver linked to User
			return await tx.driver.create({
				data: {
					userId: user.id,
					licenseNumber: body.licenseNumber,
					phone: body.phone,
					address: body.address,
					isActive: body.isActive ?? true,
				},
				include: {
					user: { select: { id: true, name: true, email: true } },
				},
			});
		});

		res.status(201).json({ data: driver });
	} catch (err: unknown) {
		if (typeof err === "object" && err && "code" in err) {
			const anyErr = err as { code?: string };
			if (anyErr.code === "P2002") {
				next(httpError(409, "Driver with this email or license already exists", "DUPLICATE_DRIVER"));
				return;
			}
		}
		next(err);
	}
}
// DELETE /api/drivers/:id
export async function deleteDriver(req: Request, res: Response, next: NextFunction) {
	try {
		const { id } = req.params;

		// 1. Check if driver exists
		const driver = await prisma.driver.findUnique({
			where: { id },
			select: { userId: true },
		});

		if (!driver) {
			throw httpError(404, "Driver not found", "DRIVER_NOT_FOUND");
		}

		// 2. Attempt to delete Driver first (this will trigger Restrict checks on TripSheets)
		// If we deleted User first, the Cascade would verify Driver restrictions anyway.
		// Deliberately separate to handle errors clearly.
		await prisma.driver.delete({
			where: { id },
		});

		// 3. If Driver deletion succeeded, try to delete the associated User to clean up auth
		// This might fail if the User record created other entities (Shipments, Invoices),
		// in which case we suppress the error effectively leaving a "detached" User.
		try {
			await prisma.user.delete({
				where: { id: driver.userId },
			});
		} catch (err) {
			console.warn("Could not delete associated User record (likely due to created data dependencies). Driver profile was deleted successfully.", err);
		}

		res.status(200).json({ success: true, message: "Driver deleted successfully" });
	} catch (err: unknown) {
		// Handle Prisma Constraint Violation (P2003)
		if (typeof err === "object" && err && "code" in err) {
			const anyErr = err as { code?: string; meta?: any };
			if (anyErr.code === "P2003") {
				// Foreign key constraint failed
				next(httpError(409, "Cannot delete driver: They have associated Trip Sheets or other operational records.", "DEPENDENCY_VIOLATION"));
				return;
			}
		}
		next(err);
	}
}
