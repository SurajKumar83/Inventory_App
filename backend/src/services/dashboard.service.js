import prisma from "../config/database.js";
import { redis } from "../config/redis.js";

const CACHE_KEY = "dashboard:stats";
const CACHE_TTL = 30; // 30 seconds cache to reduce database load

/**
 * Calculate dashboard metrics for admin overview
 * Uses Redis caching to minimize database queries
 */
export const getDashboardStats = async () => {
  try {
    // Try to get cached data first
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        console.log("📊 Dashboard stats served from cache");
        return JSON.parse(cached);
      }
    } catch (cacheError) {
      // If Redis is down, continue without cache
      console.warn(
        "Cache unavailable, fetching fresh data:",
        cacheError.message,
      );
    }

    // Get total products count
    const totalProducts = await prisma.product.count({
      where: { isActive: true },
    });

    // Get low-stock products count (below reorder level)
    // Fetch all stock items and filter in JavaScript (Prisma doesn't support field-to-field comparison)
    const stockItems = await prisma.stock.findMany({
      where: {
        product: {
          isActive: true,
        },
      },
      select: {
        quantity: true,
        reorderLevel: true,
      },
    });

    const lowStockItems = stockItems.filter(
      (item) => item.quantity <= item.reorderLevel,
    ).length;

    // Get today's sales (completed orders)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayOrders = await prisma.order
      .findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: ["PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED"],
          },
        },
        select: {
          total: true,
        },
      })
      .catch((err) => {
        console.error("Error fetching today's orders:", err);
        return [];
      });

    const todaysSales = todayOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );
    const todaysOrderCount = todayOrders.length;

    // Get pending orders count
    const pendingOrdersCount = await prisma.order
      .count({
        where: {
          status: "RECEIVED",
        },
      })
      .catch((err) => {
        console.error("Error counting pending orders:", err);
        return 0;
      });

    // Get active alerts count (PENDING status = not yet sent)
    const activeAlertsCount = await prisma.alert
      .count({
        where: {
          status: "PENDING",
        },
      })
      .catch((err) => {
        console.error("Error counting alerts:", err);
        return 0;
      });

    // Get total shops
    const totalShops = await prisma.shop.count();

    // Get total suppliers
    const totalSuppliers = await prisma.supplier.count().catch(() => 0);

    // Get total customers
    const totalCustomers = await prisma.customer.count();

    // Recent orders (last 5)
    const recentOrders = await prisma.order
      .findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            select: {
              quantity: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })
      .catch((err) => {
        console.error("Error fetching recent orders:", err);
        return [];
      });

    const result = {
      totalProducts,
      lowStockCount: lowStockItems,
      todaysSales: Number(todaysSales.toFixed(2)),
      todaysOrderCount,
      pendingOrdersCount,
      activeAlertsCount,
      totalShops,
      totalSuppliers,
      totalCustomers,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        customerEmail: order.customer.email,
        status: order.status,
        total: Number(order.total.toFixed(2)),
        itemCount: order.items.length,
        createdAt: order.createdAt,
      })),
    };

    // Cache the result for 30 seconds
    try {
      await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(result));
      console.log("📊 Dashboard stats cached for", CACHE_TTL, "seconds");
    } catch (cacheError) {
      console.warn("Failed to cache dashboard stats:", cacheError.message);
    }

    return result;
  } catch (error) {
    console.error("Error calculating dashboard stats:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    throw error;
  }
};

/**
 * Invalidate dashboard cache
 * Call this when inventory, orders, or alerts are updated
 */
export const invalidateDashboardCache = async () => {
  try {
    await redis.del(CACHE_KEY);
    console.log("🔄 Dashboard cache invalidated");
  } catch (error) {
    console.warn("Failed to invalidate dashboard cache:", error.message);
  }
};
