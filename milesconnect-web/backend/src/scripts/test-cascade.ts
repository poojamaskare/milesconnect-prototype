
import { PrismaClient, ShipmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Interconnected Logic Verification...');

    // 1. Setup Data
    const email = `admin-${Date.now()}@test.com`;
    const admin = await prisma.user.create({
        data: {
            email,
            name: 'Test Admin',
            passwordHash: 'hash',
            role: 'ADMIN',
        }
    });
    console.log('✅ Admin created:', admin.id);

    const driverUser = await prisma.user.create({
        data: {
            email: `driver-${Date.now()}@test.com`,
            name: 'Test Driver',
            passwordHash: 'hash',
            role: 'DRIVER',
        }
    });

    const driver = await prisma.driver.create({
        data: {
            userId: driverUser.id,
            licenseNumber: `LIC-${Date.now()}`,
            isActive: true,
        }
    });
    console.log('✅ Driver created:', driver.id);

    const vehicle = await prisma.vehicle.create({
        data: {
            registrationNumber: `VEH-${Date.now()}`,
            status: 'ACTIVE',
            name: 'Test Truck'
        }
    });
    console.log('✅ Vehicle created:', vehicle.id);

    // 2. Create Shipment
    const shipment = await prisma.shipment.create({
        data: {
            referenceNumber: `REF-${Date.now()}`,
            originAddress: 'A',
            destinationAddress: 'B',
            status: 'DRAFT',
            createdById: admin.id,
            weightKg: 1000
        }
    });
    console.log('✅ Shipment created:', shipment.id);

    // Verify Initial Availability
    // Driver Availability Check (Logic is in Controller, but we can simulate the query logic)
    // Logic: isAvailable = isActive && !activeShipment && !onTrip
    let activeShipment = await prisma.shipment.findFirst({ where: { driverId: driver.id, status: 'IN_TRANSIT' } });
    if (activeShipment) throw new Error('Driver should not have active shipment');
    console.log('✅ Driver initially available (Verified by query)');

    // 3. Move to IN_TRANSIT (Assign Driver/Vehicle)
    // Call the controller logic? No, we can't easily call controller middleware.
    // We will call the DB update directly BUT usually controller handles the transaction logic.
    // CRITICAL: The "Cascade" logic is inside ShipmentController.updateShipmentStatus transaction.
    // To test the logic *implemented in the controller*, we should ideally call the controller function or test the transaction logic.
    // Since we can't invoke the controller easily without express req/res mock, I will simulate the logic 
    // OR better: I will bypass the controller and trust my code? No. 

    // Actually, I can mock Req/Res and call the controller!
    // This is the best way to verify the ACTUAL INTERCONNECTED LOGIC.

    const { updateShipmentStatus } = require('../controllers/shipment.controller');

    const reqMock = {
        params: { id: shipment.id },
        body: {
            status: 'IN_TRANSIT',
            driverId: driver.id,
            vehicleId: vehicle.id,
            scheduledPickupAt: new Date().toISOString()
        }
    };

    const resMock = {
        status: (code: number) => ({
            json: (body: any) => {
                console.log(`[API ${code}]`, body.success ? 'Success' : body.error);
                if (!body.success) {
                    console.error(body);
                    // process.exit(1); // Don't exit, let's see
                }
                return body;
            }
        })
    };

    console.log('🔄 Calling updateShipmentStatus -> IN_TRANSIT...');
    await updateShipmentStatus(reqMock as any, resMock as any);

    // 4. Verify BUSY status
    // Driver check from DB
    activeShipment = await prisma.shipment.findFirst({ where: { driverId: driver.id, status: 'IN_TRANSIT' } });
    if (!activeShipment) throw new Error('Driver should have active shipment now');
    console.log('✅ Driver status logic: BUSY (Verified via active shipment existence)');

    // 5. Move to DELIVERED
    console.log('🔄 Calling updateShipmentStatus -> DELIVERED...');
    reqMock.body = { status: 'DELIVERED', driverId: undefined, vehicleId: undefined } as any; // Just status update
    await updateShipmentStatus(reqMock as any, resMock as any);

    // 6. Verify Deliverables
    // A) Driver Available
    activeShipment = await prisma.shipment.findFirst({ where: { driverId: driver.id, status: 'IN_TRANSIT' } });
    if (activeShipment) throw new Error('Driver should NOT have active shipment');
    console.log('✅ Driver Release: SUCCESS');

    // B) Invoice Generated
    const invoice = await prisma.invoice.findFirst({ where: { shipmentId: shipment.id } });
    if (!invoice) throw new Error('Invoice was not generated!');
    console.log('✅ Invoice Generation: SUCCESS', invoice.invoiceNumber, invoice.totalCents);

    // C) Metadata Check (Controller should return meta)
    // (Captured in console logs)

    console.log('🎉 ALL INTEGRATION TESTS PASSED');
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
