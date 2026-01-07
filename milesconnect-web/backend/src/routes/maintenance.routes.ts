import { Router } from "express";
import { createMaintenanceLog, getMaintenanceLogs } from "../controllers/maintenance.controller";

const router = Router();

// /api/maintenance
router.post("/", createMaintenanceLog);
router.get("/vehicles/:vehicleId", getMaintenanceLogs);

export default router;
