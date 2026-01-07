import express from "express";
import {
    getDeliveryPerformance,
    getFleetUtilization,
    getCostOptimization,
    getDriverPerformanceScores,
    getPredictiveMaintenance,
} from "../controllers/mlAnalytics.controller";

const router = express.Router();

// Mounted at /api/ml-analytics

// Delivery Performance Metrics
router.get("/delivery-performance", getDeliveryPerformance);

// Fleet Utilization Analysis
router.get("/fleet-utilization", getFleetUtilization);

// Cost Optimization Insights
router.get("/cost-optimization", getCostOptimization);

// Driver Performance Scoring (ML-powered)
router.get("/driver-performance", getDriverPerformanceScores);

// Predictive Maintenance (ML-powered)
router.get("/maintenance-predictions", getPredictiveMaintenance);

export default router;
export { router as mlAnalyticsRouter };
