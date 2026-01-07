import { Request, Response } from 'express';
import { mlServiceProxy } from '../services/mlServiceProxy';

/**
 * Get ML service health status
 */
export const getMLHealth = async (_req: Request, res: Response) => {
    try {
        const health = mlServiceProxy.getHealthStatus();

        res.status(200).json({
            success: true,
            data: health,
        });
    } catch (error) {
        console.error('Error fetching ML health:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ML service health',
        });
    }
};

/**
 * Get driver performance with ML enhancement
 */
export const getDriverPerformance = async (_req: Request, res: Response) => {
    try {
        const performance = await mlServiceProxy.getDriverPerformance();

        res.status(200).json({
            success: true,
            data: performance,
        });
    } catch (error) {
        console.error('Error fetching driver performance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch driver performance',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
