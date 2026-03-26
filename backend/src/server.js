import "dotenv/config";
import cron from "node-cron";
import app from "./api/app.js";
import prisma from "./config/database.js";
import { runAlertChecker } from "./jobs/alertChecker.job.js";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0"; // Bind to 0.0.0.0 for Railway

// Check for required environment variables
const requiredEnvVars = ["DATABASE_URL"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingEnvVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error("\n📝 Please set these variables in Railway dashboard:");
  console.error("   1. Go to your Railway project");
  console.error("   2. Select your service");
  console.error("   3. Click 'Variables' tab");
  console.error("   4. Add the missing variables");
  console.error("\n💡 See backend/.env.railway for a complete list\n");

  // In production, allow server to start but mark as unhealthy
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "⚠️  Starting server in degraded mode - health check will fail",
    );
  } else {
    process.exit(1);
  }
}

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔗 API: http://${HOST}:${PORT}/api/v1`);
});

// Test database connection (non-blocking)
prisma
  .$connect()
  .then(() => console.log("✅ Database connected"))
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    // Don't exit immediately in production - allow health checks to respond
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  });

// Background job: Check for low-stock alerts every 30 seconds
// Phase 4: User Story 2 - Low-Stock Alerts
cron.schedule("*/30 * * * * *", async () => {
  await runAlertChecker();
});

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🔄 Shutting down gracefully...");

  server.close(() => {
    console.log("✅ HTTP server closed");
  });

  await prisma.$disconnect();
  console.log("✅ Database disconnected");

  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  shutdown();
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  shutdown();
});
