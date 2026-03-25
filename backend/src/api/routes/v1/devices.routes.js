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
 * POST /api/v1/devices/register
 * Register or update device push token for the authenticated user
 */
router.post(
  "/register",
  [body("pushToken").isString().notEmpty(), validate],
  async (req, res) => {
    try {
      const { pushToken } = req.body;

      // Update the user's push token
      const user = await prisma.user.update({
        where: { id: req.user.userId },
        data: { pushToken },
        select: {
          id: true,
          email: true,
          pushToken: true,
        },
      });

      res.json({
        message: "Device registered successfully",
        user: {
          id: user.id,
          email: user.email,
          pushToken: user.pushToken,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * DELETE /api/v1/devices/unregister
 * Remove push token from the authenticated user
 */
router.delete("/unregister", async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { pushToken: null },
      select: {
        id: true,
        email: true,
      },
    });

    res.json({
      message: "Device unregistered successfully",
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
