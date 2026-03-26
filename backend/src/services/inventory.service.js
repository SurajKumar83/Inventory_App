import prisma from "../config/database.js";
import redis, { redisPub } from "../config/redis.js";

// Helper to invalidate product cache when stock changes
const invalidateProductCache = async () => {
  const pattern = "products:catalog:*";
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

// Adjust stock (add or remove)
export const adjustStock = async (data, userId) => {
  const { productId, shopId, quantity, reason } = data;

  if (quantity === 0) {
    throw new Error("Quantity adjustment cannot be zero");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Get current stock with row-level locking
    let stock = await tx.stock.findUnique({
      where: { productId_shopId: { productId, shopId } },
      include: { product: true, shop: true },
    });

    // If stock record doesn't exist, handle based on operation type
    if (!stock) {
      // Can't remove stock that doesn't exist
      if (quantity < 0) {
        throw new Error(
          "Cannot remove stock. No stock record exists for this product at the specified shop.",
        );
      }

      // For adding stock, create a new stock record
      // First verify product and shop exist
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      const shop = await tx.shop.findUnique({
        where: { id: shopId },
      });

      if (!shop) {
        throw new Error("Shop not found");
      }

      // Create the stock record with initial quantity
      stock = await tx.stock.create({
        data: {
          productId,
          shopId,
          quantity,
          reorderLevel: 10, // Default reorder level
          lastRestockedAt: new Date(),
        },
        include: { product: true, shop: true },
      });

      // Create audit log for initial stock creation
      await tx.auditLog.create({
        data: {
          userId,
          action: "STOCK_ADD",
          resourceType: "STOCK",
          resourceId: stock.id,
          shopId,
          changes: {
            product: product.name,
            shop: shop.name,
            quantityBefore: 0,
            quantityAfter: quantity,
            adjustment: quantity,
            reason: reason || "Initial stock creation",
          },
        },
      });

      return { stock, product, shop };
    }

    const newQuantity = stock.quantity + quantity;

    if (newQuantity < 0) {
      throw new Error(
        `Insufficient stock. Current: ${stock.quantity}, Requested change: ${quantity}`,
      );
    }

    // Update stock
    const updatedStock = await tx.stock.update({
      where: { productId_shopId: { productId, shopId } },
      data: {
        quantity: newQuantity,
        ...(quantity > 0 && { lastRestockedAt: new Date() }),
      },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: quantity > 0 ? "STOCK_ADD" : "STOCK_REMOVE",
        resourceType: "STOCK",
        resourceId: stock.id,
        shopId,
        changes: {
          product: stock.product.name,
          shop: stock.shop.name,
          quantityBefore: stock.quantity,
          quantityAfter: newQuantity,
          adjustment: quantity,
          reason,
        },
      },
    });

    return { stock: updatedStock, product: stock.product, shop: stock.shop };
  });

  // Publish real-time update via Redis
  await redisPub.publish(
    "inventory:updates",
    JSON.stringify({
      type: "stock_adjusted",
      productId,
      shopId,
      quantity: result.stock.quantity,
      timestamp: new Date().toISOString(),
    }),
  );

  // Invalidate product cache to ensure fresh data
  await invalidateProductCache();

  return result;
};

// Transfer stock between shops
export const transferStock = async (data, userId) => {
  const { productId, fromShopId, toShopId, quantity, reason } = data;

  if (quantity <= 0) {
    throw new Error("Transfer quantity must be positive");
  }

  if (fromShopId === toShopId) {
    throw new Error("Cannot transfer to the same shop");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Get both stock records with row-level locking
    const [fromStock, toStock] = await Promise.all([
      tx.stock.findUnique({
        where: { productId_shopId: { productId, shopId: fromShopId } },
        include: { product: true, shop: true },
      }),
      tx.stock.findUnique({
        where: { productId_shopId: { productId, shopId: toShopId } },
        include: { product: true, shop: true },
      }),
    ]);

    if (!fromStock || !toStock) {
      throw new Error("Stock records not found");
    }

    if (fromStock.quantity < quantity) {
      throw new Error(
        `Insufficient stock at ${fromStock.shop.name}. Available: ${fromStock.quantity}, Requested: ${quantity}`,
      );
    }

    // Update both stock records
    const [updatedFromStock, updatedToStock] = await Promise.all([
      tx.stock.update({
        where: { productId_shopId: { productId, shopId: fromShopId } },
        data: { quantity: fromStock.quantity - quantity },
      }),
      tx.stock.update({
        where: { productId_shopId: { productId, shopId: toShopId } },
        data: {
          quantity: toStock.quantity + quantity,
          lastRestockedAt: new Date(),
        },
      }),
    ]);

    // Create audit log for transfer
    await tx.auditLog.create({
      data: {
        userId,
        action: "STOCK_TRANSFER",
        resourceType: "STOCK",
        resourceId: fromStock.id,
        shopId: fromShopId,
        changes: {
          product: fromStock.product.name,
          fromShop: fromStock.shop.name,
          toShop: toStock.shop.name,
          quantity,
          reason,
          fromStockBefore: fromStock.quantity,
          fromStockAfter: updatedFromStock.quantity,
          toStockBefore: toStock.quantity,
          toStockAfter: updatedToStock.quantity,
        },
      },
    });

    return {
      fromStock: updatedFromStock,
      toStock: updatedToStock,
      product: fromStock.product,
    };
  });

  // Publish real-time updates for both shops
  await Promise.all([
    redisPub.publish(
      "inventory:updates",
      JSON.stringify({
        type: "stock_transferred",
        productId,
        fromShopId,
        toShopId,
        quantity,
        timestamp: new Date().toISOString(),
      }),
    ),
  ]);

  // Invalidate product cache to ensure fresh data
  await invalidateProductCache();

  return result;
};

// Get stock history (audit trail) for a product
export const getStockHistory = async (productId, filters = {}) => {
  const { shopId, page = 1, limit = 50 } = filters;

  const where = {
    resourceType: "STOCK",
    action: { in: ["STOCK_ADD", "STOCK_REMOVE", "STOCK_TRANSFER"] },
    changes: {
      path: ["product"],
      // This is a workaround - ideally we'd join on Product
    },
    ...(shopId && { shopId }),
  };

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        shop: true,
      },
      orderBy: { timestamp: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Filter by product in application layer (since JSON query is complex)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true },
  });

  const filteredLogs = logs.filter((log) => {
    return log.changes?.product === product?.name;
  });

  return {
    logs: filteredLogs,
    pagination: {
      page,
      limit,
      total: filteredLogs.length,
      totalPages: Math.ceil(filteredLogs.length / limit),
    },
  };
};

export default {
  adjustStock,
  transferStock,
  getStockHistory,
};
