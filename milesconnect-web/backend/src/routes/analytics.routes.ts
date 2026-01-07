import { Router } from 'express';
import { getMLHealth, getDriverPerformance } from '../controllers/analytics.controller';

const router = Router();

/**
 * @route   GET /api/analytics/health
 * @desc    Get ML service health status
 * @access  Public
 */
router.get('/health', getMLHealth);

/**
 * @route   GET /api/analytics/driver-performance
 * @desc    Get driver performance with ML enhancement
 * @access  Public
 */
router.get('/driver-performance', getDriverPerformance);

export default router;
