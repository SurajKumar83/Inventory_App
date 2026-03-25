import "dotenv/config";
import cron from "node-cron";
import app from "./api/app.js";
import prisma from "./config/database.js";
import { runAlertChecker } from "./jobs/alertChecker.job.js";

const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
});

// Test database connection
prisma
  .$connect()
  .then(() => console.log("✅ Database connected"))
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
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
