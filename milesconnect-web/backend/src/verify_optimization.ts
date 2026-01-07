import prisma from './prisma/client';
import { optimizeTripSheetRoute } from './services/routing.service';
import { getCoordinates } from './utils/distanceCalculator';

async function testOptimization() {
    console.log("Starting Optimization Integration Test...");

    // 1. Setup Test Data
    const vehicle = await prisma.vehicle.create({
        data: {
            registrationNumber: "OPT-TEST-01",
            name: "Optimization Test Truck",
            status: "ACTIVE"
        }
    });
    console.log("Created vehicle:", vehicle.id);

    // Create 3 shipments (Mumbai -> Pune -> Bangalore)
    // Locations are approximate
    const s1 = await prisma.shipment.create({
        data: {
            referenceNumber: `OPT-S1-${Date.now()}`,
            originAddress: "Mumbai, Maharashtra",
            destinationAddress: "Pune, Maharashtra",
            createdById: (await prisma.user.findFirstOrThrow()).id, // Grab any user (assuming one exists from seed/previous)
            status: "PLANNED"
        }
    });

    const s2 = await prisma.shipment.create({
        data: {
            referenceNumber: `OPT-S2-${Date.now()}`,
            originAddress: "Pune, Maharashtra",
            destinationAddress: "Bangalore, Karnataka",
            createdById: s1.createdById,
            status: "PLANNED"
        }
    });

    console.log("Created shipments:", [s1.id, s2.id]);

    try {
        // 2. Call Optimization
        console.log("Calling optimizeTripSheetRoute...");
        const result = await optimizeTripSheetRoute(vehicle.id, [s1.id, s2.id]);

        console.log("Optimization Result:", JSON.stringify(result, null, 2));

        // 3. Assertions
        if (result.waypoints.length === 4) { // 2 pickups + 2 drops
            console.log("✅ API returned correct number of waypoints");
        } else {
            console.error("❌ API returned incorrect waypoints count:", result.waypoints.length);
        }

        if (result.isValid) {
            console.log("✅ Route is valid");
        } else {
            console.error("❌ Route invalid:", result.errors);
        }

        // Check if metrics are populated
        if (result.metrics.totalDistance > 0 && result.metrics.totalTime > 0) {
            console.log(`✅ Metrics calculated: ${result.metrics.totalDistance} km, ${result.metrics.totalTime} mins`);
        } else {
            console.error("❌ Metrics are empty");
        }

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        // Cleanup
        await prisma.shipment.deleteMany({ where: { id: { in: [s1.id, s2.id] } } });
        await prisma.vehicle.delete({ where: { id: vehicle.id } });
        await prisma.$disconnect();
    }
}

testOptimization();
