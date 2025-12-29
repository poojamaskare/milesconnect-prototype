import express from "express";
import {
  createVehicle,
  deleteVehicle,
  getVehicle,
  listVehicles,
  updateVehicle,
} from "../controllers/vehicle.controller";

const router = express.Router();

// CRUD for Vehicles (mounted at /api/vehicles)
router.get("/", listVehicles);
router.get("/:id", getVehicle);
router.post("/", createVehicle);
router.patch("/:id", updateVehicle);
router.delete("/:id", deleteVehicle);

export default router;
export { router as vehicleRouter };
