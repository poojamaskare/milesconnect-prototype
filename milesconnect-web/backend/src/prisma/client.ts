import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

import { registerAuditMiddleware } from "../middleware/audit.middleware";

const prisma = globalThis.__prismaClient ?? new PrismaClient();

// Register Audit Middleware
registerAuditMiddleware(prisma);

if (process.env.NODE_ENV !== "production") {
  globalThis.__prismaClient = prisma;
}

export default prisma;
export { prisma };
