import express from "express";
import { body, param, query } from "express-validator";
import {
    cancelOrder,
    createOrder,
    getOrderById,
    getOrders,
    updateOrderStatus,
} from "../../../services/order.service.js";
import {
    createRazorpayOrder,
    handlePaymentFailure,
    handlePaymentSuccess,
    updatePaymentWithRazorpayOrder,
} from "../../../services/payment.service.js";
import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = express.Router();

/**
 * POST /api/v1/orders
 * Create a new order
 */
router.post(
  "/",
  [
    authenticate,
    body("items").isArray({ min: 1 }),
    body("items.*.productId").isString(),
    body("items.*.quantity").isInt({ min: 1 }),
    body("items.*.price").isFloat({ min: 0 }),
    body("deliveryAddressId").isString(),
    body("paymentMethod").isIn(["RAZORPAY", "COD"]),
    body("notes").optional().isString(),
    validate,
  ],
  async (req, res) => {
    try {
      const { order, payment } = await createOrder({
        ...req.body,
        customerId: req.user.userId,
      });

      // If payment method is Razorpay, create Razorpay order
      if (req.body.paymentMethod === "RAZORPAY") {
        const razorpayOrder = await createRazorpayOrder(order.id, order.total);
        await updatePaymentWithRazorpayOrder(payment.id, razorpayOrder.id);

        res.status(201).json({
          order,
          payment: {
            ...payment,
            razorpayOrderId: razorpayOrder.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
          },
        });
      } else {
        // COD - confirm order immediately
        await updateOrderStatus(order.id, "PROCESSING");
        res.status(201).json({ order, payment });
      }
    } catch (error) {
      res.status(error.message.includes("Insufficient") ? 400 : 500).json({
        error: error.message,
      });
    }
  },
);

/**
 * GET /api/v1/orders
 * List orders with filters
 */
router.get(
  "/",
  [
    authenticate,
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("status")
      .optional()
      .isIn([
        "RECEIVED",
        "PROCESSING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ]),
    validate,
  ],
  async (req, res) => {
    try {
      // Customers can only see their own orders
      // Admins/Owners can see all orders
      const filters = { ...req.query };
      if (req.user.role === "CUSTOMER") {
        filters.customerId = req.user.userId;
      }

      const result = await getOrders(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * GET /api/v1/orders/:id
 * Get order by ID
 */
router.get(
  "/:id",
  [authenticate, param("id").isString(), validate],
  async (req, res) => {
    try {
      const order = await getOrderById(req.params.id);

      // Access control: customers can only view their own orders
      if (
        req.user.role === "CUSTOMER" &&
        order.customerId !== req.user.userId
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(order);
    } catch (error) {
      if (error.message === "Order not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * PATCH /api/v1/orders/:id/status
 * Update order status (Admin/Owner only)
 */
router.patch(
  "/:id/status",
  [
    requireRole("OWNER", "ADMIN"),
    param("id").isString(),
    body("status").isIn([
      "RECEIVED",
      "PROCESSING",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ]),
    validate,
  ],
  async (req, res) => {
    try {
      const order = await updateOrderStatus(req.params.id, req.body.status);
      res.json(order);
    } catch (error) {
      if (error.message === "Order not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  },
);

/**
 * POST /api/v1/orders/:id/cancel
 * Cancel order
 */
router.post(
  "/:id/cancel",
  [authenticate, param("id").isString(), validate],
  async (req, res) => {
    try {
      const order = await getOrderById(req.params.id);

      // Access control: customers can only cancel their own orders
      if (
        req.user.role === "CUSTOMER" &&
        order.customerId !== req.user.userId
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      const cancelled = await cancelOrder(req.params.id);
      res.json(cancelled);
    } catch (error) {
      if (error.message === "Order not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  },
);

/**
 * POST /api/v1/orders/payment/webhook
 * Razorpay payment webhook
 */
router.post("/payment/webhook", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status,
      reason,
    } = req.body;

    if (status === "failed") {
      await handlePaymentFailure(razorpay_order_id, reason || "Payment failed");
      return res.json({ status: "ok" });
    }

    const result = await handlePaymentSuccess(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    res.json({ status: "ok", order: result.order });
  } catch (error) {
    console.error("Payment webhook error:", error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
