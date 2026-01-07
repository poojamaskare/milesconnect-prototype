const { PrismaClient } = require('@prisma/client');

// --- Middleware Logic (Copy of audit.middleware.ts) ---
function registerAuditMiddleware(prisma) {
    prisma.$use(async (params, next) => {
        const action = params.action;
        if (
            action === 'create' ||
            action === 'update' ||
            action === 'delete' ||
            action === 'upsert' ||
            action === 'createMany' ||
            action === 'updateMany' ||
            action === 'deleteMany'
        ) {
            if (params.model === 'AuditLog') return next(params);

            const model = params.model;
            try {
                const result = await next(params);
                try {
                    let entityId = 'UNKNOWN';
                    if (result && typeof result === 'object') {
                        if ('id' in result) entityId = result.id;
                        else if ('count' in result) entityId = `${result.count} records`;
                    }
                    const changes = JSON.stringify({
                        args: params.args,
                        result: action === 'delete' ? 'DELETED' : 'AFFECTED'
                    });
                    await prisma.auditLog.create({
                        data: {
                            action: action.toUpperCase(),
                            entityType: model || 'UNKNOWN',
                            entityId: String(entityId),
                            changes: changes,
                            performedBy: 'SYSTEM',
                        }
                    });
                } catch (logError) {
                    console.error("Failed to write audit log:", logError);
                }
                return result;
            } catch (error) {
                throw error;
            }
        }
        return next(params);
    });
}

// --- Verification Logic ---
const prisma = new PrismaClient();
registerAuditMiddleware(prisma);

async function testAuditLog() {
    console.log("Starting Audit Log Test (Standalone)...");
    try {
        console.log("Creating vehicle...");
        const vehicle = await prisma.vehicle.create({
            data: { registrationNumber: `AUDIT-TEST-SA-${Date.now()}`, name: "Audit SA" }
        });

        console.log("Updating vehicle...");
        await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: { capacityKg: 7000 }
        });

        console.log("Deleting vehicle...");
        await prisma.vehicle.delete({
            where: { id: vehicle.id }
        });

        console.log("Verifying logs...");
        const logs = await prisma.auditLog.findMany({
            where: { entityId: vehicle.id },
            orderBy: { createdAt: 'asc' }
        });

        if (logs.length >= 3) {
            console.log("✅ SUCCESS: Audit logs created.");
            logs.forEach(l => console.log(`- [${l.action}] ${l.entityType}`));
        } else {
            console.error("❌ FAILURE: Found " + logs.length + " logs.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

testAuditLog();
