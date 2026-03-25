import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create shops
  const shop1 = await prisma.shop.upsert({
    where: { id: "shop1" },
    update: {},
    create: {
      id: "shop1",
      name: "Shop 1 - Main Street",
    },
  });

  const shop2 = await prisma.shop.upsert({
    where: { id: "shop2" },
    update: {},
    create: {
      id: "shop2",
      name: "Shop 2 - Market Road",
    },
  });

  console.log("✅ Shops created");

  // Create owner account
  const passwordHash = await bcrypt.hash("Password123!", 12);
  const owner = await prisma.user.upsert({
    where: { email: "owner@dukaansync.com" },
    update: {},
    create: {
      email: "owner@dukaansync.com",
      passwordHash,
      firstName: "Shop",
      lastName: "Owner",
      phone: "+919876543210",
      role: "OWNER",
      mfaEnabled: false,
    },
  });

  console.log(
    "✅ Owner account created (email: owner@dukaansync.com, password: Password123!)",
  );

  // Create sample products with stock
  const products = [
    {
      sku: "RICE-001",
      name: "Basmati Rice 5kg",
      category: "STAPLES",
      price: 450.0,
      unit: "PACKET",
      description: "Premium quality basmati rice",
      imageUrls: ["https://via.placeholder.com/400x300?text=Basmati+Rice"],
      stock: { shop1: 50, shop2: 30, reorderLevel: 20 },
    },
    {
      sku: "MILK-001",
      name: "Full Cream Milk 1L",
      category: "DAIRY",
      price: 65.0,
      unit: "LITER",
      description: "Fresh full cream milk",
      imageUrls: ["https://via.placeholder.com/400x300?text=Milk"],
      stock: { shop1: 40, shop2: 25, reorderLevel: 15 },
    },
    {
      sku: "TOMATO-001",
      name: "Tomatoes",
      category: "FRESH_PRODUCE",
      price: 40.0,
      unit: "KG",
      description: "Fresh red tomatoes",
      imageUrls: ["https://via.placeholder.com/400x300?text=Tomatoes"],
      stock: { shop1: 35, shop2: 20, reorderLevel: 10 },
    },
    {
      sku: "BREAD-001",
      name: "White Bread Loaf",
      category: "PACKAGED_GOODS",
      price: 35.0,
      unit: "PIECE",
      description: "Fresh white bread loaf",
      imageUrls: ["https://via.placeholder.com/400x300?text=Bread"],
      stock: { shop1: 60, shop2: 40, reorderLevel: 25 },
    },
    {
      sku: "TURMERIC-001",
      name: "Turmeric Powder 100g",
      category: "SPICES",
      price: 45.0,
      unit: "PACKET",
      description: "Pure turmeric powder",
      imageUrls: ["https://via.placeholder.com/400x300?text=Turmeric"],
      stock: { shop1: 45, shop2: 30, reorderLevel: 20 },
    },
    {
      sku: "SOAP-001",
      name: "Bath Soap",
      category: "PERSONAL_CARE",
      price: 25.0,
      unit: "PIECE",
      description: "Gentle bath soap",
      imageUrls: ["https://via.placeholder.com/400x300?text=Soap"],
      stock: { shop1: 80, shop2: 50, reorderLevel: 30 },
    },
  ];

  for (const productData of products) {
    const { stock, ...productFields } = productData;

    const product = await prisma.product.upsert({
      where: { sku: productFields.sku },
      update: {},
      create: productFields,
    });

    // Create stock entries for both shops
    await prisma.stock.upsert({
      where: {
        productId_shopId: {
          productId: product.id,
          shopId: shop1.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        shopId: shop1.id,
        quantity: stock.shop1,
        reorderLevel: stock.reorderLevel,
      },
    });

    await prisma.stock.upsert({
      where: {
        productId_shopId: {
          productId: product.id,
          shopId: shop2.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        shopId: shop2.id,
        quantity: stock.shop2,
        reorderLevel: stock.reorderLevel,
      },
    });
  }

  console.log(
    `✅ ${products.length} products created with stock at both shops`,
  );

  // Create sample supplier
  const supplier = await prisma.supplier.upsert({
    where: { email: "supplier@example.com" },
    update: {},
    create: {
      businessName: "Premium Groceries Supplier",
      contactPerson: "John Supplier",
      email: "supplier@example.com",
      phone: "+919123456789",
      whatsappNumber: "+919123456789",
      paymentTerms: "30 days net",
      leadTimeDays: 3,
    },
  });

  console.log("✅ Sample supplier created");

  // Create sample customer
  const customerPasswordHash = await bcrypt.hash("customer123", 12);
  const customer = await prisma.customer.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      passwordHash: customerPasswordHash,
      firstName: "Test",
      lastName: "Customer",
      phone: "+919988776655",
    },
  });

  console.log(
    "✅ Sample customer created (email: customer@example.com, password: customer123)",
  );

  console.log("🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
