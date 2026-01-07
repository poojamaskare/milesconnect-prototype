import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Audit Middleware for Prisma
 * Automatically logs all changes to tracked models
 */
export function registerAuditMiddleware(prisma: PrismaClient) {
    prisma.$use(async (params, next) => {
        // Determine the action type
        const action = params.action;

        // Only log write operations
        if (
            action === 'create' ||
            action === 'update' ||
            action === 'delete' ||
            action === 'upsert' ||
            action === 'createMany' ||
            action === 'updateMany' ||
            action === 'deleteMany'
        ) {
            // Skip logging for the AuditLog model itself to avoid infinite loops
            if (params.model === 'AuditLog') {
                return next(params);
            }

            const model = params.model;
            const before = Date.now();

            try {
                // Execute the original query
                const result = await next(params);

                // Calculate duration (optional metric)
                const after = Date.now();
                const duration = after - before;

                // Log the action to the AuditLog table
                // We use a separate try-catch to ensure logging failure doesn't block the main operation
                try {
                    // Determine entity ID based on action
                    let entityId = 'UNKNOWN';

                    if (result && typeof result === 'object') {
                        if ('id' in result) {
                            entityId = result.id;
                        } else if ('count' in result) {
                            entityId = `${result.count} records`;
                        }
                    }

                    // Prepare changes payload
                    const changes = JSON.stringify({
                        args: params.args,
                        result: action === 'delete' ? 'DELETED' : 'AFFECTED'
                    });

                    // Write to AuditLog
                    // NOTE: We're using the same prisma instance but ensuring we don't trigger middleware again
                    // The check `params.model === 'AuditLog'` handles this recursion
                    await prisma.auditLog.create({
                        data: {
                            action: action.toUpperCase(),
                            entityType: model || 'UNKNOWN',
                            entityId: String(entityId),
                            changes: changes,
                            performedBy: 'SYSTEM', // TODO: Enhance to capture actual user ID from context
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

    console.log("Audit middleware registered successfully");
}
