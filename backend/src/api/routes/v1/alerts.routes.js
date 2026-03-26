import express from "express";
import { param, query } from "express-validator";
import {
  generateSupplierContactMessage,
  getAlerts,
  getUnviewedAlertCount,
  markAlertAsViewed,
} from "../../../services/alert.service.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/v1/alerts
 * List alerts with filters
 */
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 1000 }).toInt(),
    query("status").optional().isIn(["PENDING", "SENT", "FAILED"]),
    query("shopId").optional().isString(),
    validate,
  ],
  async (req, res) => {
    try {
      // Return all alerts (users can see all alerts for their shops)
      const result = await getAlerts({
        ...req.query,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * GET /api/v1/alerts/unviewed-count
 * Get count of unviewed alerts for the authenticated user
 */
router.get("/unviewed-count", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const count = await getUnviewedAlertCount(req.user.userId);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/v1/alerts/:id/mark-viewed
 * Mark an alert as viewed
 */
router.patch(
  "/:id/mark-viewed",
  [param("id").isString(), validate],
  async (req, res) => {
    try {
      const alert = await markAlertAsViewed(req.params.id, req.user.userId);
      res.json(alert);
    } catch (error) {
      if (error.message === "Alert not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * GET /api/v1/alerts/:id/contact-supplier
 * Generate pre-filled supplier contact message for an alert
 */
router.get(
  "/:id/contact-supplier",
  [param("id").isString(), validate],
  async (req, res) => {
    try {
      const contact = await generateSupplierContactMessage(req.params.id);
      res.json(contact);
    } catch (error) {
      if (
        error.message === "Alert not found" ||
        error.message === "No supplier found for this product"
      ) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
