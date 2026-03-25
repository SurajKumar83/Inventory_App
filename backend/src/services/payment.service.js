import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import Razorpay from "razorpay";

const prisma = new PrismaClient();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret",
});

/**
 * Create Razorpay order
 */
const createRazorpayOrder = async (orderId, amount) => {
  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: orderId,
      notes: {
        orderId,
      },
    });

    return razorpayOrder;
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    throw new Error("Failed to create payment order");
  }
};

/**
 * Verify Razorpay payment signature
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const text = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret")
    .update(text)
    .digest("hex");

  return generatedSignature === signature;
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
) => {
  return await prisma.$transaction(async (tx) => {
    // Verify signature
    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );

    if (!isValid) {
      throw new Error("Invalid payment signature");
    }

    // Find payment by Razorpay order ID
    const payment = await tx.payment.findFirst({
      where: {
        razorpayOrderId,
      },
      include: {
        order: {
          include: {
            customer: true,
            orderItems: {
              include: {
                product: true,
              },
            },
            deliveryAddress: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    // Update payment status
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        razorpayPaymentId,
        paidAt: new Date(),
      },
    });

    // Update order status to CONFIRMED
    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "CONFIRMED" },
    });

    return { payment: updatedPayment, order: payment.order };
  });
};

/**
 * Handle failed payment
 */
const handlePaymentFailure = async (razorpayOrderId, reason) => {
  return await prisma.$transaction(async (tx) => {
    // Find payment by Razorpay order ID
    const payment = await tx.payment.findFirst({
      where: {
        razorpayOrderId,
      },
      include: {
        order: {
          include: {
            orderItems: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    // Update payment status
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failureReason: reason,
      },
    });

    // Restore stock
    const order = payment.order;
    for (const item of order.orderItems) {
      const stock = await tx.stock.findFirst({
        where: {
          productId: item.productId,
          shopId: order.fulfillmentShopId,
        },
      });

      if (stock) {
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: order.customerId,
            action: "STOCK_RESTORATION",
            resourceType: "STOCK",
            resourceId: stock.id,
            details: `Payment failed for order ${order.id}: Restored ${item.quantity} units`,
            metadata: {
              orderId: order.id,
              productId: item.productId,
              shopId: order.fulfillmentShopId,
              quantity: item.quantity,
              reason,
            },
          },
        });
      }
    }

    // Cancel the order
    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "CANCELLED" },
    });

    return payment;
  });
};

/**
 * Update payment with Razorpay order ID
 */
const updatePaymentWithRazorpayOrder = async (paymentId, razorpayOrderId) => {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      razorpayOrderId,
    },
  });

  return payment;
};

/**
 * Get payment by order ID
 */
const getPaymentByOrderId = async (orderId) => {
  const payment = await prisma.payment.findFirst({
    where: { orderId },
    include: {
      order: true,
    },
  });

  return payment;
};

export {
  createRazorpayOrder, getPaymentByOrderId, handlePaymentFailure, handlePaymentSuccess, updatePaymentWithRazorpayOrder, verifyPaymentSignature
};

