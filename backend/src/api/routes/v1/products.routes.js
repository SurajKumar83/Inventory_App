import express from "express";
import { body, query } from "express-validator";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "../../../services/product.service.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { authenticatedLimiter } from "../../middleware/rateLimiter.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = express.Router();

// GET /api/v1/products - List all products
router.get(
  "/",
  authenticatedLimiter,
  authenticate,
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().trim(),
    query("category")
      .optional()
      .isIn([
        "STAPLES",
        "FRESH_PRODUCE",
        "DAIRY",
        "PACKAGED_GOODS",
        "SPICES",
        "PERSONAL_CARE",
        "OTHER",
      ]),
    query("isActive").optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search,
        category: req.query.category,
        isActive:
          req.query.isActive !== undefined
            ? req.query.isActive === "true"
            : true,
      };

      const result = await getAllProducts(filters);
      res.json(result);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  },
);

// GET /api/v1/products/:id - Get product by ID
router.get("/:id", authenticatedLimiter, authenticate, async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    res.json(product);
  } catch (error) {
    if (error.message === "Product not found") {
      return res.status(404).json({ error: error.message });
    }
    console.error("Get product error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST /api/v1/products - Create new product
router.post(
  "/",
  authenticatedLimiter,
  authenticate,
  requireRole("OWNER", "ADMIN"),
  [
    body("sku").trim().notEmpty(),
    body("name").trim().notEmpty(),
    body("description").optional().trim(),
    body("category").isIn([
      "STAPLES",
      "FRESH_PRODUCE",
      "DAIRY",
      "PACKAGED_GOODS",
      "SPICES",
      "PERSONAL_CARE",
      "OTHER",
    ]),
    body("price").isFloat({ min: 0 }),
    body("unit").isIn(["KG", "LITER", "PIECE", "PACKET"]),
    body("imageUrls").optional().isArray(),
    body("initialStock").optional().isObject(),
  ],
  validate,
  async (req, res) => {
    try {
      const { initialStock, ...productData } = req.body;

      const product = await createProduct(productData, initialStock);

      res.status(201).json({
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      if (error.message === "Product with this SKU already exists") {
        return res.status(409).json({ error: error.message });
      }
      console.error("Create product error:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  },
);

// PUT /api/v1/products/:id - Update product
router.put(
  "/:id",
  authenticatedLimiter,
  authenticate,
  requireRole("OWNER", "ADMIN"),
  [
    body("name").optional().trim().notEmpty(),
    body("description").optional().trim(),
    body("category")
      .optional()
      .isIn([
        "STAPLES",
        "FRESH_PRODUCE",
        "DAIRY",
        "PACKAGED_GOODS",
        "SPICES",
        "PERSONAL_CARE",
        "OTHER",
      ]),
    body("price").optional().isFloat({ min: 0 }),
    body("unit").optional().isIn(["KG", "LITER", "PIECE", "PACKET"]),
    body("imageUrls").optional().isArray(),
    body("isActive").optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const product = await updateProduct(
        req.params.id,
        req.body,
        req.user.userId,
      );

      res.json({
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      if (error.message === "Product not found") {
        return res.status(404).json({ error: error.message });
      }
      console.error("Update product error:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  },
);

// DELETE /api/v1/products/:id - Soft delete product
router.delete(
  "/:id",
  authenticatedLimiter,
  authenticate,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    try {
      const result = await deleteProduct(req.params.id, req.user.userId);
      res.json(result);
    } catch (error) {
      if (error.message === "Product not found") {
        return res.status(404).json({ error: error.message });
      }
      console.error("Delete product error:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  },
);

export default router;
