import express from "express";
import { body, query } from "express-validator";
import {
  adjustStock,
  getStockHistory,
  transferStock,
} from "../../../services/inventory.service.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { authenticatedLimiter } from "../../middleware/rateLimiter.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = express.Router();

// POST /api/v1/inventory/adjust - Adjust stock (add or remove)
router.post(
  "/adjust",
  authenticatedLimiter,
  authenticate,
  requireRole("OWNER", "ADMIN"),
  [
    body("productId").isUUID(),
    body("shopId").isIn(["shop1", "shop2"]),
    body("quantity")
      .isInt()
      .custom((value) => value !== 0),
    body("reason").trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const result = await adjustStock(req.body, req.user.userId);

      res.json({
        message: "Stock adjusted successfully",
        ...result,
      });
    } catch (error) {
      if (
        error.message.includes("not found") ||
        error.message.includes("Insufficient stock")
      ) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Adjust stock error:", error);
      res.status(500).json({ error: "Failed to adjust stock" });
    }
  },
);

// POST /api/v1/inventory/transfer - Transfer stock between shops
router.post(
  "/transfer",
  authenticatedLimiter,
  authenticate,
  requireRole("OWNER", "ADMIN"),
  [
    body("productId").isUUID(),
    body("fromShopId").isIn(["shop1", "shop2"]),
    body("toShopId").isIn(["shop1", "shop2"]),
    body("quantity").isInt({ min: 1 }),
    body("reason").trim().notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const result = await transferStock(req.body, req.user.userId);

      res.json({
        message: "Stock transferred successfully",
        ...result,
      });
    } catch (error) {
      if (
        error.message.includes("not found") ||
        error.message.includes("Insufficient stock") ||
        error.message.includes("same shop")
      ) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Transfer stock error:", error);
      res.status(500).json({ error: "Failed to transfer stock" });
    }
  },
);

// GET /api/v1/inventory/history/:productId - Get stock history
router.get(
  "/history/:productId",
  authenticatedLimiter,
  authenticate,
  [
    query("shopId").optional().isIn(["shop1", "shop2"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res) => {
    try {
      const filters = {
        shopId: req.query.shopId,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
      };

      const result = await getStockHistory(req.params.productId, filters);
      res.json(result);
    } catch (error) {
      console.error("Get stock history error:", error);
      res.status(500).json({ error: "Failed to fetch stock history" });
    }
  },
);

export default router;
