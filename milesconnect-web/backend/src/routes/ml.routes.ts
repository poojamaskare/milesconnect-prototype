import express, { type NextFunction, type Request, type Response } from "express";
import { mlService } from "../services/ml.service";

const router = express.Router();

// Delivery Time Prediction
router.post("/predict-delivery-time", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { origin_address, destination_address, weight_kg, vehicle_capacity_kg } = req.body;

        if (!origin_address || !destination_address || !weight_kg) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: origin_address, destination_address, weight_kg",
            });
        }

        const prediction = await mlService.predictDeliveryTime({
            origin_address,
            destination_address,
            weight_kg,
            vehicle_capacity_kg,
        });

        if (!prediction) {
            return res.status(503).json({
                success: false,
                error: "ML service unavailable",
            });
        }

        res.status(200).json({
            success: true,
            data: prediction,
        });
    } catch (err) {
        next(err);
    }
});

// Route Optimization
router.post("/optimize-route", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { shipment_ids, start_location, vehicle_capacity_kg, driver_id } = req.body;

        if (!shipment_ids || !start_location || !vehicle_capacity_kg) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: shipment_ids, start_location, vehicle_capacity_kg",
            });
        }

        const optimization = await mlService.optimizeRoute({
            shipment_ids,
            start_location,
            vehicle_capacity_kg,
            driver_id,
        });

        if (!optimization) {
            return res.status(503).json({
                success: false,
                error: "ML service unavailable",
            });
        }

        res.status(200).json({
            success: true,
            data: optimization,
        });
    } catch (err) {
        next(err);
    }
});

// Demand Forecasting
router.post("/forecast-demand", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { forecast_days, region } = req.body;

        const forecast = await mlService.forecastDemand({
            forecast_days: forecast_days || 7,
            region,
        });

        if (!forecast) {
            return res.status(503).json({
                success: false,
                error: "ML service unavailable",
            });
        }

        res.status(200).json({
            success: true,
            data: forecast,
        });
    } catch (err) {
        next(err);
    }
});

// Driver Performance Analysis
router.post("/analyze-driver-performance", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { driver_id, period_days } = req.body;

        if (!driver_id) {
            return res.status(400).json({
                success: false,
                error: "Missing required field: driver_id",
            });
        }

        const performance = await mlService.analyzeDriverPerformance({
            driver_id,
            period_days: period_days || 30,
        });

        if (!performance) {
            return res.status(503).json({
                success: false,
                error: "ML service unavailable",
            });
        }

        res.status(200).json({
            success: true,
            data: performance,
        });
    } catch (err) {
        next(err);
    }
});

// Anomaly Detection
router.post("/detect-anomalies", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { entity_type, entity_id, check_type } = req.body;

        if (!entity_type || !entity_id || !check_type) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: entity_type, entity_id, check_type",
            });
        }

        const anomalies = await mlService.detectAnomalies({
            entity_type,
            entity_id,
            check_type,
        });

        if (!anomalies) {
            return res.status(503).json({
                success: false,
                error: "ML service unavailable",
            });
        }

        res.status(200).json({
            success: true,
            data: anomalies,
        });
    } catch (err) {
        next(err);
    }
});

// Health check for ML service
router.get("/health", async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const isHealthy = await mlService.healthCheck();

        res.status(200).json({
            success: true,
            data: {
                ml_service_healthy: isHealthy,
            },
        });
    } catch (err) {
        next(err);
    }
});

export default router;
export { router as mlRouter };
