/**
 * Dispatch Routes
 */

import express from "express";
import {
    getAssignmentSuggestions,
    assignShipment,
    autoAssign,
} from "../controllers/dispatch.controller";

const router = express.Router();

// POST /api/dispatch/suggestions - Get vehicle assignment suggestions
router.post("/suggestions", getAssignmentSuggestions);

// POST /api/dispatch/assign - Assign shipment to vehicle
router.post("/assign", assignShipment);

// POST /api/dispatch/auto-assign - Auto-assign multiple shipments
router.post("/auto-assign", autoAssign);

export default router;
export { router as dispatchRouter };
