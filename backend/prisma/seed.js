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
      description:
        "Aromatic long-grain basmati rice sourced from premium farms. Fluffy grains when cooked, ideal for biryani and everyday meals.",
      imageUrls: ["https://via.placeholder.com/400x300?text=Basmati+Rice"],
      stock: { shop1: 50, shop2: 30, reorderLevel: 20 },
    },
    {
      sku: "ATTA-001",
      name: "Whole Wheat Atta 10kg",
      category: "STAPLES",
      price: 520.0,
      unit: "PACKET",
      description:
        "Stone-milled whole wheat flour with high fiber and consistent texture, perfect for rotis and baking.",
      imageUrls: ["https://via.placeholder.com/400x300?text=Atta"],
      stock: { shop1: 40, shop2: 25, reorderLevel: 15 },
    },
    {
      sku: "MILK-001",
      name: "Full Cream Milk 1L",
      category: "DAIRY",
      price: 65.0,
      unit: "LITER",
      description:
        "Fresh full cream milk with rich taste and natural nutrients. Pasteurized and chilled for freshness.",
      imageUrls: ["https://via.placeholder.com/400x300?text=Full+Cream+Milk"],
      stock: { shop1: 40, shop2: 25, reorderLevel: 15 },
    },
    {
      sku: "YOGURT-001",
      name: "Plain Yogurt 500g",
      category: "DAIRY",
      price: 80.0,
      unit: "PACKET",
      description:
        "Creamy plain yogurt made from cultured milk. Great for raitas, smoothies, and cooking.",
      imageUrls: ["https://via.placeholder.com/400x300?text=Yogurt"],
      stock: { shop1: 35, shop2: 20, reorderLevel: 10 },
    },
    {
      sku: "TOMATO-001",
      name: "Tomatoes",
      category: "FRESH_PRODUCE",
      price: 40.0,
      unit: "KG",
      description:
        "Fresh ripe tomatoes with vibrant color and balanced acidity, ideal for salads and cooking.",
      imageUrls: ["https://via.placeholder.com/400x300?text=Tomatoes"],
      stock: { shop1: 35, shop2: 20, reorderLevel: 10 },
    },
    {
      sku: "POTATO-001",
      name: "Potatoes",
      category: "FRESH_PRODUCE",
      price: 30.0,
      unit: "KG",
      description:
        "Versatile potatoes for frying, boiling, and curries. Clean and sorted for quality.",
      imageUrls: ["https://via.placeholder.com/400x300?text=Potatoes"],
      stock: { shop1: 60, shop2: 45, reorderLevel: 20 },
    },
    {
      sku: "BREAD-001",
      name: "White Bread Loaf",
      category: "PACKAGED_GOODS",
      price: 35.0,
      unit: "PIECE",
      description:
        "Soft white bread loaf baked daily. Sliced and perfect for sandwiches and toasts.",
      imageUrls: ["https://via.placeholder.com/400x300?text=White+Bread"],
      stock: { shop1: 60, shop2: 40, reorderLevel: 25 },
    },
    {
      sku: "BISCUIT-001",
      name: "Tea Biscuits 200g",
      category: "PACKAGED_GOODS",
      price: 45.0,
      unit: "PACKET",
      description:
        "Crispy tea biscuits made with quality ingredients. Lightly sweet and ideal with tea or coffee.",
      imageUrls: ["https://via.placeholder.com/400x300?text=Biscuits"],
      stock: { shop1: 80, shop2: 60, reorderLevel: 30 },
    },
    {
      sku: "TURMERIC-001",
      name: "Turmeric Powder 100g",
      category: "SPICES",
      price: 45.0,
      unit: "PACKET",
      description:
        "Aromatic and pure turmeric powder, finely ground and free from additives.",
      imageUrls: ["https://via.placeholder.com/400x300?text=Turmeric+Powder"],
      stock: { shop1: 45, shop2: 30, reorderLevel: 20 },
    },
    {
      sku: "CHILI-001",
      name: "Red Chili Powder 100g",
      category: "SPICES",
      price: 50.0,
      unit: "PACKET",
      description:
        "Hot and flavorful red chili powder for authentic spice in recipes.",
      imageUrls: ["https://via.placeholder.com/400x300?text=Chili+Powder"],
      stock: { shop1: 40, shop2: 25, reorderLevel: 15 },
    },
    {
      sku: "SOAP-001",
      name: "Bath Soap",
      category: "PERSONAL_CARE",
      price: 25.0,
      unit: "PIECE",
      description:
        "Gentle bath soap with moisturizing ingredients. Suitable for daily use and all skin types.",
      imageUrls: ["https://via.placeholder.com/400x300?text=Bath+Soap"],
      stock: { shop1: 80, shop2: 50, reorderLevel: 30 },
    },
    {
      sku: "TOOTHPASTE-001",
      name: "Mint Toothpaste 100g",
      category: "PERSONAL_CARE",
      price: 60.0,
      unit: "PACKET",
      description:
        "Refreshing mint toothpaste for daily oral care with cavity protection.",
      imageUrls: ["https://via.placeholder.com/400x300?text=Toothpaste"],
      stock: { shop1: 50, shop2: 35, reorderLevel: 20 },
    },
    {
      sku: "MISC-001",
      name: "Reusable Shopping Bag",
      category: "OTHER",
      price: 99.0,
      unit: "PIECE",
      description:
        "Durable reusable shopping bag made from recycled materials. Eco-friendly and foldable.",
      imageUrls: ["https://via.placeholder.com/400x300?text=Shopping+Bag"],
      stock: { shop1: 120, shop2: 80, reorderLevel: 40 },
    },
    {
      sku: "BATTERY-001",
      name: "AA Alkaline Battery (Pack of 4)",
      category: "OTHER",
      price: 120.0,
      unit: "PACKET",
      description:
        "Reliable AA alkaline batteries for toys, remotes and household devices.",
      imageUrls: ["https://imgs.search.brave.com/dJ2cSMNqheT1OvCVN-XYeE6bS_TdiqeAGNoZGjnxHiA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NzFiMzlYTldFY0wu/anBn"],
      stock: { shop1: 70, shop2: 50, reorderLevel: 25 },
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
