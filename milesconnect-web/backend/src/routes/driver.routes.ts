import express from "express";
import { getDriver, listDrivers } from "../controllers/driver.controller";

const router = express.Router();

// Mounted at /api/drivers
router.get("/", listDrivers);
router.get("/:id", getDriver);

export default router;
export { router as driverRouter };
