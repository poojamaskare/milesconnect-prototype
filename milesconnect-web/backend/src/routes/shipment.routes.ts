import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";

import prisma from "../prisma/client";

const router = express.Router();

const shipmentStatusSchema = z.enum([
  "DRAFT",
  "PLANNED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
]);

type HttpError = Error & { statusCode?: number; code?: string };

function httpError(statusCode: number, message: string, code?: string): HttpError {
  const err = new Error(message) as HttpError;
  err.statusCode = statusCode;
  if (code) err.code = code;
  return err;
}

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw httpError(400, "Invalid request body", "VALIDATION_ERROR");
  }
  return result.data;
}

// GET /
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const shipments = await prisma.shipment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        driver: true,
        vehicle: true,
        invoice: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({ data: shipments });
  } catch (err) {
    next(err);
  }
});

// GET /:id
router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const shipment = await prisma.shipment.findUnique({
        where: { id },
        include: {
          driver: true,
          vehicle: true,
          invoice: {
            include: { payments: true },
          },
          documents: true,
        },
      });

      if (!shipment) {
        throw httpError(404, "Shipment not found", "SHIPMENT_NOT_FOUND");
      }

      res.status(200).json({ data: shipment });
    } catch (err) {
      next(err);
    }
  }
);

// POST /
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = parseOrThrow(
      z
        .object({
          referenceNumber: z.string().min(1),
          originAddress: z.string().min(1),
          destinationAddress: z.string().min(1),

          scheduledPickupAt: z.coerce.date().optional(),
          scheduledDropAt: z.coerce.date().optional(),

          weightKg: z.number().int().positive().optional(),

          // Required by schema (until auth is added)
          createdById: z.string().uuid(),

          driverId: z.string().uuid().optional(),
          vehicleId: z.string().uuid().optional(),

          status: shipmentStatusSchema.optional(),
        })
        .strict(),
      req.body
    );

    const shipment = await prisma.shipment.create({
      data: {
        referenceNumber: body.referenceNumber,
        originAddress: body.originAddress,
        destinationAddress: body.destinationAddress,
        scheduledPickupAt: body.scheduledPickupAt,
        scheduledDropAt: body.scheduledDropAt,
        weightKg: body.weightKg,
        status: body.status,
        createdById: body.createdById,
        driverId: body.driverId,
        vehicleId: body.vehicleId,
      },
    });

    res.status(201).json({ data: shipment });
  } catch (err: unknown) {
    // Prisma unique constraint error handling (referenceNumber)
    if (typeof err === "object" && err && "code" in err) {
      const anyErr = err as { code?: string };
      if (anyErr.code === "P2002") {
        next(httpError(409, "Shipment referenceNumber already exists", "DUPLICATE_REFERENCE"));
        return;
      }
    }

    next(err);
  }
});

// PATCH /:id/status
router.patch(
  "/:id/status",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const body = parseOrThrow(
        z
          .object({
            status: shipmentStatusSchema,
          })
          .strict(),
        req.body
      );

      const updated = await prisma.shipment.update({
        where: { id },
        data: { status: body.status },
      });

      res.status(200).json({ data: updated });
    } catch (err: unknown) {
      // Prisma record not found
      if (typeof err === "object" && err && "code" in err) {
        const anyErr = err as { code?: string };
        if (anyErr.code === "P2025") {
          next(httpError(404, "Shipment not found", "SHIPMENT_NOT_FOUND"));
          return;
        }
      }

      next(err);
    }
  }
);

export default router;
export { router as shipmentRouter };
