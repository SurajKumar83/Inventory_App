import prisma from "./src/config/database.js";
import redis from "./src/config/redis.js";
import { adjustStock } from "./src/services/inventory.service.js";
import { getAllProducts } from "./src/services/product.service.js";

async function testCacheInvalidation() {
  try {
    console.log("🧪 Testing Cache Invalidation\n");

    // Get first product and user
    const product = await prisma.product.findFirst({
      include: { stock: true },
    });
    const user = await prisma.user.findFirst();

    // Step 1: Load products (this will cache them)
    console.log("1️⃣ Loading products (will be cached)...");
    const result1 = await getAllProducts({ page: 1, limit: 5 });
    const cachedProduct1 = result1.products.find((p) => p.id === product.id);
    console.log(
      `   Stock for ${cachedProduct1.name}: shop1=${cachedProduct1.stock[0]?.quantity}`,
    );

    // Step 2: Check that result is cached
    console.log("\n2️⃣ Checking cache...");
    const cacheKeys = await redis.keys("products:catalog:*");
    console.log(`   Found ${cacheKeys.length} cached entries`);

    // Step 3: Adjust stock (this should invalidate cache)
    console.log("\n3️⃣ Adjusting stock (+5)...");
    await adjustStock(
      {
        productId: product.id,
        shopId: cachedProduct1.stock[0].shopId,
        quantity: 5,
        reason: "Cache test",
      },
      user.id,
    );
    console.log("   ✅ Stock adjusted");

    // Step 4: Check that cache was invalidated
    console.log("\n4️⃣ Checking cache after adjustment...");
    const cacheKeysAfter = await redis.keys("products:catalog:*");
    console.log(`   Found ${cacheKeysAfter.length} cached entries`);

    if (cacheKeysAfter.length === 0) {
      console.log("   ✅ Cache was properly invalidated!");
    } else {
      console.log("   ❌ Cache was NOT invalidated!");
    }

    // Step 5: Load products again (should fetch fresh data)
    console.log("\n5️⃣ Loading products again (fresh data from DB)...");
    const result2 = await getAllProducts({ page: 1, limit: 5 });
    const cachedProduct2 = result2.products.find((p) => p.id === product.id);
    console.log(
      `   Stock for ${cachedProduct2.name}: shop1=${cachedProduct2.stock[0]?.quantity}`,
    );

    const oldQty = cachedProduct1.stock[0]?.quantity;
    const newQty = cachedProduct2.stock[0]?.quantity;

    if (newQty === oldQty + 5) {
      console.log(`   ✅ Stock updated correctly: ${oldQty} → ${newQty} (+5)`);
    } else {
      console.log(
        `   ❌ Stock NOT updated: ${oldQty} → ${newQty} (expected ${oldQty + 5})`,
      );
    }

    console.log("\n✅ Cache invalidation test complete!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

testCacheInvalidation();
