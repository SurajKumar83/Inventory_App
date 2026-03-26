import express from "express";
import * as dashboardService from "../../../services/dashboard.service.js";

const router = express.Router();

/**
 * GET /api/v1/dashboard/stats
 * Get real-time dashboard statistics
 * Auth: Required (admin only)
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      error: "Failed to fetch dashboard statistics",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

export default router;
