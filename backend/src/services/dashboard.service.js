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
    const lowStockCount = await prisma.stock.count({
      where: {
        quantity: {
          lte: prisma.raw("reorderLevel"),
        },
        product: {
          isActive: true,
        },
      },
    });

    // Alternative approach for low-stock count (more reliable)
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

    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"],
        },
      },
      select: {
        total: true,
      },
    });

    const todaysSales = todayOrders.reduce(
      (sum, order) => sum + order.total,
      0,
    );
    const todaysOrderCount = todayOrders.length;

    // Get pending orders count
    const pendingOrdersCount = await prisma.order.count({
      where: {
        status: "PENDING",
      },
    });

    // Get active alerts count
    const activeAlertsCount = await prisma.alert.count({
      where: {
        status: "ACTIVE",
      },
    });

    // Get total shops
    const totalShops = await prisma.shop.count({
      where: { isActive: true },
    });

    // Get total suppliers
    const totalSuppliers = await prisma.supplier.count();

    // Get total customers
    const totalCustomers = await prisma.customer.count();

    // Recent orders (last 5)
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            name: true,
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
        customerName: order.customer.name,
        customerEmail: order.customer.email,
        status: order.status,
        total: Number(order.total.toFixed(2)),
        itemCount: order.items.length,
        createdAt: order.createdAt,
      })),
    };
  } catch (error) {
    console.error("Error calculating dashboard stats:", error);
    throw error;
  }
};
