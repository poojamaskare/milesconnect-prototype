import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import prisma from "../prisma/client";
import { mlService } from "../services/ml.service";

type HttpError = Error & { statusCode?: number; code?: string };

function httpError(statusCode: number, message: string, code?: string): HttpError {
  const err = new Error(message) as HttpError;
  err.statusCode = statusCode;
  if (code) err.code = code;
  return err;
}

const vehicleStatusSchema = z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]);

const createVehicleSchema = z
  .object({
    registrationNumber: z.string().min(1),
    vin: z.string().min(1).optional(),
    make: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    capacityKg: z.number().int().positive().optional(),
    status: vehicleStatusSchema.optional(),
    primaryDriverId: z.string().uuid().optional(),
    // New fields for vehicle display and maintenance
    name: z.string().min(1).optional(),
    imageUrl: z.string().url().optional(),
    maintenanceCycleDays: z.number().int().positive().optional(),
    lastMaintenanceDate: z.coerce.date().optional(),
  })
  .strict();

const updateVehicleSchema = z
  .object({
    registrationNumber: z.string().min(1).optional(),
    vin: z.string().min(1).optional().nullable(),
    make: z.string().min(1).optional().nullable(),
    model: z.string().min(1).optional().nullable(),
    capacityKg: z.number().int().positive().optional().nullable(),
    status: vehicleStatusSchema.optional(),
    primaryDriverId: z.string().uuid().optional().nullable(),
    // New fields for vehicle display and maintenance
    name: z.string().min(1).optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    maintenanceCycleDays: z.number().int().positive().optional().nullable(),
    lastMaintenanceDate: z.coerce.date().optional().nullable(),
  })
  .strict();

export async function listVehicles(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        primaryDriver: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        shipments: {
          where: {
            status: "IN_TRANSIT",
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            referenceNumber: true,
            status: true,
            createdAt: true,
          },
        },
        tripSheets: {
          where: {
            status: "APPROVED",
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
          },
        },
      },
    });



    // Enrich with ML Predictions (concurrently for performance)
    const vehiclesWithStatus = await Promise.all(vehicles.map(async (vehicle) => {
      const activeShipment = vehicle.shipments[0];
      const activeTrip = vehicle.tripSheets[0];
      let computedStatus = 'AVAILABLE';

      if (vehicle.status === 'MAINTENANCE') {
        computedStatus = 'MAINTENANCE';
      } else if (vehicle.status === 'INACTIVE') {
        computedStatus = 'INACTIVE';
      } else if (activeShipment || activeTrip) {
        computedStatus = 'IN_USE';
      }

      // Fetch ML Prediction
      // Mock data points based on vehicle properties or random for Demo if fields missing
      let riskScore = 0;
      let nextServicePredicted = null;

      try {
        const prediction = await mlService.predictMaintenance({
          vehicle_id: vehicle.id,
          age_months: 12, // mock or calculate from createdAt
          odometer_km: 15000, // mock or from vehicle logs
          days_since_last_maintenance: vehicle.lastMaintenanceDate
            ? Math.floor((Date.now() - new Date(vehicle.lastMaintenanceDate).getTime()) / (1000 * 60 * 60 * 24))
            : 30,
          total_trips: 50,
          avg_trip_distance_km: 250,
          harsh_usage_score: 5,
          fuel_consumption_variance: 0.05,
          reported_issues_count: 0
        });

        if (prediction) {
          // Convert class probability to a 0-100 score
          // High risk = higher score
          const highRiskProb = prediction.class_probabilities['high_risk'] || 0;
          const mediumRiskProb = prediction.class_probabilities['medium_risk'] || 0;
          riskScore = Math.round((highRiskProb * 100) + (mediumRiskProb * 50));

          if (prediction.days_until_maintenance < 30) {
            const d = new Date();
            d.setDate(d.getDate() + prediction.days_until_maintenance);
            nextServicePredicted = d.toISOString();
          }
        }
      } catch (e) {
        // Silent fail for ML enrichment
        console.warn(`Failed to predict maintenance for ${vehicle.id}`);
      }

      return {
        ...vehicle,
        computedStatus,
        currentShipment: activeShipment || null,
        maintenanceHealth: {
          riskScore,
          predictedFailureDate: nextServicePredicted,
          status: riskScore > 70 ? 'CRITICAL' : riskScore > 40 ? 'WARNING' : 'GOOD'
        }
      };
    }));

    res.status(200).json({ data: vehiclesWithStatus });
  } catch (err) {
    next(err);
  }
}

export async function getVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        primaryDriver: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
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

    if (!vehicle) throw httpError(404, "Vehicle not found", "VEHICLE_NOT_FOUND");

    // Check for specific active shipment
    let activeShipment = vehicle.shipments.find(s => s.status === 'IN_TRANSIT');

    if (!activeShipment) {
      const active = await prisma.shipment.findFirst({
        where: { vehicleId: id, status: 'IN_TRANSIT' },
        select: { id: true, status: true, referenceNumber: true }
      });
      if (active) activeShipment = active as any;
    }

    let computedStatus = 'AVAILABLE';
    if (vehicle.status === 'MAINTENANCE') {
      computedStatus = 'MAINTENANCE';
    } else if (vehicle.status === 'INACTIVE') {
      computedStatus = 'INACTIVE';
    } else if (activeShipment) {
      computedStatus = 'IN_USE';
    }

    res.status(200).json({
      data: {
        ...vehicle,
        computedStatus,
        currentShipment: activeShipment || null
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createVehicleSchema.safeParse(req.body);
    if (!parsed.success) throw httpError(400, "Invalid request body", "VALIDATION_ERROR");

    const body = parsed.data;

    // Calculate next maintenance date if cycle is provided
    let nextMaintenanceDate: Date | undefined;
    if (body.maintenanceCycleDays) {
      const baseDate = body.lastMaintenanceDate ?? new Date();
      nextMaintenanceDate = new Date(baseDate);
      nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + body.maintenanceCycleDays);
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber: body.registrationNumber,
        vin: body.vin,
        make: body.make,
        model: body.model,
        capacityKg: body.capacityKg,
        status: body.status,
        primaryDriverId: body.primaryDriverId,
        name: body.name,
        imageUrl: body.imageUrl,
        maintenanceCycleDays: body.maintenanceCycleDays,
        lastMaintenanceDate: body.lastMaintenanceDate,
        nextMaintenanceDate: nextMaintenanceDate,
      },
    });

    res.status(201).json({ data: vehicle });
  } catch (err: unknown) {
    // Prisma unique constraint error
    if (typeof err === "object" && err && "code" in err) {
      const anyErr = err as { code?: string };
      if (anyErr.code === "P2002") {
        next(httpError(409, "Vehicle already exists", "DUPLICATE_VEHICLE"));
        return;
      }
    }

    next(err);
  }
}

export async function updateVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const parsed = updateVehicleSchema.safeParse(req.body);
    if (!parsed.success) throw httpError(400, "Invalid request body", "VALIDATION_ERROR");

    const body = parsed.data;

    // Fetch existing vehicle to compute next maintenance date
    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) throw httpError(404, "Vehicle not found", "VEHICLE_NOT_FOUND");

    // Calculate next maintenance date if cycle or last date is updated
    let nextMaintenanceDate: Date | null | undefined;
    const cycleDays = body.maintenanceCycleDays ?? existing.maintenanceCycleDays;
    const lastDate = body.lastMaintenanceDate !== undefined
      ? body.lastMaintenanceDate
      : existing.lastMaintenanceDate;

    if (cycleDays && lastDate) {
      nextMaintenanceDate = new Date(lastDate);
      nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + cycleDays);
    } else if (body.maintenanceCycleDays === null || body.lastMaintenanceDate === null) {
      nextMaintenanceDate = null;
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        registrationNumber: body.registrationNumber,
        vin: body.vin === undefined ? undefined : body.vin,
        make: body.make === undefined ? undefined : body.make,
        model: body.model === undefined ? undefined : body.model,
        capacityKg: body.capacityKg === undefined ? undefined : body.capacityKg,
        status: body.status,
        primaryDriverId: body.primaryDriverId === undefined ? undefined : body.primaryDriverId,
        name: body.name === undefined ? undefined : body.name,
        imageUrl: body.imageUrl === undefined ? undefined : body.imageUrl,
        maintenanceCycleDays: body.maintenanceCycleDays === undefined ? undefined : body.maintenanceCycleDays,
        lastMaintenanceDate: body.lastMaintenanceDate === undefined ? undefined : body.lastMaintenanceDate,
        nextMaintenanceDate: nextMaintenanceDate,
      },
    });

    res.status(200).json({ data: vehicle });
  } catch (err: unknown) {
    if (typeof err === "object" && err && "code" in err) {
      const anyErr = err as { code?: string };
      if (anyErr.code === "P2025") {
        next(httpError(404, "Vehicle not found", "VEHICLE_NOT_FOUND"));
        return;
      }
      if (anyErr.code === "P2002") {
        next(httpError(409, "Vehicle already exists", "DUPLICATE_VEHICLE"));
        return;
      }
    }

    next(err);
  }
}

export async function deleteVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    await prisma.vehicle.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: "Vehicle deleted successfully" });
  } catch (err: unknown) {
    if (typeof err === "object" && err && "code" in err) {
      const anyErr = err as { code?: string };
      if (anyErr.code === "P2025") {
        next(httpError(404, "Vehicle not found", "VEHICLE_NOT_FOUND"));
        return;
      }
      if (anyErr.code === "P2003") {
        next(httpError(409, "Cannot delete vehicle: It has active Shipments or Trip Sheets.", "DEPENDENCY_VIOLATION"));
        return;
      }
    }

    next(err);
  }
}
