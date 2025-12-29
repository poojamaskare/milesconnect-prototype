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

const tripSheetStatusSchema = z.enum(["DRAFT", "SUBMITTED", "APPROVED", "CANCELLED"]);

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
    DRAFT: ["SUBMITTED", "CANCELLED"],
    SUBMITTED: ["APPROVED", "CANCELLED"],
    APPROVED: [],
    CANCELLED: [],
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

export async function createTripSheet(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createTripSheetSchema.safeParse(req.body);
    if (!parsed.success) throw httpError(400, "Invalid request body", "VALIDATION_ERROR");

    const body = parsed.data;

    const tripSheet = await prisma.tripSheet.create({
      data: {
        sheetNo: body.sheetNo,
        status: "DRAFT",
        driverId: body.driverId,
        vehicleId: body.vehicleId,
        createdById: body.createdById,
        startOdometerKm: body.startOdometerKm,
        startedAt: body.startedAt,
        startLocation: body.startLocation,
        endLocation: body.endLocation,
        routeDescription: body.routeDescription,
        fuelAtStart: body.fuelAtStart,
        fuelAtEnd: body.fuelAtEnd,
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

    res.status(201).json({ data: tripSheet });
  } catch (err: unknown) {
    if (typeof err === "object" && err && "code" in err) {
      const anyErr = err as { code?: string };
      if (anyErr.code === "P2002") {
        next(httpError(409, "Trip sheet sheetNo already exists", "DUPLICATE_SHEETNO"));
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

    const existing = await prisma.tripSheet.findUnique({ where: { id }, select: { status: true } });
    if (!existing) throw httpError(404, "Trip sheet not found", "TRIPSHEET_NOT_FOUND");

    if (existing.status !== "DRAFT") {
      throw httpError(409, "Only DRAFT trip sheets can be edited", "TRIPSHEET_NOT_EDITABLE");
    }

    // Calculate total expenses if any expense fields are provided
    let totalExpenseCents: number | undefined;
    if (
      body.fuelExpenseCents !== undefined ||
      body.tollExpenseCents !== undefined ||
      body.otherExpenseCents !== undefined
    ) {
      totalExpenseCents =
        (body.fuelExpenseCents ?? 0) +
        (body.tollExpenseCents ?? 0) +
        (body.otherExpenseCents ?? 0);
    }

    const updated = await prisma.tripSheet.update({
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
