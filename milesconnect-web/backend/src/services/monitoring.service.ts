/**
 * Monitoring Service
 * Handles delivery risk assessment and GPS tracking
 * Note: GPS tracking fields are not in current schema - using mock data until migration
 */

import prisma from "../prisma/client";

export async function checkDeliveryRisk(shipmentIds: string[]) {
    // Fetch in-transit shipments
    const shipments = await prisma.shipment.findMany({
        where: {
            id: { in: shipmentIds },
            status: "IN_TRANSIT",
        },
        select: {
            id: true,
            referenceNumber: true,
            scheduledDropAt: true,
            originAddress: true,
            destinationAddress: true,
        },
    });

    // For now, return mock risk data since GPS fields don't exist in schema
    const assessments = shipments.map((shipment) => {
        const now = new Date();
        const scheduled = shipment.scheduledDropAt ? new Date(shipment.scheduledDropAt) : new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const timeRemaining = Math.max(0, scheduled.getTime() - now.getTime());
        const hoursRemaining = timeRemaining / (1000 * 60 * 60);

        // Mock risk assessment based on time remaining
        let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
        let estimatedDelayMins = 0;

        if (hoursRemaining < 1) {
            riskLevel = "CRITICAL";
            estimatedDelayMins = 130;
        } else if (hoursRemaining < 2) {
            riskLevel = "HIGH";
            estimatedDelayMins = 75;
        } else if (hoursRemaining < 3) {
            riskLevel = "MEDIUM";
            estimatedDelayMins = 40;
        }

        return {
            shipmentId: shipment.id,
            referenceNumber: shipment.referenceNumber,
            riskLevel,
            estimatedDelayMins,
            scheduledDelivery: scheduled.toISOString(),
            estimatedArrival: new Date(scheduled.getTime() + estimatedDelayMins * 60 * 1000).toISOString(),
            remainingDistance: riskLevel === "LOW" ? 50 : 120,
            reasons: [
                `Estimated ${estimatedDelayMins} min delay`,
                `${Math.round(hoursRemaining * 60)} min to deadline`,
            ],
        };
    });

    return assessments;
}

export async function getHighRiskShipments() {
    // Fetch in-transit shipments
    const shipments = await prisma.shipment.findMany({
        where: {
            status: "IN_TRANSIT",
        },
        select: {
            id: true,
            referenceNumber: true,
            scheduledDropAt: true,
        },
        take: 100,
    });

    // Mock assessment
    const assessments = await checkDeliveryRisk(shipments.map((s) => s.id));

    // Filter high-risk only
    const highRisk = assessments.filter((a) => a.riskLevel === "HIGH" || a.riskLevel === "CRITICAL");

    return {
        alerts: highRisk,
        count: highRisk.length,
        criticalCount: highRisk.filter((a) => a.riskLevel === "CRITICAL").length,
        highCount: highRisk.filter((a) => a.riskLevel === "HIGH").length,
    };
}

export async function updateShipmentLocation(shipmentId: string, latitude: number, longitude: number) {
    // GPS fields don't exist in current schema
    // Return mock response
    return {
        success: true,
        message: "Location update simulated (GPS fields not in schema)",
        shipmentId,
    };
}
