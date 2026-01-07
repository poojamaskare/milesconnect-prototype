/**
 * Monitoring Routes
 */

import express from "express";
import {
    checkRisk,
    getHighRisk,
    updateLocation,
} from "../controllers/monitoring.controller";

const router = express.Router();

// POST /api/monitoring/check-risk - Check delivery risk for shipments
router.post("/check-risk", checkRisk);

// GET /api/monitoring/high-risk - Get high-risk shipments
router.get("/high-risk", getHighRisk);

// POST /api/monitoring/update-location - Update GPS coordinates
router.post("/update-location", updateLocation);

export default router;
export { router as monitoringRouter };
