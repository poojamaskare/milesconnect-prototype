import prisma from '../prisma/client';
import { z } from 'zod';

// Zod Schemas
const DriverPerformanceSchema = z.object({
    driverId: z.string(),
    driverName: z.string(),
    score: z.number(),
    metrics: z.object({
        on_time_delivery_rate: z.number().optional(),
        fuel_efficiency_kmpl: z.number().optional(),
        safety_score: z.number().optional(),
    })
});

const APIResponseSchema = z.object({
    drivers: z.array(DriverPerformanceSchema)
});

interface MLServiceHealth {
    available: boolean;
    lastCheck: Date | null;
    latencyMs: number | null;
}

interface DriverPerformanceML {
    driverId: string;
    driverName: string;
    score: number;
    metrics: {
        on_time_delivery_rate?: number;
        fuel_efficiency_kmpl?: number;
        safety_score?: number;
    };
}

interface DriverPerformanceResponse {
    drivers: DriverPerformanceML[];
    mlServiceAvailable: boolean;
}

class MLServiceProxy {
    private baseUrl: string;
    private healthStatus: MLServiceHealth = {
        available: false,
        lastCheck: null,
        latencyMs: null,
    };
    private circuitOpen = false;
    private healthCheckInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';

        // Start background health checks every 30 seconds
        this.startHealthMonitoring();
    }

    private startHealthMonitoring() {
        // Initial health check
        this.healthCheck();

        // Periodic health checks
        this.healthCheckInterval = setInterval(() => {
            this.healthCheck();
        }, 30000); // 30 seconds
    }

    /**
     * Performs a health check on the ML service
     */
    async healthCheck(): Promise<MLServiceHealth> {
        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout

            const response = await fetch(`${this.baseUrl}/health`, {
                signal: controller.signal,
            });

            clearTimeout(timeout);

            const latency = Date.now() - startTime;
            const available = response.ok;

            this.healthStatus = {
                available,
                lastCheck: new Date(),
                latencyMs: latency,
            };

            // Close circuit if service is back online
            if (available) {
                this.circuitOpen = false;
            }

        } catch (error) {
            console.error('[MLProxy] Health check failed:', error);
            const latency = Date.now() - startTime;

            this.healthStatus = {
                available: false,
                lastCheck: new Date(),
                latencyMs: latency,
            };

            // Open circuit on failure
            this.circuitOpen = true;
        }

        return this.healthStatus;
    }

    /**
     * Get current health status without making a new request
     */
    getHealthStatus(): MLServiceHealth {
        return { ...this.healthStatus };
    }

    /**
     * Fetches driver performance from ML service with fallback
     */
    async getDriverPerformance(): Promise<DriverPerformanceResponse> {
        // Circuit breaker: if service is down, use fallback immediately
        if (this.circuitOpen) {
            console.log('[MLProxy] Circuit open, using fallback');
            return this.fallbackDriverPerformance();
        }

        try {
            // 1. Fetch all drivers from DB first
            const drivers = await prisma.driver.findMany({
                include: {
                    user: { select: { name: true } },
                    shipments: { select: { id: true } }
                }
            });

            if (drivers.length === 0) {
                return { drivers: [], mlServiceAvailable: true };
            }

            // 2. Call ML service for each driver
            const performancePromises = drivers.map(async (driver) => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 1000); // 1s timeout per driver

                try {
                    const response = await fetch(`${this.baseUrl}/api/analyze/driver-performance`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            driver_id: driver.id,
                            period_days: 30
                        }),
                        signal: controller.signal,
                    });

                    clearTimeout(timeout);

                    if (!response.ok) {
                        throw new Error(`ML service returned ${response.status}`);
                    }

                    const data = await response.json();

                    // Map ML response to our internal format
                    return {
                        driverId: driver.id,
                        driverName: driver.user?.name || 'Unknown',
                        score: data.overall_score,
                        metrics: {
                            on_time_delivery_rate: data.metrics.on_time_rate / 10, // Convert 0-10 to 0-1
                            fuel_efficiency_kmpl: data.metrics.fuel_efficiency, // Already scaled or raw? ML returns 0-10 score mostly.
                            // The ML service returns metrics in 0-10 scale for scoring, but we might want raw values.
                            // For now let's map the score directly.
                            safety_score: data.metrics.safety_score
                        }
                    };
                } catch (err) {
                    console.warn(`[MLProxy] Failed for driver ${driver.id}:`, err);
                    // Fallback for individual driver failure? or throw to trigger global fallback?
                    // Let's return null and filter partial failures, or trigger global fallback.
                    throw err;
                }
            });

            // Wait for all
            const results = await Promise.all(performancePromises);

            return {
                drivers: results,
                mlServiceAvailable: true,
            };

        } catch (error) {
            console.warn('[MLProxy] ML service unavailable or invalid, using fallback:',
                error instanceof Error ? error.message : 'Unknown error');

            // Open circuit on failure
            this.circuitOpen = true;

            return this.fallbackDriverPerformance();
        }
    }

    /**
     * Fallback: Calculate driver performance from database
     */
    private async fallbackDriverPerformance(): Promise<DriverPerformanceResponse> {
        try {
            const drivers = await prisma.driver.findMany({
                include: {
                    user: {
                        select: {
                            name: true,
                        },
                    },
                    shipments: {
                        where: {
                            status: 'DELIVERED',
                        },
                        select: {
                            id: true,
                            scheduledDropAt: true,
                            actualDropAt: true,
                        },
                    },
                    tripSheets: {
                        select: {
                            id: true,
                            startOdometerKm: true,
                            endOdometerKm: true,
                            fuelAtStart: true,
                            fuelAtEnd: true,
                        },
                    },
                },
            });

            const driverPerformance: DriverPerformanceML[] = drivers.map((driver) => {
                // Calculate on-time delivery rate
                const totalDeliveries = driver.shipments.length;
                const onTimeDeliveries = driver.shipments.filter((shipment) => {
                    if (!shipment.scheduledDropAt || !shipment.actualDropAt) return false;
                    return shipment.actualDropAt <= shipment.scheduledDropAt;
                }).length;

                const onTimeRate = totalDeliveries > 0
                    ? (onTimeDeliveries / totalDeliveries) * 100
                    : 0;

                // Calculate fuel efficiency (basic)
                const tripSheetsWithData = driver.tripSheets.filter(
                    (ts) => ts.startOdometerKm && ts.endOdometerKm && ts.fuelAtStart && ts.fuelAtEnd
                );

                let fuelEfficiency = 0;
                if (tripSheetsWithData.length > 0) {
                    const totalDistance = tripSheetsWithData.reduce(
                        (sum, ts) => sum + ((ts.endOdometerKm || 0) - (ts.startOdometerKm || 0)),
                        0
                    );
                    const totalFuel = tripSheetsWithData.reduce(
                        (sum, ts) => sum + ((ts.fuelAtStart || 0) - (ts.fuelAtEnd || 0)),
                        0
                    );
                    fuelEfficiency = totalFuel > 0 ? totalDistance / totalFuel : 0;
                }

                // Simple score calculation (0-100)
                const score = (onTimeRate * 0.6) + (Math.min(fuelEfficiency * 5, 40));

                return {
                    driverId: driver.id,
                    driverName: driver.user?.name || 'Unknown Driver',
                    score: Math.round(score * 10) / 10, // Round to 1 decimal
                    metrics: {
                        on_time_delivery_rate: Math.round(onTimeRate * 10) / 10,
                        fuel_efficiency_kmpl: fuelEfficiency > 0
                            ? Math.round(fuelEfficiency * 10) / 10
                            : undefined,
                    },
                };
            });

            // Sort by score descending
            driverPerformance.sort((a, b) => b.score - a.score);

            return {
                drivers: driverPerformance,
                mlServiceAvailable: false,
            };

        } catch (error) {
            console.error('[MLProxy] Fallback calculation failed:', error);

            return {
                drivers: [],
                mlServiceAvailable: false,
            };
        }
    }

    /**
     * Cleanup on application shutdown
     */
    destroy() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
}

// Singleton instance
export const mlServiceProxy = new MLServiceProxy();

// Cleanup on process exit
process.on('SIGTERM', () => mlServiceProxy.destroy());
process.on('SIGINT', () => mlServiceProxy.destroy());
