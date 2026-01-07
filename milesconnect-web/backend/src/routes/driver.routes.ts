import express from "express";
import { createDriver, getDriver, listDrivers, deleteDriver } from "../controllers/driver.controller";

const router = express.Router();

// Mounted at /api/drivers
router.get("/", listDrivers);
router.post("/", createDriver);
router.get("/:id", getDriver);
router.delete("/:id", deleteDriver);

export default router;
export { router as driverRouter };
