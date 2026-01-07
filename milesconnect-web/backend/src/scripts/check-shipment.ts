import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkShipmentWeight() {
    try {
        const shipment = await prisma.shipment.findFirst({
            where: { referenceNumber: "SHP-001" },
            select: {
                id: true,
                referenceNumber: true,
                weightKg: true,
                originAddress: true,
                destinationAddress: true,
            },
        });

        if (shipment) {
            console.log("Shipment found:");
            console.log(JSON.stringify(shipment, null, 2));
        } else {
            console.log("Shipment SHP-001 not found");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkShipmentWeight();
