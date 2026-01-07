/**
 * Routing Controller
 * Handles route optimization requests
 */

import type { NextFunction, Request, Response } from "express";
import {
    optimizeTripSheetRoute,
    suggestRoute,
} from "../services/routing.service";

/**
 * POST /api/routing/optimize
 * Optimize waypoint sequence for shipments
 */
export async function optimizeRoute(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { vehicleId, shipmentIds } = req.body;

        if (!vehicleId || !shipmentIds || !Array.isArray(shipmentIds)) {
            return res.status(400).json({
                error: "vehicleId and shipmentIds array required",
            });
        }

        const optimized = await optimizeTripSheetRoute(vehicleId, shipmentIds);

        res.json(optimized);
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/routing/trip-sheet/:id/suggest
 * Get route suggestion for existing trip sheet
 */
export async function suggestTripSheetRoute(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "Trip sheet ID required" });
        }

        const suggested = await suggestRoute(id);

        res.json(suggested);
    } catch (err) {
        next(err);
    }
}
