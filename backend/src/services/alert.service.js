import { PrismaClient } from "@prisma/client";
import { sendLowStockAlertEmail } from "./email.service.js";
import { sendLowStockAlertPush } from "./pushNotification.service.js";
import { getSupplierForProduct } from "./supplier.service.js";
const prisma = new PrismaClient();

/**
 * Check all products for low stock and create alerts
 * Called by cron job every 30 seconds
 */
const checkLowStockAlerts = async () => {
  try {
    // Find all products with stock below reorder level
    const allStocks = await prisma.stock.findMany({
      where: {
        product: {
          isActive: true,
        },
      },
      include: {
        product: true,
        shop: true,
      },
    });

    // Filter stocks where quantity <= reorderLevel
    const lowStockItems = allStocks.filter(
      (stock) => stock.quantity <= stock.reorderLevel,
    );

    const alertsCreated = [];

    for (const stock of lowStockItems) {
      // Check if an alert already exists for this product+shop in the last 24 hours
      const existingAlert = await prisma.alert.findFirst({
        where: {
          productId: stock.productId,
          shopId: stock.shopId,
          type: "LOW_STOCK",
          triggeredAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      // Skip if alert already exists (duplicate prevention)
      if (existingAlert) {
        continue;
      }

      // Get owner user (role = OWNER)
      const owner = await prisma.user.findFirst({
        where: { role: "OWNER" },
      });

      if (!owner) {
        console.warn("No owner user found for alert creation");
        continue;
      }

      // Create alert
      const alert = await prisma.alert.create({
        data: {
          userId: owner.id,
          productId: stock.productId,
          shopId: stock.shopId,
          type: "LOW_STOCK",
          message: `Low stock alert: ${stock.product.name} at ${stock.shop.name}. Current stock: ${stock.quantity} ${stock.product.unit}, reorder level: ${stock.reorderLevel} ${stock.product.unit}`,
          severity: stock.quantity === 0 ? "HIGH" : "MEDIUM",
        },
      });

      alertsCreated.push(alert);

      // Send email notification
      try {
        const supplier = await getSupplierForProduct(stock.productId);
        await sendLowStockAlertEmail(
          owner.email,
          stock.product,
          stock.shop,
          stock.quantity,
          stock.product.unit,
          stock.reorderLevel,
          supplier,
        );
      } catch (emailError) {
        console.error("Failed to send low-stock alert email:", emailError);
      }

      // Send push notification
      try {
        if (owner.pushToken) {
          await sendLowStockAlertPush(
            owner.pushToken,
            stock.product,
            stock.shop,
            stock.quantity,
            stock.product.unit,
          );
        }
      } catch (pushError) {
        console.error("Failed to send push notification:", pushError);
      }
    }

    if (alertsCreated.length > 0) {
      console.log(`Created ${alertsCreated.length} low-stock alerts`);
    }

    return alertsCreated;
  } catch (error) {
    console.error("Error checking low-stock alerts:", error);
    throw error;
  }
};

/**
 * Get alerts with filters
 */
const getAlerts = async ({
  page = 1,
  limit = 20,
  status,
  shopId,
  userId,
} = {}) => {
  const skip = (page - 1) * limit;

  const where = {};
  if (status) {
    where.status = status;
  }
  if (shopId) {
    where.shopId = shopId;
  }
  if (userId) {
    where.userId = userId;
  }

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      skip,
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            unit: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { triggeredAt: "desc" },
    }),
    prisma.alert.count({ where }),
  ]);

  return {
    alerts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Mark alert as viewed
 */
const markAlertAsViewed = async (alertId) => {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new Error("Alert not found");
  }

  const updated = await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: "VIEWED",
      viewedAt: new Date(),
    },
  });

  return updated;
};

/**
 * Generate supplier contact message for an alert
 */
const generateSupplierContactMessage = async (alertId) => {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: {
      product: true,
      shop: true,
    },
  });

  if (!alert) {
    throw new Error("Alert not found");
  }

  // Get supplier for this product
  const supplier = await getSupplierForProduct(alert.productId);

  if (!supplier) {
    throw new Error("No supplier found for this product");
  }

  // Get current stock
  const stock = await prisma.stock.findFirst({
    where: {
      productId: alert.productId,
      shopId: alert.shopId,
    },
  });

  // Generate pre-filled message
  const message = `Hi ${supplier.contactName || supplier.name},

We need to reorder ${alert.product.name} (SKU: ${alert.product.sku}) for ${alert.shop.name}.

Current stock: ${stock?.quantity || 0} ${alert.product.unit}
Reorder level: ${stock?.reorderLevel || 0} ${alert.product.unit}

Please confirm availability and pricing.

Thank you!`;

  return {
    supplier: {
      id: supplier.id,
      name: supplier.name,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      whatsapp: supplier.whatsapp,
    },
    message,
    product: alert.product,
    shop: alert.shop,
    currentStock: stock?.quantity || 0,
    reorderLevel: stock?.reorderLevel || 0,
  };
};

/**
 * Get unviewed alert count for a user
 */
const getUnviewedAlertCount = async (userId) => {
  const count = await prisma.alert.count({
    where: {
      userId,
      status: "ACTIVE",
    },
  });

  return count;
};

export {
  checkLowStockAlerts,
  generateSupplierContactMessage,
  getAlerts,
  getUnviewedAlertCount,
  markAlertAsViewed
};

