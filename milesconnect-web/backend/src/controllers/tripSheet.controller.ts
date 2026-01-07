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

const tripSheetStatusSchema = z.enum(["DRAFT", "SUBMITTED", "APPROVED", "CANCELLED", "SETTLED"]);

type TripSheetStatusValue = z.infer<typeof tripSheetStatusSchema>;

const createTripSheetSchema = z
  .object({
    sheetNo: z.string().min(1),
    driverId: z.string().uuid(),
    vehicleId: z.string().uuid(),
    createdById: z.string().uuid(),

    startOdometerKm: z.number().int().nonnegative().optional(),
    startedAt: z.coerce.date().optional(),

    // Route information
    startLocation: z.string().optional(),
    endLocation: z.string().optional(),
    routeDescription: z.string().optional(),

    // Fuel tracking
    fuelAtStart: z.number().nonnegative().optional(),
    fuelAtEnd: z.number().nonnegative().optional(),

    // Advanced Trip Costing (Initial/Estimates)
    driverAdvanceCents: z.number().int().nonnegative().optional(),
    driverAllowanceCents: z.number().int().nonnegative().optional(),
    loadingUnloadingCents: z.number().int().nonnegative().optional(),
    policeExpenseCents: z.number().int().nonnegative().optional(),
    adBlueExpenseCents: z.number().int().nonnegative().optional(),

    // Notes
    notes: z.string().optional(),

    // Optional initial shipment linking
    shipmentIds: z.array(z.string().uuid()).optional(),
  })
  .strict();

const updateTripSheetSchema = z
  .object({
    sheetNo: z.string().min(1).optional(),
    driverId: z.string().uuid().optional(),
    vehicleId: z.string().uuid().optional(),

    startOdometerKm: z.number().int().nonnegative().optional().nullable(),
    endOdometerKm: z.number().int().nonnegative().optional().nullable(),
    startedAt: z.coerce.date().optional().nullable(),
    endedAt: z.coerce.date().optional().nullable(),

    // Route information
    startLocation: z.string().optional().nullable(),
    endLocation: z.string().optional().nullable(),
    routeDescription: z.string().optional().nullable(),

    // Fuel tracking
    fuelAtStart: z.number().nonnegative().optional().nullable(),
    fuelAtEnd: z.number().nonnegative().optional().nullable(),

    // Expense tracking (in cents)
    fuelExpenseCents: z.number().int().nonnegative().optional(),
    tollExpenseCents: z.number().int().nonnegative().optional(),
    otherExpenseCents: z.number().int().nonnegative().optional(),

    // Advanced Trip Costing (Updates)
    driverAdvanceCents: z.number().int().nonnegative().optional(),
    driverAllowanceCents: z.number().int().nonnegative().optional(),
    loadingUnloadingCents: z.number().int().nonnegative().optional(),
    policeExpenseCents: z.number().int().nonnegative().optional(),
    adBlueExpenseCents: z.number().int().nonnegative().optional(),

    // Notes
    notes: z.string().optional().nullable(),

    shipmentIds: z.array(z.string().uuid()).optional(),
  })
  .strict();

const updateStatusSchema = z
  .object({
    status: tripSheetStatusSchema,
  })
  .strict();

function assertTransition(current: TripSheetStatusValue, next: TripSheetStatusValue) {
  if (current === next) return;

  const allowed: Record<TripSheetStatusValue, TripSheetStatusValue[]> = {
    DRAFT: ["SUBMITTED", "CANCELLED", "SETTLED"], // For testing/short circuit
    SUBMITTED: ["APPROVED", "CANCELLED", "SETTLED"],
    APPROVED: ["SETTLED"],
    CANCELLED: [],
    SETTLED: [], // Final state
  };

  if (!allowed[current].includes(next)) {
    throw httpError(409, `Invalid status transition: ${current} → ${next}`, "INVALID_STATUS_TRANSITION");
  }
}

export async function listTripSheets(_req: Request, res: Response, next: NextFunction) {
  try {
    const tripSheets = await prisma.tripSheet.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        driver: { include: { user: { select: { id: true, name: true, email: true } } } },
        vehicle: true,
        createdBy: { select: { id: true, name: true, email: true } },
        shipments: {
          include: {
            shipment: true,
          },
          orderBy: [{ sequence: "asc" }],
        },
        fuelStops: { orderBy: { fueledAt: "asc" } },
        expenses: { orderBy: { expenseAt: "asc" } },
        documents: true,
      },
    });

    res.status(200).json({ data: tripSheets });
  } catch (err) {
    next(err);
  }
}

export async function getTripSheet(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const tripSheet = await prisma.tripSheet.findUnique({
      where: { id },
      include: {
        driver: { include: { user: { select: { id: true, name: true, email: true } } } },
        vehicle: true,
        createdBy: { select: { id: true, name: true, email: true } },
        shipments: {
          include: {
            shipment: true,
          },
          orderBy: [{ sequence: "asc" }],
        },
        fuelStops: { orderBy: { fueledAt: "asc" } },
        expenses: { orderBy: { expenseAt: "asc" } },
        documents: true,
      },
    });

    if (!tripSheet) throw httpError(404, "Trip sheet not found", "TRIPSHEET_NOT_FOUND");

    res.status(200).json({ data: tripSheet });
  } catch (err) {
    next(err);
  }
}

export async function createTripSheet(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = createTripSheetSchema.parse(req.body);

    // Ensure we have a valid createdById
    let createdById = body.createdById;

    // If placeholder UUID is sent, find a real user
    if (createdById === "00000000-0000-0000-0000-000000000001") {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        createdById = firstUser.id;
      } else {
        throw httpError(400, "No users exist in system to create trip sheet", "NO_USERS");
      }
    }

    // Use transaction to ensure atomicity
    const tripSheet = await prisma.$transaction(async (tx) => {
      // 1. Validate shipments if provided
      if (body.shipmentIds && body.shipmentIds.length > 0) {
        // Fetch shipments to validate
        const shipments = await tx.shipment.findMany({
          where: { id: { in: body.shipmentIds } },
          include: { tripLinks: true },
        });

        // Check all shipments exist
        if (shipments.length !== body.shipmentIds.length) {
          throw httpError(400, "One or more shipments not found", "SHIPMENTS_NOT_FOUND");
        }

        // Check all shipments are DRAFT status
        const nonDraftShipments = shipments.filter((s: typeof shipments[0]) => s.status !== "DRAFT");
        if (nonDraftShipments.length > 0) {
          throw httpError(
            400,
            `Shipments must be in DRAFT status. Found: ${nonDraftShipments.map((s: typeof shipments[0]) => s.referenceNumber).join(", ")}`,
            "INVALID_SHIPMENT_STATUS"
          );
        }

        // Check no shipments are already linked to another trip sheet
        const linkedShipments = shipments.filter((s: typeof shipments[0]) => s.tripLinks.length > 0);
        if (linkedShipments.length > 0) {
          throw httpError(
            409,
            `Shipments already linked to trip sheets: ${linkedShipments.map((s: typeof shipments[0]) => s.referenceNumber).join(", ")}`,
            "SHIPMENTS_ALREADY_LINKED"
          );
        }

        // Auto-derive route if not provided
        if (!body.startLocation && shipments.length > 0) {
          body.startLocation = shipments[0].originAddress;
        }
        if (!body.endLocation && shipments.length > 0) {
          body.endLocation = shipments[shipments.length - 1].destinationAddress;
        }
      }

      // 2. Create the trip sheet
      const newTripSheet = await tx.tripSheet.create({
        data: {
          sheetNo: body.sheetNo,
          status: "DRAFT", // Always DRAFT on creation
          driverId: body.driverId,
          vehicleId: body.vehicleId,
          createdById: createdById,
          startOdometerKm: body.startOdometerKm,
          // endOdometerKm is not part of create schema
          startedAt: body.startedAt,
          // endedAt is not part of create schema
          startLocation: body.startLocation,
          endLocation: body.endLocation,
          routeDescription: body.routeDescription,
          fuelAtStart: body.fuelAtStart,
          fuelAtEnd: body.fuelAtEnd,

          // Advanced costs
          driverAdvanceCents: body.driverAdvanceCents,
          driverAllowanceCents: body.driverAllowanceCents,
          loadingUnloadingCents: body.loadingUnloadingCents,
          policeExpenseCents: body.policeExpenseCents,
          adBlueExpenseCents: body.adBlueExpenseCents,

          notes: body.notes,
          shipments: body.shipmentIds
            ? {
              create: body.shipmentIds.map((shipmentId, idx) => ({
                shipmentId,
                sequence: idx + 1,
              })),
            }
            : undefined,
        },
        include: {
          driver: { include: { user: { select: { id: true, name: true, email: true } } } },
          vehicle: true,
          createdBy: { select: { id: true, name: true, email: true } },
          shipments: { include: { shipment: true }, orderBy: [{ sequence: "asc" }] },
          fuelStops: { orderBy: { fueledAt: "asc" } },
          expenses: { orderBy: { expenseAt: "asc" } },
        },
      });

      // 3. Update linked shipments status and assignments
      if (body.shipmentIds && body.shipmentIds.length > 0) {
        await tx.shipment.updateMany({
          where: { id: { in: body.shipmentIds } },
          data: {
            status: "PLANNED",
            driverId: body.driverId,
            vehicleId: body.vehicleId,
          },
        });
      }

      return newTripSheet;
    });

    res.status(201).json({ data: tripSheet });
  } catch (err: unknown) {
    if (typeof err === "object" && err && "code" in err) {
      const anyErr = err as { code?: string };
      if (anyErr.code === "P2002") {
        next(httpError(409, "Trip sheet sheetNo already exists", "DUPLICATE_SHEETNO"));
        return;
      }
      if (anyErr.code === "P2003") {
        next(httpError(400, "Invalid driver, vehicle, or shipment reference", "INVALID_REFERENCE"));
        return;
      }
    }

    next(err);
  }
}

export async function updateTripSheet(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const parsed = updateTripSheetSchema.safeParse(req.body);
    if (!parsed.success) throw httpError(400, "Invalid request body", "VALIDATION_ERROR");

    const body = parsed.data;

    // Use transaction for atomicity
    const updated = await prisma.$transaction(async (tx) => {
      // Check existing trip sheet
      const existing = await tx.tripSheet.findUnique({
        where: { id },
        select: {
          status: true,
          driverId: true,
          vehicleId: true,
          shipments: { select: { shipmentId: true } }
        }
      });

      if (!existing) throw httpError(404, "Trip sheet not found", "TRIPSHEET_NOT_FOUND");

      if (existing.status !== "DRAFT") {
        throw httpError(409, "Only DRAFT trip sheets can be edited", "TRIPSHEET_NOT_EDITABLE");
      }

      // Validate new shipments if provided
      if (body.shipmentIds && body.shipmentIds.length > 0) {
        const shipments = await tx.shipment.findMany({
          where: { id: { in: body.shipmentIds } },
          include: { tripLinks: true },
        });

        if (shipments.length !== body.shipmentIds.length) {
          throw httpError(400, "One or more shipments not found", "SHIPMENTS_NOT_FOUND");
        }

        const nonDraftShipments = shipments.filter((s: typeof shipments[0]) => s.status !== "DRAFT");
        if (nonDraftShipments.length > 0) {
          throw httpError(
            400,
            `Shipments must be in DRAFT status. Found: ${nonDraftShipments.map(s => s.referenceNumber).join(", ")}`,
            "INVALID_SHIPMENT_STATUS"
          );
        }

        // Check if any shipments are linked to OTHER trip sheets
        const linkedToOthers = shipments.filter(s =>
          s.tripLinks.some((link: typeof s.tripLinks[0]) => link.tripSheetId !== id)
        );
        if (linkedToOthers.length > 0) {
          throw httpError(
            409,
            `Shipments already linked to other trip sheets: ${linkedToOthers.map(s => s.referenceNumber).join(", ")}`,
            "SHIPMENTS_ALREADY_LINKED"
          );
        }

        // Auto-derive route if not provided
        if (!body.startLocation && shipments.length > 0) {
          body.startLocation = shipments[0].originAddress;
        }
        if (!body.endLocation && shipments.length > 0) {
          body.endLocation = shipments[shipments.length - 1].destinationAddress;
        }
      }

      // Calculate total expenses if any expense fields are provided
      let totalExpenseCents: number | undefined;
      // We only recalculate if explicit expense fields are updated, OR we can just sum them up if we fetch current values.
      // For simplicity/MVV, let's assume if any is provided we sum the provided ones + defaults (0) or we need current values?
      // Better: let's fetch current if not provided? Or just sum the provided ones?
      // Actually, standard practice for PATCH is replace provided. But calculating total requires all components.

      // Let's use the provided values or fallback to existing values if not provided?
      // Since this is a PATCH, 'undefined' means no change.
      // But we can't easily calculate total without knowing current values for un-updated fields.
      // So let's fetch existing values for all expense fields first.

      const currentExpenses = await tx.tripSheet.findUnique({
        where: { id },
        select: {
          fuelExpenseCents: true,
          tollExpenseCents: true,
          otherExpenseCents: true,
          driverAllowanceCents: true,
          loadingUnloadingCents: true,
          policeExpenseCents: true,
          adBlueExpenseCents: true
          // we don't count advance in total expense usually, it's cash flow. 
          // Total Expense = Fuel + Toll + Other + Allowance + Loading + Police + AdBlue
        }
      });

      if (currentExpenses) {
        const fuel = body.fuelExpenseCents !== undefined ? body.fuelExpenseCents : Number(currentExpenses.fuelExpenseCents);
        const toll = body.tollExpenseCents !== undefined ? body.tollExpenseCents : Number(currentExpenses.tollExpenseCents);
        const other = body.otherExpenseCents !== undefined ? body.otherExpenseCents : Number(currentExpenses.otherExpenseCents);

        const allowance = body.driverAllowanceCents !== undefined ? body.driverAllowanceCents : Number(currentExpenses.driverAllowanceCents);
        const loading = body.loadingUnloadingCents !== undefined ? body.loadingUnloadingCents : Number(currentExpenses.loadingUnloadingCents);
        const police = body.policeExpenseCents !== undefined ? body.policeExpenseCents : Number(currentExpenses.policeExpenseCents);
        const adBlue = body.adBlueExpenseCents !== undefined ? body.adBlueExpenseCents : Number(currentExpenses.adBlueExpenseCents);

        totalExpenseCents = fuel + toll + other + allowance + loading + police + adBlue;
      }

      // Get old shipment IDs to reset their status later
      const oldShipmentIds = existing.shipments.map(s => s.shipmentId);

      const updatedTripSheet = await tx.tripSheet.update({
        where: { id },
        data: {
          sheetNo: body.sheetNo,
          driverId: body.driverId,
          vehicleId: body.vehicleId,
          startOdometerKm: body.startOdometerKm === undefined ? undefined : body.startOdometerKm,
          endOdometerKm: body.endOdometerKm === undefined ? undefined : body.endOdometerKm,
          startedAt: body.startedAt === undefined ? undefined : body.startedAt,
          endedAt: body.endedAt === undefined ? undefined : body.endedAt,
          startLocation: body.startLocation === undefined ? undefined : body.startLocation,
          endLocation: body.endLocation === undefined ? undefined : body.endLocation,
          routeDescription: body.routeDescription === undefined ? undefined : body.routeDescription,
          fuelAtStart: body.fuelAtStart === undefined ? undefined : body.fuelAtStart,
          fuelAtEnd: body.fuelAtEnd === undefined ? undefined : body.fuelAtEnd,
          fuelExpenseCents: body.fuelExpenseCents,
          tollExpenseCents: body.tollExpenseCents,
          otherExpenseCents: body.otherExpenseCents,

          driverAdvanceCents: body.driverAdvanceCents,
          driverAllowanceCents: body.driverAllowanceCents,
          loadingUnloadingCents: body.loadingUnloadingCents,
          policeExpenseCents: body.policeExpenseCents,
          adBlueExpenseCents: body.adBlueExpenseCents,

          totalExpenseCents: totalExpenseCents,
          notes: body.notes === undefined ? undefined : body.notes,
          shipments: body.shipmentIds
            ? {
              deleteMany: {},
              create: body.shipmentIds.map((shipmentId, idx) => ({
                shipmentId,
                sequence: idx + 1,
              })),
            }
            : undefined,
        },
        include: {
          driver: { include: { user: { select: { id: true, name: true, email: true } } } },
          vehicle: true,
          createdBy: { select: { id: true, name: true, email: true } },
          shipments: { include: { shipment: true }, orderBy: [{ sequence: "asc" }] },
          fuelStops: { orderBy: { fueledAt: "asc" } },
          expenses: { orderBy: { expenseAt: "asc" } },
          documents: true,
        },
      });

      // Reset old shipments that were removed (if shipmentIds was provided)
      if (body.shipmentIds) {
        const removedShipmentIds = oldShipmentIds.filter((id: string) => !body.shipmentIds!.includes(id));
        if (removedShipmentIds.length > 0) {
          await tx.shipment.updateMany({
            where: { id: { in: removedShipmentIds } },
            data: {
              status: "DRAFT",
              driverId: null,
              vehicleId: null,
            },
          });
        }

        // Update new/kept shipments
        if (body.shipmentIds.length > 0) {
          await tx.shipment.updateMany({
            where: { id: { in: body.shipmentIds } },
            data: {
              status: "PLANNED",
              driverId: updatedTripSheet.driverId,
              vehicleId: updatedTripSheet.vehicleId,
            },
          });
        }
      }

      return updatedTripSheet;
    });

    res.status(200).json({ data: updated });
  } catch (err: unknown) {
    if (typeof err === "object" && err && "code" in err) {
      const anyErr = err as { code?: string };
      if (anyErr.code === "P2025") {
        next(httpError(404, "Trip sheet not found", "TRIPSHEET_NOT_FOUND"));
        return;
      }
      if (anyErr.code === "P2002") {
        next(httpError(409, "Trip sheet sheetNo already exists", "DUPLICATE_SHEETNO"));
        return;
      }
    }

    next(err);
  }
}

export async function updateTripSheetStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) throw httpError(400, "Invalid request body", "VALIDATION_ERROR");

    const nextStatus = parsed.data.status;

    const existing = await prisma.tripSheet.findUnique({ where: { id }, select: { status: true } });
    if (!existing) throw httpError(404, "Trip sheet not found", "TRIPSHEET_NOT_FOUND");

    assertTransition(existing.status as TripSheetStatusValue, nextStatus);

    const updated = await prisma.tripSheet.update({
      where: { id },
      data: { status: nextStatus },
    });

    res.status(200).json({ data: updated });
  } catch (err: unknown) {
    if (typeof err === "object" && err && "code" in err) {
      const anyErr = err as { code?: string };
      if (anyErr.code === "P2025") {
        next(httpError(404, "Trip sheet not found", "TRIPSHEET_NOT_FOUND"));
        return;
      }
    }

    next(err);
  }
}

// Add fuel stop to a trip sheet
const addFuelStopSchema = z
  .object({
    location: z.string().min(1),
    odometerKm: z.number().int().nonnegative().optional(),
    fuelLiters: z.number().positive(),
    pricePerLiter: z.number().nonnegative().optional(),
    totalCostCents: z.number().int().nonnegative(),
    receiptNumber: z.string().optional(),
    notes: z.string().optional(),
    fueledAt: z.coerce.date().optional(),
  })
  .strict();

export async function addFuelStop(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parsed = addFuelStopSchema.safeParse(req.body);
    if (!parsed.success) throw httpError(400, "Invalid request body", "VALIDATION_ERROR");

    const body = parsed.data;

    // Check if trip sheet exists and is editable
    const tripSheet = await prisma.tripSheet.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!tripSheet) throw httpError(404, "Trip sheet not found", "TRIPSHEET_NOT_FOUND");
    if (tripSheet.status !== "DRAFT") {
      throw httpError(409, "Only DRAFT trip sheets can be edited", "TRIPSHEET_NOT_EDITABLE");
    }

    const fuelStop = await prisma.fuelStop.create({
      data: {
        tripSheetId: id,
        location: body.location,
        odometerKm: body.odometerKm,
        fuelLiters: body.fuelLiters,
        pricePerLiter: body.pricePerLiter,
        totalCostCents: body.totalCostCents,
        receiptNumber: body.receiptNumber,
        notes: body.notes,
        fueledAt: body.fueledAt ?? new Date(),
      },
    });

    res.status(201).json({ data: fuelStop });
  } catch (err) {
    next(err);
  }
}

// Add expense to a trip sheet
const addExpenseSchema = z
  .object({
    category: z.string().min(1),
    description: z.string().optional(),
    amountCents: z.number().int().nonnegative(),
    receiptNumber: z.string().optional(),
    notes: z.string().optional(),
    expenseAt: z.coerce.date().optional(),
  })
  .strict();

export async function addExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parsed = addExpenseSchema.safeParse(req.body);
    if (!parsed.success) throw httpError(400, "Invalid request body", "VALIDATION_ERROR");

    const body = parsed.data;

    // Check if trip sheet exists and is editable
    const tripSheet = await prisma.tripSheet.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!tripSheet) throw httpError(404, "Trip sheet not found", "TRIPSHEET_NOT_FOUND");
    if (tripSheet.status !== "DRAFT") {
      throw httpError(409, "Only DRAFT trip sheets can be edited", "TRIPSHEET_NOT_EDITABLE");
    }

    const expense = await prisma.tripExpense.create({
      data: {
        tripSheetId: id,
        category: body.category,
        description: body.description,
        amountCents: body.amountCents,
        receiptNumber: body.receiptNumber,
        notes: body.notes,
        expenseAt: body.expenseAt ?? new Date(),
      },
    });

    res.status(201).json({ data: expense });
  } catch (err) {
    next(err);
  }
}

// Create trip sheets for shipments that don't have one
export async function createTripSheetsFromShipments(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { createdById } = req.body;
    if (!createdById) throw httpError(400, "createdById is required", "VALIDATION_ERROR");

    // Find all shipments that are PLANNED or IN_TRANSIT and don't have a trip sheet yet
    const shipments = await prisma.shipment.findMany({
      where: {
        status: {
          in: ["PLANNED", "IN_TRANSIT"],
        },
        tripLinks: {
          none: {},
        },
        driverId: { not: null },
        vehicleId: { not: null },
      },
      include: {
        driver: true,
        vehicle: true,
      },
    });

    if (shipments.length === 0) {
      return res.status(200).json({
        message: "No shipments found that need trip sheets",
        data: [],
      });
    }

    // Group shipments by driver and vehicle
    const grouped = new Map<string, typeof shipments>();
    for (const shipment of shipments) {
      const key = `${shipment.driverId}-${shipment.vehicleId}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(shipment);
    }

    // Create trip sheets for each group
    const createdSheets = [];
    for (const [key, groupShipments] of grouped) {
      const firstShipment = groupShipments[0];
      const sheetNo = `TS-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Calculate total revenue from shipments
      const totalRevenue = groupShipments.reduce((sum, s) => sum + (s.priceCents || BigInt(0)), BigInt(0));

      const tripSheet = await prisma.tripSheet.create({
        data: {
          sheetNo,
          status: "DRAFT",
          driverId: firstShipment.driverId!,
          vehicleId: firstShipment.vehicleId!,
          createdById,
          startedAt: firstShipment.scheduledPickupAt ?? new Date(),
          startLocation: firstShipment.originAddress,
          endLocation: groupShipments[groupShipments.length - 1].destinationAddress,
          shipments: {
            create: groupShipments.map((shipment, idx) => ({
              shipmentId: shipment.id,
              sequence: idx + 1,
            })),
          },
          totalRevenueCents: totalRevenue,
          // Profit will be calculated at settlement
        },
        include: {
          driver: { include: { user: { select: { id: true, name: true, email: true } } } },
          vehicle: true,
          createdBy: { select: { id: true, name: true, email: true } },
          shipments: { include: { shipment: true }, orderBy: [{ sequence: "asc" }] },
        },
      });

      createdSheets.push(tripSheet);
    }

    res.status(201).json({
      message: `Created ${createdSheets.length} trip sheet(s) from ${shipments.length} shipment(s)`,
      data: createdSheets,
    });
  } catch (err) {
    next(err);
  }
}

export async function settleTripSheet(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Fetch with shipments to get real-time revenue data
    const tripSheet = await prisma.tripSheet.findUnique({
      where: { id },
      include: {
        shipments: { include: { shipment: true } }
      }
    });

    if (!tripSheet) return next(httpError(404, "Trip sheet not found"));

    if (tripSheet.status === "SETTLED") {
      return next(httpError(400, "Trip sheet is already settled"));
    }

    // You might want to enforce that it is completed/approved first?
    // For prototype, allowing settlement from approved/completed.

    // Calculate final cash balance using BigInt arithmetic
    // Advance - TotalExpenses
    const advance = tripSheet.driverAdvanceCents;
    const expenses = tripSheet.totalExpenseCents;
    const balance = advance - expenses;

    // Calculate Financials (Revenue & Profit)
    // Revenue = Sum of all linked shipment prices
    const revenue = tripSheet.shipments.reduce((sum, link) => sum + (link.shipment.priceCents || BigInt(0)), BigInt(0));

    // Net Profit = Revenue - Expenses (Advance is irrelevant for profit, it's just cashflow)
    const profit = revenue - expenses;

    const updated = await prisma.tripSheet.update({
      where: { id },
      data: {
        status: "SETTLED",
        settledAt: new Date(),
        cashBalanceCents: balance,
        totalRevenueCents: revenue,
        netProfitCents: profit
      },
      include: {
        driver: { include: { user: { select: { id: true, name: true, email: true } } } },
        vehicle: true,
      }
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}
