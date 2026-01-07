/**
 * Audit Routes
 */

import express from "express";
import {
    getAuditLogs,
    getShipmentHistory,
    exportAuditLogs,
} from "../controllers/audit.controller";

const router = express.Router();

// GET /api/audit/logs/:recordId - Get audit logs for a record
router.get("/logs/:recordId", getAuditLogs);

// GET /api/audit/shipment/:id - Get shipment audit history
router.get("/shipment/:id", getShipmentHistory);

// GET /api/audit/export - Export audit logs as CSV
router.get("/export", exportAuditLogs);

export default router;
export { router as auditRouter };
