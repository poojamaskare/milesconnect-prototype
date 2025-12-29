import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import prisma from "../prisma/client";

type HttpError = Error & { statusCode?: number; code?: string };

function httpError(statusCode: number, message: string, code?: string): HttpError {
  const err = new Error(message) as HttpError;
  err.statusCode = statusCode;
  if (code) err.code = code;
  return err;
}

const completeTripSchema = z.object({
  shipmentId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  endOdometerKm: z.number().int().nonnegative().optional(),
});

/**
 * Complete a trip - updates all related entities atomically:
 * 1. Marks shipment as DELIVERED
 * 2. Sets vehicle status to INACTIVE (idle)
 * 3. Updates/creates trip sheet with end time
 * 4. Driver becomes available (no active shipments)
 */
export async function completeTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = completeTripSchema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, "Invalid request body", "VALIDATION_ERROR");
    }

    const { shipmentId, vehicleId, driverId, endOdometerKm } = parsed.data;

    // Verify entities exist
    const [shipment, vehicle, driver] = await Promise.all([
      prisma.shipment.findUnique({ where: { id: shipmentId } }),
      prisma.vehicle.findUnique({ where: { id: vehicleId } }),
      prisma.driver.findUnique({ where: { id: driverId } }),
    ]);

    if (!shipment) throw httpError(404, "Shipment not found", "SHIPMENT_NOT_FOUND");
    if (!vehicle) throw httpError(404, "Vehicle not found", "VEHICLE_NOT_FOUND");
    if (!driver) throw httpError(404, "Driver not found", "DRIVER_NOT_FOUND");

    if (shipment.status === "DELIVERED") {
      throw httpError(409, "Shipment already delivered", "ALREADY_DELIVERED");
    }

    // Find existing trip sheet for this shipment, or get the driver's current trip sheet
    let tripSheet = await prisma.tripSheet.findFirst({
      where: {
        driverId,
        vehicleId,
        status: { in: ["DRAFT", "SUBMITTED"] },
      },
      include: {
        shipments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    // Use a transaction to update everything atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update shipment to DELIVERED
      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: "DELIVERED",
          actualDropAt: now,
        },
      });

      // 2. Update vehicle to INACTIVE (idle)
      const updatedVehicle = await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: "INACTIVE",
        },
      });

      // 3. Update or create trip sheet
      let updatedTripSheet;
      if (tripSheet) {
        // Update existing trip sheet
        updatedTripSheet = await tx.tripSheet.update({
          where: { id: tripSheet.id },
          data: {
            endedAt: now,
            endOdometerKm: endOdometerKm ?? null,
            status: "SUBMITTED", // Auto-submit on completion
          },
        });

        // Link shipment to trip sheet if not already linked
        const existingLink = await tx.tripSheetShipment.findFirst({
          where: {
            tripSheetId: tripSheet.id,
            shipmentId,
          },
        });

        if (!existingLink) {
          await tx.tripSheetShipment.create({
            data: {
              tripSheetId: tripSheet.id,
              shipmentId,
              sequence: tripSheet.shipments.length + 1,
            },
          });
        }
      } else {
        // Create a new trip sheet for this completed trip
        const sheetNo = `TS-${Date.now()}`;
        
        // Get the manager user for createdById (or use the driver's userId)
        const managerUser = await tx.user.findFirst({
          where: { role: "MANAGER" },
        });

        const createdById = managerUser?.id ?? driver.userId;

        updatedTripSheet = await tx.tripSheet.create({
          data: {
            sheetNo,
            status: "SUBMITTED",
            driverId,
            vehicleId,
            createdById,
            startedAt: shipment.actualPickupAt ?? shipment.scheduledPickupAt ?? now,
            endedAt: now,
            endOdometerKm: endOdometerKm ?? null,
            shipments: {
              create: {
                shipmentId,
                sequence: 1,
              },
            },
          },
        });
      }

      return {
        shipment: updatedShipment,
        vehicle: updatedVehicle,
        tripSheet: updatedTripSheet,
      };
    });

    res.status(200).json({
      success: true,
      message: "Trip completed successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get fleet status - returns all active vehicles with their current positions/status
 */
export async function getFleetStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: { in: ["ACTIVE", "INACTIVE"] },
      },
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
          include: {
            driver: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Transform to include active shipment info
    const fleetData = vehicles.map((vehicle) => {
      const activeShipment = vehicle.shipments[0] ?? null;
      return {
        id: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        make: vehicle.make,
        model: vehicle.model,
        status: vehicle.status,
        driver: vehicle.primaryDriver
          ? {
              id: vehicle.primaryDriver.id,
              name: vehicle.primaryDriver.user.name,
            }
          : null,
        activeShipment: activeShipment
          ? {
              id: activeShipment.id,
              referenceNumber: activeShipment.referenceNumber,
              origin: activeShipment.originAddress,
              destination: activeShipment.destinationAddress,
              status: activeShipment.status,
              scheduledPickupAt: activeShipment.scheduledPickupAt,
              scheduledDropAt: activeShipment.scheduledDropAt,
              actualPickupAt: activeShipment.actualPickupAt,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      data: fleetData,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Start a trip - marks shipment as IN_TRANSIT and vehicle as ACTIVE
 */
export async function startTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      shipmentId: z.string().uuid(),
      vehicleId: z.string().uuid(),
      driverId: z.string().uuid(),
      startOdometerKm: z.number().int().nonnegative().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      throw httpError(400, "Invalid request body", "VALIDATION_ERROR");
    }

    const { shipmentId, vehicleId, driverId, startOdometerKm } = parsed.data;

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Update shipment to IN_TRANSIT
      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          status: "IN_TRANSIT",
          actualPickupAt: now,
          vehicleId,
          driverId,
        },
      });

      // Update vehicle to ACTIVE
      const updatedVehicle = await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: "ACTIVE",
        },
      });

      // Create trip sheet
      const sheetNo = `TS-${Date.now()}`;
      const managerUser = await tx.user.findFirst({
        where: { role: "MANAGER" },
      });

      const driver = await tx.driver.findUnique({ where: { id: driverId } });
      const createdById = managerUser?.id ?? driver?.userId;

      if (!createdById) {
        throw httpError(400, "Could not determine trip sheet creator", "NO_CREATOR");
      }

      const tripSheet = await tx.tripSheet.create({
        data: {
          sheetNo,
          status: "DRAFT",
          driverId,
          vehicleId,
          createdById,
          startedAt: now,
          startOdometerKm: startOdometerKm ?? null,
          shipments: {
            create: {
              shipmentId,
              sequence: 1,
            },
          },
        },
      });

      return {
        shipment: updatedShipment,
        vehicle: updatedVehicle,
        tripSheet,
      };
    });

    res.status(200).json({
      success: true,
      message: "Trip started successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
