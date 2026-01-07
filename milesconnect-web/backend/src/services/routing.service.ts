/**
 * Routing Service
 * Optimize waypoint sequences for trip sheets using TSP algorithm
 */

import prisma from "../prisma/client";
import {
    optimizeRouteSequence,
    calculateRouteMetrics,
    validateRouteSequence,
} from "../utils/tsp";
import { getCoordinates } from "../utils/distanceCalculator";

interface Waypoint {
    id: string;
    type: "pickup" | "drop";
    shipmentId: string;
    location: string;
    latitude?: number;
    longitude?: number;
}

interface OptimizedRoute {
    waypoints: Array<{
        order: number;
        shipmentId: string;
        type: "pickup" | "drop";
        location: string;
        distanceFromPrevious: number;
        eta: string;
    }>;
    metrics: {
        totalDistance: number;
        totalTime: number;
        pickupCount: number;
        dropCount: number;
    };
    isValid: boolean;
    errors: string[];
}

/**
 * Generate optimized route sequence for a trip sheet
 */
export async function optimizeTripSheetRoute(
    vehicleId: string,
    shipmentIds: string[]
): Promise<OptimizedRoute> {
    try {
        // Fetch shipments
        const shipments = await prisma.shipment.findMany({
            where: {
                id: { in: shipmentIds },
            },
            select: {
                id: true,
                referenceNumber: true,
                originAddress: true,
                destinationAddress: true,
            },
        });

        // Get vehicle (mock current location)
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            select: { registrationNumber: true },
        });

        if (!vehicle) {
            throw new Error("Vehicle not found");
        }

        // Build waypoints
        const waypoints: Waypoint[] = [];
        for (const shipment of shipments) {
            // Pickup
            const pickupCoords = getCoordinates(shipment.originAddress);
            waypoints.push({
                id: `pickup_${shipment.id}`,
                type: "pickup",
                shipmentId: shipment.id,
                location: shipment.originAddress,
                latitude: pickupCoords?.latitude,
                longitude: pickupCoords?.longitude,
            });

            // Drop
            const dropCoords = getCoordinates(shipment.destinationAddress);
            waypoints.push({
                id: `drop_${shipment.id}`,
                type: "drop",
                shipmentId: shipment.id,
                location: shipment.destinationAddress,
                latitude: dropCoords?.latitude,
                longitude: dropCoords?.longitude,
            });
        }

        // Mock current vehicle location (use first pickup as starting point)
        const startLocation = waypoints[0]?.latitude
            ? { latitude: waypoints[0].latitude, longitude: waypoints[0].longitude! }
            : { latitude: 19.076, longitude: 72.8777 }; // Default: Mumbai


        // --- Go Microservice Integration ---
        let optimizedWaypoints: any[] = [];
        let metrics = { totalDistance: 0, totalTime: 0, pickupCount: 0, dropCount: 0 };
        let isValid = true;
        let errors: string[] = [];

        try {
            console.log("Attempting to call Go Optimization Service...");
            const payload = {
                start: { latitude: startLocation.latitude, longitude: startLocation.longitude },
                stops: waypoints.map(wp => ({
                    id: wp.id,
                    latitude: wp.latitude || 0,
                    longitude: wp.longitude || 0
                }))
            };

            const response = await fetch("http://localhost:8081/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Go Service Error: ${response.statusText}`);
            }

            const sortedCoordinates: any[] = await response.json();
            console.log("Go Service success. Returned " + sortedCoordinates.length + " stops.");

            // Reconstruct metrics and waypoints
            // Assuming we use simple Haversine from distanceCalculator directly here or logic from tsp
            // We'll mimic the legacy logic for metric calculation

            const R = 6371;
            const deg2rad = (deg: number) => deg * (Math.PI / 180);
            const calcDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                const dLat = deg2rad(lat2 - lat1);
                const dLon = deg2rad(lon2 - lon1);
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            };

            let currentLocation = startLocation;
            let totalTimeMin = 0;
            const avgSpeedKmh = 60;

            optimizedWaypoints = sortedCoordinates.map((coord: any, index: number) => {
                const original = waypoints.find(w => w.id === coord.id);
                if (!original) return null;

                const dist = calcDist(currentLocation.latitude, currentLocation.longitude, coord.latitude, coord.longitude);
                const travelTime = (dist / avgSpeedKmh) * 60;
                totalTimeMin += travelTime;

                metrics.totalDistance += dist;
                currentLocation = { latitude: coord.latitude, longitude: coord.longitude };

                if (original.type === 'pickup') metrics.pickupCount++;
                if (original.type === 'drop') metrics.dropCount++;

                return {
                    order: index + 1,
                    shipmentId: original.shipmentId,
                    type: original.type,
                    location: original.location,
                    distanceFromPrevious: Math.round(dist * 100) / 100,
                    eta: new Date(Date.now() + totalTimeMin * 60000).toISOString().split("T")[1].slice(0, 5),
                    _rawType: original.type, // metadata for validation
                    _rawShipmentId: original.shipmentId
                };
            }).filter((x: any) => x !== null);

            metrics.totalTime = Math.round(totalTimeMin);
            metrics.totalDistance = Math.round(metrics.totalDistance * 100) / 100;

            // Validate logic similar to validateRouteSequence
            const pickedUp = new Set<string>();
            optimizedWaypoints.forEach((wp: any) => {
                if (wp._rawType === 'pickup') pickedUp.add(wp._rawShipmentId);
                else if (wp._rawType === 'drop' && !pickedUp.has(wp._rawShipmentId)) {
                    errors.push(`Drop for shipment ${wp._rawShipmentId} before pickup`);
                }
            });
            isValid = errors.length === 0;

        } catch (goError) {
            console.warn("Go optimization failed, falling back to legacy Node.js TSP:", goError);

            // FALLBACK TO LEGACY TSP
            const optimized = optimizeRouteSequence(waypoints, startLocation);
            const legacyMetrics = calculateRouteMetrics(optimized);
            const validation = validateRouteSequence(optimized);

            optimizedWaypoints = optimized.map((wp) => ({
                order: wp.order,
                shipmentId: wp.shipmentId,
                type: wp.type,
                location: wp.location,
                distanceFromPrevious: Math.round(wp.distanceFromPrevious * 100) / 100,
                eta: wp.estimatedArrival?.toISOString().split("T")[1].slice(0, 5) || "N/A",
            }));
            metrics = legacyMetrics;
            isValid = validation.isValid;
            errors = validation.errors;
        }

        return {
            waypoints: optimizedWaypoints.map(({ _rawType, _rawShipmentId, ...rest }) => rest), // Clean up internal props
            metrics,
            isValid,
            errors,
        };
    } catch (error) {
        console.error("Error optimizing route:", error);
        throw error;
    }
}

/**
 * Get route suggestions for pending shipments
 */
export async function suggestRoute(tripSheetId: string): Promise<OptimizedRoute> {
    try {
        // Fetch trip sheet with linked shipments
        const tripSheet = await prisma.tripSheet.findUnique({
            where: { id: tripSheetId },
            include: {
                shipments: {
                    include: {
                        shipment: {
                            select: {
                                id: true,
                                originAddress: true,
                                destinationAddress: true,
                            },
                        },
                    },
                },
                // Removed vehicle include, relying on vehicleId FK
            },
        });

        if (!tripSheet) {
            throw new Error("Trip sheet not found");
        }

        const shipmentIds = tripSheet.shipments.map(
            (link) => link.shipment.id
        );

        // Use the Foreign Key directly
        if (!tripSheet.vehicleId) {
            throw new Error("Trip sheet has no assigned vehicle");
        }
        return optimizeTripSheetRoute(tripSheet.vehicleId, shipmentIds);
    } catch (error) {
        console.error("Error suggesting route:", error);
        throw error;
    }
}
