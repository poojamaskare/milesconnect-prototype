/**
 * Dispatch Controller
 * Handles shipment-vehicle assignment requests
 */

import type { NextFunction, Request, Response } from "express";
import {
    suggestAssignments,
    assignShipmentToVehicle,
    autoAssignShipments,
} from "../services/dispatch.service";

/**
 * GET /api/dispatch/suggestions
 * Get vehicle assignment suggestions for pending shipments
 */
export async function getAssignmentSuggestions(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { shipmentIds, maxDistance, minCapacityMatch } = req.body;

        if (!shipmentIds || !Array.isArray(shipmentIds)) {
            return res.status(400).json({ error: "shipmentIds array required" });
        }

        const filters: any = {};
        if (maxDistance) filters.maxDistance = Number(maxDistance);
        if (minCapacityMatch) filters.minCapacityMatch = Number(minCapacityMatch);

        const suggestions = await suggestAssignments(shipmentIds, filters);

        res.json({
            suggestions,
            count: suggestions.length,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/dispatch/assign
 * Assign shipment to specific vehicle
 */
export async function assignShipment(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { shipmentId, vehicleId } = req.body;

        if (!shipmentId || !vehicleId) {
            return res.status(400).json({ error: "shipmentId and vehicleId required" });
        }

        // TODO: Get manager ID from auth middleware
        const managerId = req.body.managerId;

        await assignShipmentToVehicle(shipmentId, vehicleId, managerId);

        res.json({
            success: true,
            message: "Shipment assigned successfully",
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/dispatch/auto-assign
 * Automatically assign multiple shipments using algorithm
 */
export async function autoAssign(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { shipmentIds } = req.body;

        if (!shipmentIds || !Array.isArray(shipmentIds)) {
            return res.status(400).json({ error: "shipmentIds array required" });
        }

        const result = await autoAssignShipments(shipmentIds);

        res.json({
            success: true,
            assigned: result.assigned,
            failed: result.failed,
            message: `Assigned ${result.assigned} of ${shipmentIds.length} shipments`,
        });
    } catch (err) {
        next(err);
    }
}
