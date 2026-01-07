import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { httpError } from '../middleware/error.middleware';

export async function getExpiringDocuments(req: Request, res: Response, next: NextFunction) {
    try {
        const today = new Date();
        const warningThreshold = new Date();
        warningThreshold.setDate(today.getDate() + 30); // 30 days lookahead

        const documents = await prisma.document.findMany({
            where: {
                expiryDate: {
                    lte: warningThreshold,
                    gte: today // Only future expirations or already expired
                }
            },
            include: {
                vehicle: { select: { registrationNumber: true, id: true } },
                driver: { select: { user: { select: { name: true } }, id: true } }
            },
            orderBy: { expiryDate: 'asc' }
        });

        const alerts = documents.map(doc => {
            let linkedEntity = "Unknown";
            let entityId = "";
            if (doc.vehicle) {
                linkedEntity = `Vehicle: ${doc.vehicle.registrationNumber}`;
                entityId = doc.vehicle.id;
            } else if (doc.driver) {
                linkedEntity = `Driver: ${doc.driver.user?.name}`;
                entityId = doc.driver.id;
            }

            return {
                id: doc.id,
                type: doc.type,
                fileName: doc.fileName,
                expiryDate: doc.expiryDate,
                linkedEntity,
                entityId,
                daysUntilExpiry: Math.ceil((new Date(doc.expiryDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            };
        });

        res.json({ data: alerts });
    } catch (err) {
        next(err);
    }
}
