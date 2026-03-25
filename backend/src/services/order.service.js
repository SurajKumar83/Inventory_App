import { PrismaClient } from "@prisma/client";
import { sendOrderConfirmationEmail } from "./email.service.js";

const prisma = new PrismaClient();

/**
 * Determine which shop should fulfill the order
 * Strategy: Pick the shop with most complete inventory for the order
 */
const determineFulfillmentShop = async (orderItems) => {
  const shops = ["shop1", "shop2"];
  const shopScores = {};

  for (const shopId of shops) {
    let score = 0;
    let canFulfill = true;

    for (const item of orderItems) {
      const stock = await prisma.stock.findFirst({
        where: {
          productId: item.productId,
          shopId,
        },
      });

      if (!stock || stock.quantity < item.quantity) {
        canFulfill = false;
        break;
      }

      // Score by available quantity
      score += stock.quantity;
    }

    if (canFulfill) {
      shopScores[shopId] = score;
    }
  }

  // Return shop with highest score, or null if neither can fulfill
  const fulfillmentShop = Object.keys(shopScores).sort(
    (a, b) => shopScores[b] - shopScores[a],
  )[0];

  return fulfillmentShop || null;
};

/**
 * Create an order with payment and stock deduction
 */
const createOrder = async (data) => {
  const {
    customerId,
    items, // [{ productId, quantity, price }]
    deliveryAddressId,
    paymentMethod,
    notes,
  } = data;

  return await prisma.$transaction(async (tx) => {
    // Determine fulfillment shop
    const fulfillmentShopId = await determineFulfillmentShop(items);

    if (!fulfillmentShopId) {
      throw new Error("Insufficient stock to fulfill this order");
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const tax = subtotal * 0.18; // 18% GST
    const deliveryFee = subtotal >= 500 ? 0 : 40; // Free delivery over ₹500
    const total = subtotal + tax + deliveryFee;

    // Create order
    const order = await tx.order.create({
      data: {
        customerId,
        fulfillmentShopId,
        deliveryAddressId,
        subtotal,
        tax,
        deliveryFee,
        total,
        status: "PENDING",
        notes,
        orderItems: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: true,
        deliveryAddress: true,
        fulfillmentShop: true,
      },
    });

    // Create payment record
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        amount: total,
        method: paymentMethod,
        status: "PENDING",
      },
    });

    // Deduct stock from fulfillment shop (with row-level locking)
    for (const item of items) {
      const stock = await tx.stock.findFirst({
        where: {
          productId: item.productId,
          shopId: fulfillmentShopId,
        },
      });

      if (!stock || stock.quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }

      await tx.stock.update({
        where: { id: stock.id },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: customerId,
          action: "STOCK_DEDUCTION",
          resourceType: "STOCK",
          resourceId: stock.id,
          details: `Order ${order.id}: Deducted ${item.quantity} units`,
          metadata: {
            orderId: order.id,
            productId: item.productId,
            shopId: fulfillmentShopId,
            quantity: item.quantity,
          },
        },
      });
    }

    return { order, payment };
  });
};

/**
 * Get orders with filters
 */
const getOrders = async ({ page = 1, limit = 20, customerId, status } = {}) => {
  const skip = (page - 1) * limit;

  const where = {};
  if (customerId) {
    where.customerId = customerId;
  }
  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        deliveryAddress: true,
        fulfillmentShop: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get order by ID
 */
const getOrderById = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
      customer: true,
      deliveryAddress: true,
      fulfillmentShop: true,
      payments: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

/**
 * Update order status
 */
const updateOrderStatus = async (orderId, status) => {
  const validStatuses = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  if (!validStatuses.includes(status)) {
    throw new Error("Invalid order status");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      orderItems: {
        include: {
          product: true,
        },
      },
      deliveryAddress: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Send confirmation email when order is confirmed
  if (status === "CONFIRMED" && order.status === "PENDING") {
    try {
      await sendOrderConfirmationEmail(
        order.customer.email,
        order,
        order.orderItems,
        order.deliveryAddress,
      );
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
    }
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  return updated;
};

/**
 * Cancel order and restore stock
 */
const cancelOrder = async (orderId) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      throw new Error("Cannot cancel order in current status");
    }

    // Restore stock
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
            details: `Order ${orderId} cancelled: Restored ${item.quantity} units`,
            metadata: {
              orderId,
              productId: item.productId,
              shopId: order.fulfillmentShopId,
              quantity: item.quantity,
            },
          },
        });
      }
    }

    // Update order status
    const cancelled = await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    // Update payment status
    await tx.payment.updateMany({
      where: { orderId },
      data: { status: "CANCELLED" },
    });

    return cancelled;
  });
};

export { cancelOrder, createOrder, getOrderById, getOrders, updateOrderStatus };

