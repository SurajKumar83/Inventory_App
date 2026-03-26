import express from "express";
import { body, param, query } from "express-validator";
import {
    createSupplier,
    deleteSupplier,
    getAllSuppliers,
    getSupplierById,
    linkProducts,
    updateSupplier,
} from "../../../services/supplier.service.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/v1/suppliers
 * List all suppliers with pagination and search
 */
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("search").optional().isString().trim(),
    query("isActive").optional().isBoolean().toBoolean(),
    validate,
  ],
  async (req, res) => {
    try {
      const result = await getAllSuppliers(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * GET /api/v1/suppliers/:id
 * Get supplier by ID
 */
router.get("/:id", [param("id").isString(), validate], async (req, res) => {
  try {
    const supplier = await getSupplierById(req.params.id);
    res.json(supplier);
  } catch (error) {
    if (error.message === "Supplier not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/suppliers
 * Create a new supplier (OWNER/ADMIN only)
 */
router.post(
  "/",
  [
    requireRole("OWNER", "ADMIN"),
    body("businessName").isString().trim().notEmpty(),
    body("contactPerson").isString().trim().notEmpty(),
    body("email").optional().isEmail().normalizeEmail(),
    body("phone").isString().trim().notEmpty(),
    body("whatsappNumber").optional().isString().trim(),
    body("address").optional().isString().trim(),
    body("paymentTerms").optional().isString().trim(),
    body("leadTimeDays").optional().isInt({ min: 0 }),
    validate,
  ],
  async (req, res) => {
    try {
      const supplier = await createSupplier(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      if (error.message.includes("already exists")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * PUT /api/v1/suppliers/:id
 * Update a supplier (OWNER/ADMIN only)
 */
router.put(
  "/:id",
  [
    requireRole("OWNER", "ADMIN"),
    param("id").isString(),
    body("businessName").optional().isString().trim().notEmpty(),
    body("contactPerson").optional().isString().trim(),
    body("email").optional().isEmail().normalizeEmail(),
    body("phone").optional().isString().trim(),
    body("whatsappNumber").optional().isString().trim(),
    body("address").optional().isString().trim(),
    body("paymentTerms").optional().isString().trim(),
    body("leadTimeDays").optional().isInt({ min: 0 }),
    body("isActive").optional().isBoolean(),
    validate,
  ],
  async (req, res) => {
    try {
      const supplier = await updateSupplier(req.params.id, req.body);
      res.json(supplier);
    } catch (error) {
      if (error.message === "Supplier not found") {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes("already exists")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * DELETE /api/v1/suppliers/:id
 * Soft delete a supplier (OWNER/ADMIN only)
 */
router.delete(
  "/:id",
  [requireRole("OWNER", "ADMIN"), param("id").isString(), validate],
  async (req, res) => {
    try {
      const supplier = await deleteSupplier(req.params.id);
      res.json(supplier);
    } catch (error) {
      if (error.message === "Supplier not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * POST /api/v1/suppliers/:id/products
 * Link products to a supplier (OWNER/ADMIN only)
 */
router.post(
  "/:id/products",
  [
    requireRole("OWNER", "ADMIN"),
    param("id").isString(),
    body("productIds").isArray(),
    body("productIds.*").isString(),
    validate,
  ],
  async (req, res) => {
    try {
      const supplier = await linkProducts(req.params.id, req.body.productIds);
      res.json(supplier);
    } catch (error) {
      if (error.message === "Supplier not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },
);

export default router;
