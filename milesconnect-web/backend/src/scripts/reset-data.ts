
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting data cleanup...");

    // 1. Delete TripSheets (which depend on Drivers and Vehicles)
    // TripExpenses and FuelStops cascade if configured in DB, but safe to delete explicit or rely on cascade.
    // TripSheetShipment cascades.
    console.log("Deleting TripSheetShipments...");
    await prisma.tripSheetShipment.deleteMany({});

    console.log("Deleting FuelStops & TripExpenses...");
    await prisma.fuelStop.deleteMany({});
    await prisma.tripExpense.deleteMany({});

    console.log("Deleting TripSheets...");
    await prisma.tripSheet.deleteMany({});

    // 2. Delete Invoices and Payments (Invoice depends on Shipment)
    console.log("Deleting Payments...");
    await prisma.payment.deleteMany({});

    console.log("Deleting Invoices...");
    await prisma.invoice.deleteMany({});

    // 3. Delete Shipments
    console.log("Deleting Documents linked to Shipments/Invoices/Drivers (optional cleanup)...");
    // Documents cascade often, but let's be safe
    await prisma.document.deleteMany({});

    console.log("Deleting Shipments...");
    await prisma.shipment.deleteMany({});

    // 4. Update Vehicles to remove Primary Driver links (if not SetNull automatically)
    // Actually schema says onDelete: SetNull for Vehicle->primaryDriver. 
    // But Driver -> Vehicle (VehiclePrimaryDriver) is the relation.
    // We can just delete drivers.

    console.log("Deleting Drivers...");
    await prisma.driver.deleteMany({});

    console.log("Cleanup complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
