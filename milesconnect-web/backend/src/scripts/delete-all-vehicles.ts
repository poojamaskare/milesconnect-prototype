import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllVehicles() {
    try {
        console.log("Starting vehicle deletion process...");

        // Delete in order to respect foreign key constraints

        // 1. Delete all documents related to vehicles
        const deletedDocuments = await prisma.document.deleteMany({
            where: { vehicleId: { not: null } },
        });
        console.log(`✓ Deleted ${deletedDocuments.count} vehicle documents`);

        // 2. Update shipments to remove vehicle references
        const updatedShipments = await prisma.shipment.updateMany({
            where: { vehicleId: { not: null } },
            data: { vehicleId: null },
        });
        console.log(`✓ Cleared vehicle references from ${updatedShipments.count} shipments`);

        // 3. Update trip sheets to remove vehicle references (if any are using vehicles)
        // Note: Trip sheets have vehicleId as required, so we can't just null them
        // We need to delete trip sheets that reference vehicles
        const tripSheetsWithVehicles = await prisma.tripSheet.findMany({
            select: { id: true },
        });

        if (tripSheetsWithVehicles.length > 0) {
            // Delete trip sheet related data first
            await prisma.tripSheetShipment.deleteMany({
                where: { tripSheetId: { in: tripSheetsWithVehicles.map(ts => ts.id) } },
            });
            await prisma.fuelStop.deleteMany({
                where: { tripSheetId: { in: tripSheetsWithVehicles.map(ts => ts.id) } },
            });
            await prisma.tripExpense.deleteMany({
                where: { tripSheetId: { in: tripSheetsWithVehicles.map(ts => ts.id) } },
            });

            // Delete trip sheets
            const deletedTripSheets = await prisma.tripSheet.deleteMany({});
            console.log(`✓ Deleted ${deletedTripSheets.count} trip sheets`);
        }

        // 4. Delete all vehicles
        const deletedVehicles = await prisma.vehicle.deleteMany({});
        console.log(`✓ Deleted ${deletedVehicles.count} vehicles`);

        console.log("\n✅ All vehicles deleted successfully!");
    } catch (error) {
        console.error("❌ Error deleting vehicles:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllVehicles()
    .then(() => {
        console.log("\nScript completed.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });
