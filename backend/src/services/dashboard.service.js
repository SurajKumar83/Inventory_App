import prisma from "../config/database.js";

/**
 * Calculate dashboard metrics for admin overview
 */
export const getDashboardStats = async () => {
  try {
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

    return {
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
  } catch (error) {
    console.error("Error calculating dashboard stats:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    throw error;
  }
};
