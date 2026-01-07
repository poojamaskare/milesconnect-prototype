import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { MaintenanceStatus, MaintenanceType } from '@prisma/client';
import { httpError } from '../middleware/error.middleware';

export async function createMaintenanceLog(req: Request, res: Response, next: NextFunction) {
    try {
        const {
            vehicleId,
            type,
            description,
            date,
            odometerKm,
            cost, // in rupees, will convert to cents
            providerName,
            notes,
            nextServiceDate,
            status
        } = req.body;

        if (!vehicleId || !type || !description) {
            throw httpError(400, "Missing required fields");
        }

        const costCents = cost ? BigInt(Math.round(parseFloat(cost) * 100)) : BigInt(0);

        // Create Log
        const log = await prisma.maintenanceLog.create({
            data: {
                vehicleId,
                type: type as MaintenanceType,
                description,
                date: date ? new Date(date) : new Date(),
                odometerKm: odometerKm ? parseInt(odometerKm) : null,
                costCents,
                providerName,
                notes,
                nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
                status: status as MaintenanceStatus || "COMPLETED"
            }
        });

        // Update Vehicle (Last/Next Service Dates)
        // Only update if this log is indeed recent or future planning
        const updateData: any = {};
        const logDate = date ? new Date(date) : new Date();

        // Check if this is the latest maintenance
        const latestLog = await prisma.maintenanceLog.findFirst({
            where: { vehicleId },
            orderBy: { date: 'desc' }
        });

        if (latestLog?.id === log.id || (latestLog && logDate >= latestLog.date)) {
            updateData.lastMaintenanceDate = logDate;
        }

        if (nextServiceDate) {
            updateData.nextMaintenanceDate = new Date(nextServiceDate);
        }

        // If active repair, maybe set vehicle status?
        // Leaving purely informational for now unless explicitly requested.

        if (Object.keys(updateData).length > 0) {
            await prisma.vehicle.update({
                where: { id: vehicleId },
                data: updateData
            });
        }

        res.status(201).json({ data: log });
    } catch (err) {
        next(err);
    }
}

export async function getMaintenanceLogs(req: Request, res: Response, next: NextFunction) {
    try {
        const { vehicleId } = req.params;

        const logs = await prisma.maintenanceLog.findMany({
            where: { vehicleId },
            orderBy: { date: 'desc' }
        });

        res.json({ data: logs });
    } catch (err) {
        next(err);
    }
}
