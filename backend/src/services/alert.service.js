import { PrismaClient } from "@prisma/client";
import { redis } from "../config/redis.js";
import { sendLowStockAlertEmail } from "./email.service.js";
import { sendLowStockAlertPush } from "./pushNotification.service.js";
import { getSupplierForProduct } from "./supplier.service.js";
const prisma = new PrismaClient();

const ALERT_COUNT_CACHE_TTL = 30; // 30 seconds cache for alert count

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
          alertType: "LOW_STOCK",
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
          productId: stock.productId,
          shopId: stock.shopId,
          alertType: "LOW_STOCK",
          thresholdValue: stock.reorderLevel,
          quantityAtTrigger: stock.quantity,
          viewedByUsers: [owner.id], // Mark as viewed by owner since system created it
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

      // Invalidate alert count cache for all users since new alerts were created
      try {
        const allUsers = await prisma.user.findMany({ select: { id: true } });
        for (const user of allUsers) {
          await invalidateAlertCountCache(user.id);
        }
      } catch (cacheError) {
        console.warn("Failed to invalidate alert caches:", cacheError.message);
      }
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
const getAlerts = async ({ page = 1, limit = 20, status, shopId } = {}) => {
  const skip = (page - 1) * limit;

  const where = {};
  if (status) {
    where.status = status;
  }
  if (shopId) {
    where.shopId = shopId;
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
const markAlertAsViewed = async (alertId, userId) => {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new Error("Alert not found");
  }

  // Add user to viewedByUsers array if not already there
  const viewedByUsers = alert.viewedByUsers || [];
  if (!viewedByUsers.includes(userId)) {
    viewedByUsers.push(userId);
  }

  const updated = await prisma.alert.update({
    where: { id: alertId },
    data: {
      viewedByUsers,
    },
  });

  // Invalidate alert count cache for this user
  await invalidateAlertCountCache(userId);

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
  const message = `Hi ${supplier.contactPerson || supplier.businessName},

We need to reorder ${alert.product.name} (SKU: ${alert.product.sku}) for ${alert.shop.name}.

Current stock: ${stock?.quantity || 0} ${alert.product.unit}
Reorder level: ${stock?.reorderLevel || 0} ${alert.product.unit}

Please confirm availability and pricing.

Thank you!`;

  return {
    supplier: {
      id: supplier.id,
      businessName: supplier.businessName,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      whatsappNumber: supplier.whatsappNumber,
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
 * Uses Redis caching to minimize database queries
 */
const getUnviewedAlertCount = async (userId) => {
  // If no userId provided, return 0
  if (!userId) {
    return 0;
  }

  const cacheKey = `alert:count:${userId}`;

  // Try to get cached count first
  try {
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return parseInt(cached, 10);
    }
  } catch (cacheError) {
    console.warn("Cache unavailable for alert count:", cacheError.message);
  }

  const count = await prisma.alert.count({
    where: {
      NOT: {
        viewedByUsers: {
          has: userId,
          invalidateAlertCountCache,
        },
      },
    },
  });

  // Cache the count for 30 seconds
  try {
    await redis.setex(cacheKey, ALERT_COUNT_CACHE_TTL, count.toString());
  } catch (cacheError) {
    console.warn("Failed to cache alert count:", cacheError.message);
  }

  return count;
};

/**
 * Invalidate alert count cache for a user
 * Call this when alerts are created or marked as viewed
 */
const invalidateAlertCountCache = async (userId) => {
  if (!userId) return;

  try {
    await redis.del(`alert:count:${userId}`);
  } catch (error) {
    console.warn("Failed to invalidate alert count cache:", error.message);
  }
};

export {
  checkLowStockAlerts,
  generateSupplierContactMessage,
  getAlerts,
  getUnviewedAlertCount,
  markAlertAsViewed
};

