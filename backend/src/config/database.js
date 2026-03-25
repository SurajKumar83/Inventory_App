import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// Prisma middleware for audit logging
prisma.$use(async (params, next) => {
  const result = await next(params);

  // Auto-create audit logs for Stock mutations
  if (
    params.model === "Stock" &&
    ["create", "update", "delete"].includes(params.action)
  ) {
    // Audit log creation happens in the service layer
    // This middleware just logs the operation for debugging
    console.log(`[AUDIT] Stock ${params.action}:`, params.args);
  }

  return result;
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
