import prisma from "./src/config/database.js";
import {
  adjustStock,
  transferStock,
} from "./src/services/inventory.service.js";

async function testInventory() {
  try {
    console.log("🔍 Fetching test data...\n");

    // Get first product and user
    const product = await prisma.product.findFirst({
      include: { stock: true },
    });

    const user = await prisma.user.findFirst();

    if (!product || !user) {
      console.error("❌ No product or user found. Run seed first.");
      return;
    }

    console.log(`📦 Product: ${product.name} (${product.sku})`);
    console.log(`👤 User: ${user.email}\n`);

    // Show initial stock
    console.log("📊 Initial Stock:");
    for (const stock of product.stock) {
      console.log(`  - ${stock.shopId}: ${stock.quantity} ${product.unit}`);
    }
    console.log();

    // Test 1: Adjust stock (add)
    console.log("🧪 Test 1: Adjust stock (add +10 to shop1)");
    const adjustResult = await adjustStock(
      {
        productId: product.id,
        shopId: "shop1",
        quantity: 10,
        reason: "Test adjustment - adding stock",
      },
      user.id,
    );
    console.log(
      `✅ Success! New quantity at shop1: ${adjustResult.stock.quantity}`,
    );
    console.log();

    // Test 2: Adjust stock (remove)
    console.log("🧪 Test 2: Adjust stock (remove -5 from shop1)");
    const adjustResult2 = await adjustStock(
      {
        productId: product.id,
        shopId: "shop1",
        quantity: -5,
        reason: "Test adjustment - removing stock",
      },
      user.id,
    );
    console.log(
      `✅ Success! New quantity at shop1: ${adjustResult2.stock.quantity}`,
    );
    console.log();

    // Test 3: Transfer stock
    console.log("🧪 Test 3: Transfer stock (3 units from shop1 to shop2)");
    const transferResult = await transferStock(
      {
        productId: product.id,
        fromShopId: "shop1",
        toShopId: "shop2",
        quantity: 3,
        reason: "Test transfer - balancing stock",
      },
      user.id,
    );
    console.log(
      `✅ Success! shop1: ${transferResult.fromStock.quantity}, shop2: ${transferResult.toStock.quantity}`,
    );
    console.log();

    // Show final stock
    console.log("📊 Final Stock:");
    const finalStock = await prisma.stock.findMany({
      where: { productId: product.id },
    });
    for (const stock of finalStock) {
      console.log(`  - ${stock.shopId}: ${stock.quantity} ${product.unit}`);
    }
    console.log();

    // Show audit logs
    console.log("📝 Recent Audit Logs:");
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        resourceType: "STOCK",
        userId: user.id,
      },
      orderBy: { timestamp: "desc" },
      take: 3,
    });

    for (const log of auditLogs) {
      console.log(`  - ${log.action}: ${JSON.stringify(log.changes)}`);
    }

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testInventory();
