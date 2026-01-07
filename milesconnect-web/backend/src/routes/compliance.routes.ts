import { Router } from "express";
import { getExpiringDocuments } from "../controllers/compliance.controller";

const router = Router();

// /api/compliance
router.get("/alerts", getExpiringDocuments);

export default router;
