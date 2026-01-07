/**
 * Routing Routes
 */

import express from "express";
import {
    optimizeRoute,
    suggestTripSheetRoute,
} from "../controllers/routing.controller";

const router = express.Router();

// POST /api/routing/optimize - Optimize waypoint sequence
router.post("/optimize", optimizeRoute);

// GET /api/routing/trip-sheet/:id/suggest - Get route suggestion for trip sheet
router.get("/trip-sheet/:id/suggest", suggestTripSheetRoute);

export default router;
export { router as routingRouter };
