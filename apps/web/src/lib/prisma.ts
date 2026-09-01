import { createPrismaClient } from "@amavie/database";

declare global {
  var globalPrisma: undefined | ReturnType<typeof createPrismaClient>;
}

const prisma = globalThis.globalPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.globalPrisma = prisma;
}

export default prisma;
