import type { NextFunction, Request, Response } from "express";

import prisma from "../prisma/client";

type HttpError = Error & { statusCode?: number; code?: string };

function httpError(statusCode: number, message: string, code?: string): HttpError {
	const err = new Error(message) as HttpError;
	err.statusCode = statusCode;
	if (code) err.code = code;
	return err;
}

export async function listDrivers(_req: Request, res: Response, next: NextFunction) {
	try {
		const drivers = await prisma.driver.findMany({
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				licenseNumber: true,
				phone: true,
				isActive: true,
				user: { select: { id: true, name: true, email: true } },
				vehicles: { select: { id: true, registrationNumber: true, status: true } },
				shipments: { select: { id: true, status: true, createdAt: true } },
				tripSheets: { select: { id: true, status: true, startedAt: true, endedAt: true, createdAt: true } },
			},
		});

		res.status(200).json({ data: drivers });
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
				shipments: true,
				tripSheets: true,
				documents: true,
			},
		});

		if (!driver) throw httpError(404, "Driver not found", "DRIVER_NOT_FOUND");

		res.status(200).json({ data: driver });
	} catch (err) {
		next(err);
	}
}
