/**
 * Dispatch Service
 * Intelligent matching of shipments to vehicles based on:
 * - Vehicle capacity vs shipment weight
 * - Destination proximity (distance-based)
 * - Vehicle availability and current location
 */

import prisma from "../prisma/client";
import {
    calculateAddressDistance,
    getCoordinates,
} from "../utils/distanceCalculator";

interface VehicleMatch {
    vehicleId: string;
    registrationNumber: string;
    score: number;
    reasons: string[];
    estimatedPickupTime: Date;
    capacityMatch: number;
    distanceKm: number | null;
}

interface DispatchSuggestion {
    shipmentId: string;
    referenceNumber: string;
    suggestedVehicles: VehicleMatch[];
}

/**
 * Calculate compatibility score between shipment and vehicle
 */
function calculateCompatibilityScore(
    shipmentWeightKg: number | null,
    vehicleCapacityKg: number | null,
    distanceKm: number | null
): {
    score: number;
    capacityMatch: number;
    proximityScore: number;
} {
    // Capacity match (40% weight)
    let capacityMatch = 0.5; // Default if no weight info
    if (shipmentWeightKg && vehicleCapacityKg) {
        const utilization = shipmentWeightKg / vehicleCapacityKg;
        if (utilization <= 1.0) {
            // 80-100% utilization is ideal
            capacityMatch = utilization >= 0.8 ? 1.0 : utilization / 0.8;
        } else {
            // Over capacity
            capacityMatch = 0;
        }
    }

    // Proximity score (40% weight)
    let proximityScore = 0.5; // Default if no distance info
    if (distanceKm !== null) {
        // Closer is better, normalize to 0-1 (0 km = 1.0, 100+ km = 0)
        proximityScore = Math.max(0, 1 - distanceKm / 100);
    }

    // Availability score (20% weight) - simplified to 1.0 for now
    const availabilityScore = 1.0;

    const score =
        capacityMatch * 0.4 + proximityScore * 0.4 + availabilityScore * 0.2;

    return {
        score,
        capacityMatch,
        proximityScore,
    };
}

/**
 * Get suggested vehicle assignments for pending shipments
 */
export async function suggestAssignments(
    shipmentIds: string[],
    filters?: { maxDistance?: number; minCapacityMatch?: number }
): Promise<DispatchSuggestion[]> {
    try {
        // Fetch pending shipments
        const shipments = await prisma.shipment.findMany({
            where: {
                id: { in: shipmentIds },
                status: { in: ["DRAFT", "PLANNED"] },
                vehicleId: null, // Not yet assigned
            },
            select: {
                id: true,
                referenceNumber: true,
                originAddress: true,
                weightKg: true,
            },
        });

        // Fetch available vehicles
        const vehicles = await prisma.vehicle.findMany({
            where: {
                status: "ACTIVE",
            },
            select: {
                id: true,
                registrationNumber: true,
                capacityKg: true,
            },
        });

        const suggestions: DispatchSuggestion[] = [];

        for (const shipment of shipments) {
            const matches: VehicleMatch[] = [];

            for (const vehicle of vehicles) {
                // Calculate distance
                const distanceKm = calculateAddressDistance(
                    shipment.originAddress,
                    shipment.originAddress // Using origin as current vehicle location (mock)
                );

                // Check filters
                if (filters?.maxDistance && distanceKm && distanceKm > filters.maxDistance) {
                    continue;
                }

                // Calculate compatibility
                const { score, capacityMatch, proximityScore } =
                    calculateCompatibilityScore(
                        shipment.weightKg,
                        vehicle.capacityKg,
                        distanceKm
                    );

                // Check minimum capacity match filter
                if (
                    filters?.minCapacityMatch &&
                    capacityMatch < filters.minCapacityMatch
                ) {
                    continue;
                }

                // Generate reasons
                const reasons: string[] = [];
                if (capacityMatch > 0.8) {
                    reasons.push(
                        `Optimal capacity (${Math.round(capacityMatch * 100)}% utilization)`
                    );
                } else if (capacityMatch > 0.5) {
                    reasons.push(
                        `Good capacity match (${Math.round(capacityMatch * 100)}%)`
                    );
                }

                if (distanceKm !== null) {
                    reasons.push(`${Math.round(distanceKm)} km from pickup`);
                }

                if (proximityScore > 0.7) {
                    reasons.push("Nearby location");
                }

                // Estimate pickup time
                const travelTimeMinutes = distanceKm ? (distanceKm / 60) * 60 : 30;
                const estimatedPickupTime = new Date(
                    Date.now() + travelTimeMinutes * 60000
                );

                matches.push({
                    vehicleId: vehicle.id,
                    registrationNumber: vehicle.registrationNumber,
                    score: Math.round(score * 100) / 100,
                    reasons,
                    estimatedPickupTime,
                    capacityMatch: Math.round(capacityMatch * 100) / 100,
                    distanceKm,
                });
            }

            // Sort by score (highest first)
            matches.sort((a, b) => b.score - a.score);

            // Take top 3 suggestions
            suggestions.push({
                shipmentId: shipment.id,
                referenceNumber: shipment.referenceNumber,
                suggestedVehicles: matches.slice(0, 3),
            });
        }

        return suggestions;
    } catch (error) {
        console.error("Error generating dispatch suggestions:", error);
        throw error;
    }
}

/**
 * Assign shipment to vehicle
 */
export async function assignShipmentToVehicle(
    shipmentId: string,
    vehicleId: string,
    managerId?: string
): Promise<void> {
    try {
        await prisma.shipment.update({
            where: { id: shipmentId },
            data: {
                vehicleId,
                status: "PLANNED",
            },
        });

        // TODO: Create audit log entry once migration is complete
        console.log(
            `Shipment ${shipmentId} assigned to vehicle ${vehicleId} by manager ${managerId}`
        );
    } catch (error) {
        console.error("Error assigning shipment:", error);
        throw error;
    }
}

/**
 * Batch assign shipments using auto-assignment algorithm
 */
export async function autoAssignShipments(
    shipmentIds: string[]
): Promise<{ assigned: number; failed: string[] }> {
    try {
        const suggestions = await suggestAssignments(shipmentIds, {
            minCapacityMatch: 0.5,
        });

        let assigned = 0;
        const failed: string[] = [];

        for (const suggestion of suggestions) {
            if (suggestion.suggestedVehicles.length > 0) {
                // Assign to best match
                const bestMatch = suggestion.suggestedVehicles[0];
                try {
                    await assignShipmentToVehicle(
                        suggestion.shipmentId,
                        bestMatch.vehicleId
                    );
                    assigned++;
                } catch (error) {
                    failed.push(suggestion.shipmentId);
                }
            } else {
                failed.push(suggestion.shipmentId);
            }
        }

        return { assigned, failed };
    } catch (error) {
        console.error("Error in auto-assignment:", error);
        throw error;
    }
}
