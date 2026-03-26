import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get all suppliers with pagination and filters
 */
const getAllSuppliers = async ({
  page = 1,
  limit = 20,
  search = "",
  isActive = true,
} = {}) => {
  const skip = (page - 1) * limit;

  const where = {};
  if (search) {
    where.OR = [
      { businessName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      skip,
      take: limit,
      include: {
        supplierProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { businessName: "asc" },
    }),
    prisma.supplier.count({ where }),
  ]);

  return {
    suppliers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get supplier by ID
 */
const getSupplierById = async (supplierId) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: {
      supplierProducts: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  return supplier;
};

/**
 * Create a new supplier
 */
const createSupplier = async (data) => {
  const {
    businessName,
    contactPerson,
    email,
    phone,
    whatsappNumber,
    address,
    paymentTerms,
    leadTimeDays,
  } = data;

  // Check for duplicate email
  if (email) {
    const existing = await prisma.supplier.findUnique({
      where: { email },
    });
    if (existing) {
      throw new Error("Supplier with this email already exists");
    }
  }

  const supplier = await prisma.supplier.create({
    data: {
      businessName,
      contactPerson,
      email,
      phone,
      whatsappNumber,
      address,
      paymentTerms,
      leadTimeDays,
    },
  });

  return supplier;
};

/**
 * Update a supplier
 */
const updateSupplier = async (supplierId, data) => {
  const {
    businessName,
    contactPerson,
    email,
    phone,
    whatsappNumber,
    address,
    paymentTerms,
    leadTimeDays,
    isActive,
  } = data;

  // Check if supplier exists
  const existing = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });

  if (!existing) {
    throw new Error("Supplier not found");
  }

  // Check for duplicate email if changing email
  if (email && email !== existing.email) {
    const duplicate = await prisma.supplier.findUnique({
      where: { email },
    });
    if (duplicate) {
      throw new Error("Another supplier with this email already exists");
    }
  }

  const updated = await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      businessName,
      contactPerson,
      email,
      phone,
      whatsappNumber,
      address,
      paymentTerms,
      leadTimeDays,
      isActive,
    },
  });

  return updated;
};

/**
 * Soft delete a supplier
 */
const deleteSupplier = async (supplierId) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  const deleted = await prisma.supplier.update({
    where: { id: supplierId },
    data: { isActive: false },
  });

  return deleted;
};

/**
 * Link products to a supplier
 */
const linkProducts = async (supplierId, productIds) => {
  // Check if supplier exists
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  // Delete existing links for this supplier
  await prisma.supplierProduct.deleteMany({
    where: { supplierId },
  });

  // Create new links
  if (productIds && productIds.length > 0) {
    await prisma.supplierProduct.createMany({
      data: productIds.map((productId) => ({
        supplierId,
        productId,
      })),
      skipDuplicates: true,
    });
  }

  // Return updated supplier with products
  return getSupplierById(supplierId);
};

/**
 * Get supplier for a specific product
 */
const getSupplierForProduct = async (productId) => {
  const supplierProduct = await prisma.supplierProduct.findFirst({
    where: {
      productId,
      supplier: { isActive: true },
    },
    include: {
      supplier: true,
    },
  });

  return supplierProduct?.supplier || null;
};

export {
  createSupplier,
  deleteSupplier,
  getAllSuppliers,
  getSupplierById,
  getSupplierForProduct,
  linkProducts,
  updateSupplier
};

