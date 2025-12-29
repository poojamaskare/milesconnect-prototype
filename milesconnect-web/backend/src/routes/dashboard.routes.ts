import express from "express";
import { getDashboardSummary } from "../controllers/dashboard.controller";

const router = express.Router();

// Mounted at /api/dashboard
router.get("/summary", getDashboardSummary);

export default router;
export { router as dashboardRouter };
