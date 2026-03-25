import { check, group, sleep } from "k6";
import http from "k6/http";
import { Counter, Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const responseTime = new Trend("response_time");
const successfulRequests = new Counter("successful_requests");

// Load test configuration
export const options = {
  stages: [
    { duration: "30s", target: 100 }, // Ramp up to 100 users
    { duration: "1m30s", target: 500 }, // Ramp up to 500 users
    { duration: "2m", target: 500 }, // Stay at 500 users
    { duration: "1m30s", target: 1000 }, // Ramp up to 1000 users
    { duration: "2m", target: 1000 }, // Stay at 1000 users
    { duration: "30s", target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<300"], // 95th percentile should be < 300ms
    "http_req_duration{staticAsset:yes}": ["p(99)<1000"], // Static assets
    errors: ["rate<0.01"], // Error rate < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:5000/api/v1";
const TOKEN = __ENV.API_TOKEN || "";

// Helper function to generate random data
function randomString(length) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Test authentication
function testAuth() {
  group("Authentication", () => {
    const loginPayload = JSON.stringify({
      email: "owner@dukaansync.local",
      password: "SecurePassword123!",
    });

    const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
      headers: { "Content-Type": "application/json" },
    });

    check(loginRes, {
      "login status is 200": (r) => r.status === 200,
      "login returns token": (r) => r.json("data.accessToken") !== undefined,
    })
      ? successfulRequests.add(1)
      : errorRate.add(1);

    responseTime.add(loginRes.timings.duration);
    return loginRes.json("data.accessToken");
  });
}

// Test product catalog endpoints
function testProductCatalog(token) {
  group("Product Catalog", () => {
    // Get all products with pagination
    const getProductsRes = http.get(`${BASE_URL}/products?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    check(getProductsRes, {
      "get products status is 200": (r) => r.status === 200,
      "products list is array": (r) => Array.isArray(r.json("data.products")),
      "pagination exists": (r) => r.json("data.pagination") !== null,
    })
      ? successfulRequests.add(1)
      : errorRate.add(1);

    responseTime.add(getProductsRes.timings.duration);

    // Get single product by ID
    if (getProductsRes.status === 200) {
      const products = getProductsRes.json("data.products");
      if (products.length > 0) {
        const productId = products[0].id;
        const getProductRes = http.get(`${BASE_URL}/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        check(getProductRes, {
          "get single product status is 200": (r) => r.status === 200,
          "product has id": (r) => r.json("data.id") === productId,
          "product has stock array": (r) =>
            Array.isArray(r.json("data.stocks")),
        })
          ? successfulRequests.add(1)
          : errorRate.add(1);

        responseTime.add(getProductRes.timings.duration);
      }
    }

    sleep(1);
  });
}

// Test inventory operations
function testInventoryOperations(token) {
  group("Inventory Operations", () => {
    // Get stock
    const stockRes = http.get(`${BASE_URL}/inventory/stock/product-1/shop-1`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    check(stockRes, {
      "get stock status is 200 or 404": (r) =>
        r.status === 200 || r.status === 404,
      "stock has quantity": (r) =>
        r.status === 200 ? r.json("data.quantity") !== undefined : true,
    })
      ? successfulRequests.add(1)
      : errorRate.add(1);

    responseTime.add(stockRes.timings.duration);

    // Adjust stock (write operation)
    const adjustPayload = JSON.stringify({
      productId: "product-1",
      shopId: "shop-1",
      quantity: 5,
      reason: "RESTOCK",
    });

    const adjustRes = http.post(`${BASE_URL}/inventory/adjust`, adjustPayload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    check(adjustRes, {
      "adjust stock status is 200 or 400": (r) =>
        r.status === 200 || r.status === 400,
      "adjustment returns stock data": (r) =>
        r.status === 200 ? r.json("data.quantity") !== undefined : true,
    })
      ? successfulRequests.add(1)
      : errorRate.add(1);

    responseTime.add(adjustRes.timings.duration);

    sleep(1);
  });
}

// Test order operations
function testOrderOperations(token) {
  group("Order Operations", () => {
    // Get orders
    const getOrdersRes = http.get(`${BASE_URL}/orders?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    check(getOrdersRes, {
      "get orders status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "orders list is array": (r) =>
        r.status === 200 ? Array.isArray(r.json("data")) : true,
    })
      ? successfulRequests.add(1)
      : errorRate.add(1);

    responseTime.add(getOrdersRes.timings.duration);

    // Get single order if available
    if (
      getOrdersRes.status === 200 &&
      Array.isArray(getOrdersRes.json("data"))
    ) {
      const orders = getOrdersRes.json("data");
      if (orders.length > 0) {
        const orderId = orders[0].id;
        const getOrderRes = http.get(`${BASE_URL}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        check(getOrderRes, {
          "get single order status is 200 or 403": (r) =>
            r.status === 200 || r.status === 403,
        })
          ? successfulRequests.add(1)
          : errorRate.add(1);

        responseTime.add(getOrderRes.timings.duration);
      }
    }

    sleep(1);
  });
}

// Test dashboard metrics
function testDashboard(token) {
  group("Dashboard Metrics", () => {
    const dashRes = http.get(`${BASE_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: "dashboard" },
    });

    check(dashRes, {
      "dashboard status is 200": (r) => r.status === 200,
      "totalProducts is number": (r) =>
        typeof r.json("data.totalProducts") === "number",
      "lowStockCount is number": (r) =>
        typeof r.json("data.lowStockCount") === "number",
      "todaysSales is number": (r) =>
        typeof r.json("data.todaysSales") === "number",
      "pendingOrdersCount is number": (r) =>
        typeof r.json("data.pendingOrdersCount") === "number",
    })
      ? successfulRequests.add(1)
      : errorRate.add(1);

    responseTime.add(dashRes.timings.duration);

    sleep(1);
  });
}

// Test real-time events polling
function testRealtimeEvents(token) {
  group("Real-time Events", () => {
    const timestamp = Date.now();
    const pollRes = http.get(
      `${BASE_URL}/events/poll?since=${timestamp - 5000}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    check(pollRes, {
      "poll status is 200 or 400": (r) => r.status === 200 || r.status === 400,
      "events is array": (r) =>
        r.status === 200 ? Array.isArray(r.json("data")) : true,
    })
      ? successfulRequests.add(1)
      : errorRate.add(1);

    responseTime.add(pollRes.timings.duration);

    sleep(1);
  });
}

// Main test function
export default function () {
  const token = testAuth();

  if (token) {
    testProductCatalog(token);
    testInventoryOperations(token);
    testOrderOperations(token);
    testDashboard(token);
    testRealtimeEvents(token);
  }

  sleep(2);
}

// Teardown function
export function teardown(data) {
  console.log(`
    ========== LOAD TEST SUMMARY ==========
    Total Successful Requests: ${successfulRequests.value}
    Error Rate: ${(errorRate.value * 100).toFixed(2)}%
    Average Response Time: ${responseTime.value.toFixed(2)}ms

    Thresholds:
    - p95 response time < 300ms (critical)
    - Error rate < 1%
    ========================================
  `);
}
