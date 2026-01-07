const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAuditLog() {
    console.log("Starting Audit Log Test...");

    try {
        console.log("Checking database connection...");
        const count = await prisma.auditLog.count();
        console.log(`Current AuditLog count: ${count}`);

        console.log("Creating a test vehicle...");
        const vehicle = await prisma.vehicle.create({
            data: {
                registrationNumber: `AUDIT-TEST-${Date.now()}`,
                name: "Audit Test Vehicle",
            }
        });
        console.log(`Created Vehicle ID: ${vehicle.id}`);

        console.log("Updating test vehicle...");
        await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: {
                capacityKg: 5000
            }
        });

        console.log("Deleting test vehicle...");
        await prisma.vehicle.delete({
            where: { id: vehicle.id }
        });

        console.log("Verifying logs...");
        const logs = await prisma.auditLog.findMany({
            where: {
                entityId: vehicle.id
            },
            orderBy: { createdAt: 'asc' }
        });

        console.log(`Found ${logs.length} audit logs for entity ${vehicle.id}`);

        if (logs.length >= 3) {
            console.log("✅ SUCCESS: Audit logs found for CREATE, UPDATE, and DELETE.");
            logs.forEach(log => {
                console.log(`- [${log.action}] ${log.entityType} (${log.createdAt.toISOString()})`);
            });
        } else {
            console.error("❌ FAILURE: Missing audit logs. Found:", logs);
        }

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testAuditLog();
