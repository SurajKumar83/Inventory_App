import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import prisma from "../../src/config/database.js";
import * as orderService from "../../src/services/order.service.js";

describe("T178: Prevent Overselling (Edge Case Validation)", () => {
  let testProduct;
  let testCustomer;
  let shop1, shop2;
  let stock1, stock2;

  beforeAll(async () => {
    // Create test product
    testProduct = await prisma.product.create({
      data: {
        sku: `TEST-OVERSELL-${Date.now()}`,
        name: "Oversell Test Product",
        category: "STAPLES",
        price: 100,
        costPrice: 50,
        // ... other required fields
      },
    });

    // Get or create test shops
    [shop1, shop2] = await Promise.all([
      prisma.shop.findUnique({ where: { id: "shop1" } }),
      prisma.shop.findUnique({ where: { id: "shop2" } }),
    ]);

    // Create test customer
    testCustomer = await prisma.customer.create({
      data: {
        email: `oversell-test-${Date.now()}@test.local`,
        phone: "9999999999",
        firstName: "Test",
        lastName: "Customer",
        passwordHash: "hashedpassword",
      },
    });

    // Set initial stock: Shop 1 has 5 units, Shop 2 has 3 units (total 8)
    [stock1, stock2] = await Promise.all([
      prisma.stock.create({
        data: {
          productId: testProduct.id,
          shopId: shop1.id,
          quantity: 5,
          reorderLevel: 2,
        },
      }),
      prisma.stock.create({
        data: {
          productId: testProduct.id,
          shopId: shop2.id,
          quantity: 3,
          reorderLevel: 2,
        },
      }),
    ]);
  });

  it("should prevent order creation when requested quantity exceeds total available stock across all shops", async () => {
    // Scenario: Request 10 units when only 8 are available (5+3)
    const cartItems = [{ productId: testProduct.id, quantity: 10 }];

    try {
      await orderService.createOrder({
        customerId: testCustomer.id,
        items: cartItems,
        deliveryAddressId: "test-address",
        fulfillmentShopId: shop1.id,
      });

      // If we reach here, test should fail
      throw new Error(
        "Order should not have been created with quantity > available stock",
      );
    } catch (error) {
      expect(error.message).toContain(
        "Insufficient stock" || "Stock not available",
      );
    }
  });

  it("should allow order creation when quantity equals total available stock", async () => {
    // Scenario: Request exactly 8 units (all available)
    const cartItems = [{ productId: testProduct.id, quantity: 8 }];

    const order = await orderService.createOrder({
      customerId: testCustomer.id,
      items: cartItems,
      deliveryAddressId: "test-address",
      fulfillmentShopId: shop1.id,
    });

    expect(order).toBeDefined();
    expect(order.orderNumber).toBeDefined();
    expect(order.items[0].quantity).toBe(8);

    // Verify stock was deducted
    const updatedStock1 = await prisma.stock.findUnique({
      where: { id: stock1.id },
    });
    const updatedStock2 = await prisma.stock.findUnique({
      where: { id: stock2.id },
    });

    // Total stock should be 0 (8 ordered from 8 available)
    const totalRemaining = updatedStock1.quantity + updatedStock2.quantity;
    expect(totalRemaining).toBe(0);
  });

  it("should prevent overselling when concurrent orders come in", async () => {
    // Reset stock
    await prisma.stock.update({
      where: { id: stock1.id },
      data: { quantity: 5 },
    });

    await prisma.stock.update({
      where: { id: stock2.id },
      data: { quantity: 3 },
    });

    // Simulate two concurrent orders, each requesting 6 units
    // Both should not succeed if stock is properly locked
    const promise1 = orderService.createOrder({
      customerId: testCustomer.id,
      items: [{ productId: testProduct.id, quantity: 6 }],
      deliveryAddressId: "test-address",
      fulfillmentShopId: shop1.id,
    });

    const promise2 = orderService.createOrder({
      customerId: testCustomer.id,
      items: [{ productId: testProduct.id, quantity: 6 }],
      deliveryAddressId: "test-address",
      fulfillmentShopId: shop1.id,
    });

    const results = await Promise.allSettled([promise1, promise2]);

    // At least one should fail
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    expect(successCount).toBeLessThanOrEqual(1);
  });

  it("should respect atomic transaction - all or nothing stock deduction", async () => {
    // Reset stock
    await prisma.stock.update({
      where: { id: stock1.id },
      data: { quantity: 10 },
    });

    await prisma.stock.update({
      where: { id: stock2.id },
      data: { quantity: 10 },
    });

    // Create order with multiple items (simulates cart with different products)
    const product2 = await prisma.product.create({
      data: {
        sku: `TEST-OVERSELL-2-${Date.now()}`,
        name: "Second Test Product",
        category: "STAPLES",
        price: 50,
        costPrice: 25,
      },
    });

    // Set stock for second product only in shop 1 (not in shop 2)
    await prisma.stock.create({
      data: {
        productId: product2.id,
        shopId: shop1.id,
        quantity: 0, // Out of stock
        reorderLevel: 1,
      },
    });

    const cartItems = [
      { productId: testProduct.id, quantity: 3 },
      { productId: product2.id, quantity: 1 }, // This should fail
    ];

    try {
      await orderService.createOrder({
        customerId: testCustomer.id,
        items: cartItems,
        deliveryAddressId: "test-address",
        fulfillmentShopId: shop1.id,
      });
    } catch (error) {
      // Previous product stock should not be deducted (atomic transaction)
      const stock = await prisma.stock.findUnique({
        where: { id: stock1.id },
      });

      expect(stock.quantity).toBe(10); // Should remain unchanged due to transaction rollback
    }
  });

  afterAll(async () => {
    // Cleanup
    await Promise.all([
      prisma.stock.deleteMany().catch(() => {}),
      prisma.product.deleteMany().catch(() => {}),
      prisma.customer.deleteMany().catch(() => {}),
    ]);

    await prisma.$disconnect();
  });
});
