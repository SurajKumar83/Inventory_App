import prisma from "../config/database.js";
import redis from "../config/redis.js";

const PRODUCT_CACHE_TTL = 5 * 60; // 5 minutes in seconds
const PRODUCTS_CACHE_KEY = "products:catalog";

// Helper to clear product cache
const invalidateProductCache = async () => {
  const pattern = `${PRODUCTS_CACHE_KEY}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

// Get all products with pagination and filters + Redis caching
export const getAllProducts = async (filters = {}) => {
  const {
    page = 1,
    limit = 20,
    search = "",
    category = null,
    isActive = true,
    includeStock = true,
  } = filters;

  // Generate cache key based on filters
  const cacheKey = `${PRODUCTS_CACHE_KEY}:${page}:${limit}:${search || "all"}:${
    category || "all"
  }:${isActive}:${includeStock}`;

  // Try to get from cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const skip = (page - 1) * limit;

  const where = {
    ...(isActive !== null && { isActive }),
    ...(category && { category }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: includeStock ? { stock: true } : undefined,
      orderBy: { name: "asc" },
    }),
    prisma.product.count({ where }),
  ]);

  const result = {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  // Cache the result for 5 minutes
  await redis.setex(cacheKey, PRODUCT_CACHE_TTL, JSON.stringify(result));

  return result;
};

// Get product by ID with stock + Redis caching
export const getProductById = async (productId) => {
  const cacheKey = `${PRODUCTS_CACHE_KEY}:id:${productId}`;

  // Try to get from cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      stock: {
        include: { shop: true },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Cache the result for 5 minutes
  await redis.setex(cacheKey, PRODUCT_CACHE_TTL, JSON.stringify(product));

  return product;
};

// Create new product with initial stock
export const createProduct = async (
  productData,
  initialStock = {},
  reorderLevel = 10,
) => {
  const { sku, name, description, category, price, unit, imageUrls } =
    productData;

  // Check if SKU already exists
  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) {
    throw new Error("Product with this SKU already exists");
  }

  // Create product with initial stock in a transaction
  const product = await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: {
        sku,
        name,
        description,
        category,
        price,
        unit,
        imageUrls,
        isActive: true,
      },
    });

    // Create stock entries for both shops if provided
    if (initialStock.shop1 !== undefined || initialStock.shop2 !== undefined) {
      const stockEntries = [];

      if (initialStock.shop1 !== undefined) {
        stockEntries.push({
          productId: newProduct.id,
          shopId: "shop1",
          quantity: Number(initialStock.shop1) || 0,
          reorderLevel: Number(reorderLevel) || 10,
        });
      }

      if (initialStock.shop2 !== undefined) {
        stockEntries.push({
          productId: newProduct.id,
          shopId: "shop2",
          quantity: Number(initialStock.shop2) || 0,
          reorderLevel: Number(reorderLevel) || 10,
        });
      }

      await tx.stock.createMany({ data: stockEntries });
    }

    return newProduct;
  });

  // Invalidate product cache
  await invalidateProductCache();

  return getProductById(product.id);
};

// Update product
export const updateProduct = async (productId, updateData, userId) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error("Product not found");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: updateData,
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: "PRODUCT_UPDATE",
        resourceType: "PRODUCT",
        resourceId: productId,
        changes: {
          before: product,
          after: updatedProduct,
        },
      },
    });

    return updatedProduct;
  });

  // Invalidate product cache
  await invalidateProductCache();

  return getProductById(updated.id);
};

// Soft delete product (set isActive = false)
export const deleteProduct = async (productId, userId) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error("Product not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: "PRODUCT_DELETE",
        resourceType: "PRODUCT",
        resourceId: productId,
        changes: {
          product: product.name,
          sku: product.sku,
        },
      },
    });
  });

  // Invalidate product cache
  await invalidateProductCache();

  return { message: "Product deleted successfully" };
};

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
