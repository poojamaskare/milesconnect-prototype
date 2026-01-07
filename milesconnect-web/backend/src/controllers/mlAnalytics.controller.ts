import type { NextFunction, Request, Response } from "express";
import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

type HttpError = Error & { statusCode?: number; code?: string };

function httpError(statusCode: number, message: string, code?: string): HttpError {
    const err = new Error(message) as HttpError;
    err.statusCode = statusCode;
    if (code) err.code = code;
    return err;
}

/**
 * Enhanced Analytics Controller with ML Integration
 * 
 * Provides advanced metrics including:
 * - Delivery performance (on-time rate, delay patterns)
 * - Fleet utilization (active vs idle time)
 * - Cost optimization (fuel cost per route, expense trends)
 * - Driver performance scoring (ML-powered)
 * - Predictive maintenance (ML-powered)
 */

import prisma from "../prisma/client";

export async function getDeliveryPerformance(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // On-time delivery rate
        const deliveredShipments = await prisma.shipment.findMany({
            where: { status: "DELIVERED" },
            select: {
                actualPickupAt: true,
                actualDropAt: true,
                scheduledPickupAt: true,
                scheduledDropAt: true,
                createdAt: true,
            },
        });

        const totalDelivered = deliveredShipments.length;
        let onTimeCount = 0;
        const deliveryTimes: number[] = [];
        const delaysByTimeOfDay = {
            morning: { total: 0, delayed: 0, totalDelay: 0 }, // 6am-12pm
            afternoon: { total: 0, delayed: 0, totalDelay: 0 }, // 12pm-6pm
            evening: { total: 0, delayed: 0, totalDelay: 0 }, // 6pm-12am
            night: { total: 0, delayed: 0, totalDelay: 0 }, // 12am-6am
        };

        for (const shipment of deliveredShipments) {
            // On-time calculation
            if (shipment.actualDropAt && shipment.scheduledDropAt) {
                const isOnTime =
                    new Date(shipment.actualDropAt) <= new Date(shipment.scheduledDropAt);
                if (isOnTime) onTimeCount++;

                // Calculate delay
                const delayMs =
                    new Date(shipment.actualDropAt).getTime() -
                    new Date(shipment.scheduledDropAt).getTime();
                const delayMins = delayMs / (1000 * 60);

                // Time of day analysis
                const hour = new Date(shipment.actualDropAt).getHours();
                let period: keyof typeof delaysByTimeOfDay;
                if (hour >= 6 && hour < 12) period = "morning";
                else if (hour >= 12 && hour < 18) period = "afternoon";
                else if (hour >= 18 && hour < 24) period = "evening";
                else period = "night";

                delaysByTimeOfDay[period].total++;
                if (delayMins > 0) {
                    delaysByTimeOfDay[period].delayed++;
                    delaysByTimeOfDay[period].totalDelay += delayMins;
                }
            }

            // Average delivery time
            if (shipment.actualPickupAt && shipment.actualDropAt) {
                const timeMs =
                    new Date(shipment.actualDropAt).getTime() -
                    new Date(shipment.actualPickupAt).getTime();
                const timeHours = timeMs / (1000 * 60 * 60);
                deliveryTimes.push(timeHours);
            }
        }

        const onTimeRate = totalDelivered > 0 ? (onTimeCount / totalDelivered) * 100 : 0;
        const avgDeliveryTime =
            deliveryTimes.length > 0
                ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
                : 0;

        // Format delay patterns
        const delayPatterns = Object.entries(delaysByTimeOfDay).map(
            ([period, stats]) => ({
                timeOfDay: period,
                delayFrequency:
                    stats.total > 0 ? (stats.delayed / stats.total) * 100 : 0,
                avgDelayMins:
                    stats.delayed > 0 ? stats.totalDelay / stats.delayed : 0,
            })
        );

        res.json({
            onTimeDeliveryRate: Number(onTimeRate.toFixed(2)),
            avgDeliveryTime: Number(avgDeliveryTime.toFixed(2)),
            totalDeliveries: totalDelivered,
            onTimeDeliveries: onTimeCount,
            lateDeliveries: totalDelivered - onTimeCount,
            delayPatterns,
        });
    } catch (err) {
        next(err);
    }
}

export async function getFleetUtilization(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const vehicles = await prisma.vehicle.findMany({
            include: {
                tripSheets: {
                    where: {
                        startedAt: { not: null },
                    },
                    select: {
                        startedAt: true,
                        endedAt: true,
                        totalExpenseCents: true,
                    },
                },
                shipments: {
                    where: {
                        status: "DELIVERED",
                    },
                    include: {
                        invoice: {
                            select: {
                                totalCents: true,
                            },
                        },
                    },
                },
            },
        });

        const vehicleMetrics = vehicles.map((vehicle) => {
            // Calculate active hours
            let activeHours = 0;
            for (const trip of vehicle.tripSheets) {
                if (trip.startedAt && trip.endedAt) {
                    const durationMs =
                        new Date(trip.endedAt).getTime() -
                        new Date(trip.startedAt).getTime();
                    activeHours += durationMs / (1000 * 60 * 60);
                }
            }

            // Calculate total time (from first trip to now, or last trip)
            const now = new Date();
            const firstTrip = vehicle.tripSheets[0];
            let totalHours = 0;
            if (firstTrip?.startedAt) {
                const lastTrip = vehicle.tripSheets[vehicle.tripSheets.length - 1];
                const endTime = lastTrip?.endedAt
                    ? new Date(lastTrip.endedAt)
                    : now;
                totalHours =
                    (endTime.getTime() - new Date(firstTrip.startedAt).getTime()) /
                    (1000 * 60 * 60);
            }

            const utilizationRate = totalHours > 0 ? (activeHours / totalHours) * 100 : 0;
            const idleHours = Math.max(0, totalHours - activeHours);

            // Calculate revenue
            const revenueGenerated = vehicle.shipments.reduce(
                (sum, shipment) =>
                    sum + Number(shipment.invoice?.totalCents || 0) / 100,
                0
            );

            // Calculate total expenses
            const totalExpenses = vehicle.tripSheets.reduce(
                (sum, trip) => sum + Number(trip.totalExpenseCents || 0) / 100,
                0
            );

            // Cost per km (placeholder, would need odometer data)
            const costPerKm = 0; // TODO: Calculate from trip sheet odometer readings

            return {
                vehicleId: vehicle.id,
                registrationNumber: vehicle.registrationNumber,
                utilizationRate: Number(utilizationRate.toFixed(2)),
                activeHours: Number(activeHours.toFixed(2)),
                idleHours: Number(idleHours.toFixed(2)),
                revenueGenerated: Number(revenueGenerated.toFixed(2)),
                totalExpenses: Number(totalExpenses.toFixed(2)),
                profitability: Number((revenueGenerated - totalExpenses).toFixed(2)),
                costPerKm,
            };
        });

        const overallUtilization =
            vehicleMetrics.length > 0
                ? vehicleMetrics.reduce((sum, v) => sum + v.utilizationRate, 0) /
                vehicleMetrics.length
                : 0;

        // Identify underutilized vehicles (< 50% utilization)
        const underutilizedVehicles = vehicleMetrics
            .filter((v) => v.utilizationRate < 50)
            .map((v) => v.registrationNumber);

        res.json({
            overallUtilization: Number(overallUtilization.toFixed(2)),
            vehicles: vehicleMetrics,
            insights: {
                underutilizedVehicles,
                recommendedFleetSize: Math.ceil(vehicles.length * 0.8), // Placeholder algorithm
            },
        });
    } catch (err) {
        next(err);
    }
}

export async function getCostOptimization(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const tripSheets = await prisma.tripSheet.findMany({
            include: {
                vehicle: {
                    select: {
                        registrationNumber: true,
                    },
                },
            },
        });

        // Fuel cost analysis
        let totalFuelCost = 0;
        let totalDistance = 0;

        for (const trip of tripSheets) {
            const fuelCost = Number(trip.fuelExpenseCents) / 100;
            totalFuelCost += fuelCost;

            // Calculate distance from odometer
            if (trip.startOdometerKm && trip.endOdometerKm) {
                const distance = trip.endOdometerKm - trip.startOdometerKm;
                totalDistance += distance;
            }
        }

        const avgCostPerKm = totalDistance > 0 ? totalFuelCost / totalDistance : 0;

        // Expense trends (last 6 months, grouped by month)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentTrips = await prisma.tripSheet.findMany({
            where: {
                createdAt: {
                    gte: sixMonthsAgo,
                },
            },
            select: {
                createdAt: true,
                fuelExpenseCents: true,
                tollExpenseCents: true,
                otherExpenseCents: true,
                totalExpenseCents: true,
            },
        });

        // Group by month
        const expensesByMonth: Record<string, any> = {};
        for (const trip of recentTrips) {
            const monthKey = new Date(trip.createdAt).toISOString().slice(0, 7); // YYYY-MM

            if (!expensesByMonth[monthKey]) {
                expensesByMonth[monthKey] = {
                    period: monthKey,
                    fuel: 0,
                    maintenance: 0,
                    tolls: 0,
                    other: 0,
                    total: 0,
                };
            }

            expensesByMonth[monthKey].fuel += Number(trip.fuelExpenseCents) / 100;
            expensesByMonth[monthKey].tolls += Number(trip.tollExpenseCents) / 100;
            expensesByMonth[monthKey].other += Number(trip.otherExpenseCents) / 100;
            expensesByMonth[monthKey].total += Number(trip.totalExpenseCents) / 100;
        }

        const expenseTrends = Object.values(expensesByMonth).sort((a, b) =>
            a.period.localeCompare(b.period)
        );

        const recommendations = [
            avgCostPerKm > 10
                ? "Fuel costs are above optimal. Consider route optimization."
                : "Fuel costs are within acceptable range.",
            "Implement preventive maintenance to reduce breakdown costs.",
            "Analyze toll routes for potential cost savings.",
        ];

        res.json({
            fuelCostAnalysis: {
                avgCostPerKm: Number(avgCostPerKm.toFixed(2)),
                totalFuelCost: Number(totalFuelCost.toFixed(2)),
                totalDistance: Number(totalDistance.toFixed(2)),
            },
            expenseTrends,
            recommendations,
        });
    } catch (err) {
        next(err);
    }
}

export async function getDriverPerformanceScores(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // Fetch drivers with their performance data
        const drivers = await prisma.driver.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        createdAt: true,
                    },
                },
                shipments: {
                    where: {
                        status: "DELIVERED",
                    },
                    select: {
                        actualDropAt: true,
                        scheduledDropAt: true,
                        actualPickupAt: true,
                    },
                },
                tripSheets: {
                    select: {
                        startOdometerKm: true,
                        endOdometerKm: true,
                        fuelExpenseCents: true,
                        createdAt: true,
                    },
                },
            },
        });

        // Calculate metrics for ML scoring
        const driverScores = [];

        for (const driver of drivers) {
            const totalTrips = driver.shipments.length;
            if (totalTrips === 0) continue;

            // On-time deliveries
            let onTimeDeliveries = 0;
            for (const shipment of driver.shipments) {
                if (shipment.actualDropAt && shipment.scheduledDropAt) {
                    if (
                        new Date(shipment.actualDropAt) <=
                        new Date(shipment.scheduledDropAt)
                    ) {
                        onTimeDeliveries++;
                    }
                }
            }

            // Calculate total distance
            let totalDistance = 0;
            let totalFuelCost = 0;
            for (const trip of driver.tripSheets) {
                if (trip.startOdometerKm && trip.endOdometerKm) {
                    totalDistance += trip.endOdometerKm - trip.startOdometerKm;
                }
                totalFuelCost += Number(trip.fuelExpenseCents) / 100;
            }

            // Calculate fuel efficiency (placeholder - would need fuel volume data)
            const fuelEfficiency = 12; // km/l placeholder

            // Experience in months
            const experienceMonths = Math.floor(
                (Date.now() - new Date(driver.user.createdAt).getTime()) /
                (1000 * 60 * 60 * 24 * 30)
            );

            // Prepare data for ML model
            const driverData = {
                driver_id: driver.id,
                total_trips: totalTrips,
                on_time_deliveries: onTimeDeliveries,
                late_deliveries: totalTrips - onTimeDeliveries,
                avg_speed_kmh: 55, // Placeholder
                harsh_braking_count: Math.floor(Math.random() * 20), // Placeholder
                harsh_acceleration_count: Math.floor(Math.random() * 25), // Placeholder
                idle_time_mins: totalTrips * 15, // Placeholder
                fuel_efficiency_kmpl: fuelEfficiency,
                distance_km: totalDistance,
                experience_months: experienceMonths,
                incident_count: 0, // Placeholder
                customer_rating: 4.2, // Placeholder
            };

            driverScores.push({
                driverId: driver.id,
                driverName: driver.user.name || "Unknown",
                data: driverData,
                onTimeRate: onTimeDeliveries / totalTrips,
            });
        }

        // If ML service is available, get ML scores
        try {
            const mlScores = await axios.post(
                `${ML_SERVICE_URL}/api/ml/driver-score/batch`,
                driverScores.map((d) => d.data)
            );

            // Merge ML scores with driver data
            const enrichedScores = driverScores.map((d, idx) => ({
                driverId: d.driverId,
                driverName: d.driverName,
                score: mlScores.data.drivers[idx]?.score || d.onTimeRate * 100,
                metrics: mlScores.data.drivers[idx]?.metrics || {},
            }));

            res.json({
                drivers: enrichedScores.sort((a, b) => b.score - a.score),
                mlServiceAvailable: true,
            });
        } catch (mlError) {
            // Fallback to simple scoring if ML service unavailable
            console.warn("ML service unavailable, using fallback scoring");
            const fallbackScores = driverScores.map((d) => ({
                driverId: d.driverId,
                driverName: d.driverName,
                score: Number((d.onTimeRate * 100).toFixed(2)),
                metrics: {
                    on_time_delivery_rate: Number((d.onTimeRate * 100).toFixed(2)),
                },
            }));

            res.json({
                drivers: fallbackScores.sort((a, b) => b.score - a.score),
                mlServiceAvailable: false,
            });
        }
    } catch (err) {
        next(err);
    }
}

export async function getPredictiveMaintenance(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const vehicles = await prisma.vehicle.findMany({
            include: {
                tripSheets: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                    select: {
                        startOdometerKm: true,
                        endOdometerKm: true,
                        createdAt: true,
                    },
                },
            },
        });

        const predictions = [];

        for (const vehicle of vehicles) {
            // Calculate metrics
            const totalTrips = vehicle.tripSheets.length;
            if (totalTrips === 0) continue;

            const lastTrip = vehicle.tripSheets[0];
            const currentOdometer = lastTrip?.endOdometerKm || 0;

            // Days since last maintenance (placeholder)
            const daysSinceMaintenance = vehicle.lastMaintenanceDate
                ? Math.floor(
                    (Date.now() - new Date(vehicle.lastMaintenanceDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
                : 60;

            // Vehicle age in months
            const ageMonths = Math.floor(
                (Date.now() - new Date(vehicle.createdAt).getTime()) /
                (1000 * 60 * 60 * 24 * 30)
            );

            // Average trip distance
            let totalDistance = 0;
            for (const trip of vehicle.tripSheets) {
                if (trip.startOdometerKm && trip.endOdometerKm) {
                    totalDistance += trip.endOdometerKm - trip.startOdometerKm;
                }
            }
            const avgTripDistance = totalTrips > 0 ? totalDistance / totalTrips : 0;

            const vehicleData = {
                vehicle_id: vehicle.id,
                age_months: ageMonths,
                odometer_km: currentOdometer,
                days_since_last_maintenance: daysSinceMaintenance,
                total_trips: totalTrips,
                avg_trip_distance_km: avgTripDistance,
                harsh_usage_score: 40, // Placeholder
                fuel_consumption_variance: 10, // Placeholder
                reported_issues_count: 0, // Placeholder
            };

            // Try ML prediction
            try {
                const mlPrediction = await axios.post(
                    `${ML_SERVICE_URL}/api/ml/maintenance-prediction`,
                    vehicleData
                );

                predictions.push({
                    vehicleId: vehicle.id,
                    registrationNumber: vehicle.registrationNumber,
                    ...mlPrediction.data,
                });
            } catch {
                // Fallback logic
                const risk =
                    daysSinceMaintenance > 60
                        ? "soon"
                        : daysSinceMaintenance > 30
                            ? "normal"
                            : "immediate";

                predictions.push({
                    vehicleId: vehicle.id,
                    registrationNumber: vehicle.registrationNumber,
                    predicted_class: risk,
                    confidence: 0.7,
                    days_until_maintenance: 90 - daysSinceMaintenance,
                    suggestedActions: ["Schedule regular maintenance check"],
                });
            }
        }

        res.json({ vehicles: predictions });
    } catch (err) {
        next(err);
    }
}
