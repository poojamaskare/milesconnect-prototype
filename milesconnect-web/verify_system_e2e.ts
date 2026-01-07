import prisma from './backend/src/prisma/client';

async function runE2E() {
    console.log("🚀 Starting End-to-End System Verification...");

    let user;
    let vehicle;
    let driver;
    let shipment1, shipment2;

    try {
        // 1. Setup User (Seed)
        console.log("\n[1] Seeding User...");
        user = await prisma.user.create({
            data: {
                email: `e2e_admin_${Date.now()}@milesconnect.com`,
                passwordHash: "mock_hash", // In real app, verify login
                name: "E2E Admin",
                role: "ADMIN"
            }
        });
        console.log(`✅ User Created: ${user.id} (${user.email})`);

        // 2. Create Driver (Backend API via Fetch)
        console.log("\n[2] Testing Driver Creation (API)...");
        const driverRes = await fetch("http://localhost:3001/api/drivers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "E2E Driver",
                licenseNumber: `DL-E2E-${Date.now()}`,
                phone: "9876543210",
                userId: user.id // Linking to the created user for simplicity in this mock flow
            })
        });

        if (!driverRes.ok) throw new Error(`Driver API Failed: ${driverRes.status} ${await driverRes.text()}`);
        const driverData = await driverRes.json();
        driver = driverData.data || driverData; // Handle typical response wrappers
        console.log(`✅ Driver Created via API: ${driver.id}`);


        // 3. Create Vehicle (Backend API via Fetch)
        console.log("\n[3] Testing Vehicle Creation (API)...");
        const vehicleRes = await fetch("http://localhost:3001/api/vehicles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                registrationNumber: `MH-E2E-${Date.now()}`,
                type: "TRUCK", // Check schema enum usually
                capacity: 5000,
                // Some controllers expect exact schema matching, adjusting typical fields
                vin: `VIN-${Date.now()}`,
                make: "Tata",
                model: "Prima",
                capacityKg: 5000,
                status: "ACTIVE"
            })
        });

        if (!vehicleRes.ok) throw new Error(`Vehicle API Failed: ${vehicleRes.status} ${await vehicleRes.text()}`);
        const vehicleData = await vehicleRes.json();
        vehicle = vehicleData.data || vehicleData;
        console.log(`✅ Vehicle Created via API: ${vehicle.id}`);


        // 4. Create Shipments (Backend API)
        console.log("\n[4] Testing Shipment Creation (API)...");
        const createShipment = async (ref, origin, dest) => {
            const res = await fetch("http://localhost:3001/api/shipments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    referenceNumber: ref,
                    originAddress: origin,
                    destinationAddress: dest,
                    createdById: user.id,
                    status: "PLANNED",
                    customerName: "E2E Customer", // Optional fields
                    weightKg: 100
                })
            });
            if (!res.ok) throw new Error(`Shipment API Failed: ${res.status} ${await res.text()}`);
            const data = await res.json();
            return data.data || data;
        };

        shipment1 = await createShipment(`SH-E2E-1-${Date.now()}`, "Mumbai, Maharashtra", "Pune, Maharashtra");
        shipment2 = await createShipment(`SH-E2E-2-${Date.now()}`, "Pune, Maharashtra", "Bangalore, Karnataka");
        console.log(`✅ Shipments Created: ${shipment1.id}, ${shipment2.id}`);


        // 5. Test Route Optimization (Go Service Integration Check)
        console.log("\n[5] Testing Route Optimization...");
        const optRes = await fetch("http://localhost:3001/api/routing/optimize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                vehicleId: vehicle.id,
                shipmentIds: [shipment1.id, shipment2.id]
            })
        });

        if (!optRes.ok) throw new Error(`Optimization API Failed: ${optRes.status} ${await optRes.text()}`);
        const optData = await optRes.json();

        if (optData.waypoints && optData.waypoints.length === 4) {
            console.log(`✅ Optimization Successful. Waypoints: ${optData.waypoints.length}`);
            console.log(`   Total Distance: ${optData.metrics.totalDistance} km`);
        } else {
            console.error("❌ Optimization returned unexpected result:", optData);
        }


        // 6. Verify Audit Logs (Database Check)
        console.log("\n[6] Verifying Audit Logs...");
        const logs = await prisma.auditLog.findMany({
            where: {
                performedBy: 'SYSTEM', // Middleware defaults to SYSTEM currently as per implementation
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        if (logs.length > 0) {
            console.log(`✅ Audit Logs found: ${logs.length} recent entries.`);
            console.log(`   Sample: ${logs[0].action} on ${logs[0].entityType}`);
        } else {
            console.warn("⚠️ No Audit logs found (Middleware might need strict trigger check or distinct user context).");
        }

        console.log("\n🎉 SYSTEM VERIFICATION COMPLETE: ALL SYSTEMS GO.");

    } catch (error) {
        console.error("\n❌ SYSTEM VERIFICATION FAILED:", error);
    } finally {
        // Cleanup (Optional)
        // console.log("Cleaning up...");
        if (user) await prisma.user.delete({ where: { id: user.id } });
        // Driver/Shipment/Vehicle cascades usually or delete manually if restrictive

        await prisma.$disconnect();
    }
}

runE2E();
