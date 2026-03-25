import { PrismaClient } from "@prisma/client";
import express from "express";
import { body } from "express-validator";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

/**
 * GET /api/v1/customers/profile
 * Get authenticated customer profile
 */
router.get("/profile", async (req, res) => {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/customers/addresses
 * List delivery addresses for authenticated customer
 */
router.get("/addresses", async (req, res) => {
  try {
    const addresses = await prisma.deliveryAddress.findMany({
      where: { customerId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/customers/addresses
 * Create a new delivery address
 */
router.post(
  "/addresses",
  [
    body("label").isString().trim().notEmpty(),
    body("addressLine1").isString().trim().notEmpty(),
    body("addressLine2").optional().isString().trim(),
    body("city").isString().trim().notEmpty(),
    body("state").isString().trim().notEmpty(),
    body("postalCode").isString().trim().notEmpty(),
    body("phone").isString().trim().notEmpty(),
    validate,
  ],
  async (req, res) => {
    try {
      const address = await prisma.deliveryAddress.create({
        data: {
          customerId: req.user.userId,
          ...req.body,
        },
      });

      res.status(201).json(address);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * PUT /api/v1/customers/addresses/:id
 * Update a delivery address
 */
router.put(
  "/addresses/:id",
  [
    body("label").optional().isString().trim(),
    body("addressLine1").optional().isString().trim(),
    body("addressLine2").optional().isString().trim(),
    body("city").optional().isString().trim(),
    body("state").optional().isString().trim(),
    body("postalCode").optional().isString().trim(),
    body("phone").optional().isString().trim(),
    validate,
  ],
  async (req, res) => {
    try {
      // Check ownership
      const existing = await prisma.deliveryAddress.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) {
        return res.status(404).json({ error: "Address not found" });
      }

      if (existing.customerId !== req.user.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const address = await prisma.deliveryAddress.update({
        where: { id: req.params.id },
        data: req.body,
      });

      res.json(address);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * DELETE /api/v1/customers/addresses/:id
 * Delete a delivery address
 */
router.delete("/addresses/:id", async (req, res) => {
  try {
    // Check ownership
    const existing = await prisma.deliveryAddress.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Address not found" });
    }

    if (existing.customerId !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.deliveryAddress.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
