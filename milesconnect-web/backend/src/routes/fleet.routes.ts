import express from "express";
import {
  completeTrip,
  getFleetStatus,
  startTrip,
} from "../controllers/fleet.controller";

const router = express.Router();

// Fleet operations (mounted at /api/fleet)
router.get("/status", getFleetStatus);
router.post("/start-trip", startTrip);
router.post("/complete-trip", completeTrip);

export default router;
export { router as fleetRouter };
