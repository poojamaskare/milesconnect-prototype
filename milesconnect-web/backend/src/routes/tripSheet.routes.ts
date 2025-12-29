import express from "express";
import {
  createTripSheet,
  getTripSheet,
  listTripSheets,
  updateTripSheet,
  updateTripSheetStatus,
  addFuelStop,
  addExpense,
  createTripSheetsFromShipments,
} from "../controllers/tripSheet.controller";

const router = express.Router();

// Mounted at /api/trip-sheets
router.get("/", listTripSheets);
router.post("/", createTripSheet);
router.post("/create-from-shipments", createTripSheetsFromShipments);
router.get("/:id", getTripSheet);
router.patch("/:id", updateTripSheet);
router.patch("/:id/status", updateTripSheetStatus);
router.post("/:id/fuel-stops", addFuelStop);
router.post("/:id/expenses", addExpense);

export default router;
export { router as tripSheetRouter };
