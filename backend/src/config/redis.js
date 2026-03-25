import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
let redisConnected = false;

// Redis client for caching and queues
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn(
        "⚠️  Redis unavailable - running without Redis (rate limiting disabled)",
      );
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true, // Don't connect automatically
});

// Redis pub/sub clients (separate connections required)
export const redisPub = new Redis(redisUrl, {
  retryStrategy: () => null,
  lazyConnect: true,
});

export const redisSub = new Redis(redisUrl, {
  retryStrategy: () => null,
  lazyConnect: true,
});

redis.on("error", (err) => {
  if (!redisConnected) {
    // Suppress repeated errors when Redis is unavailable
    return;
  }
  console.error("Redis error:", err.message);
});

redis.on("connect", () => {
  redisConnected = true;
  console.log("✅ Redis connected");
});

redis.on("close", () => {
  redisConnected = false;
});

// Try to connect (but don't fail if unavailable)
redis.connect().catch(() => {
  console.warn("⚠️  Redis unavailable - continuing without Redis");
});

redisPub.connect().catch(() => {});
redisSub.connect().catch(() => {});

// Subscribe to inventory update events (only if connected)
redisSub
  .subscribe("inventory:updates", (err, count) => {
    if (err) {
      console.error("Failed to subscribe to inventory updates:", err);
    } else {
      console.log(`Subscribed to ${count} channel(s)`);
    }
  })
  .catch(() => {});

redisSub.on("message", (channel, message) => {
  console.log(`[Redis] Received message from ${channel}:`, message);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  if (redisConnected) {
    await redis.quit();
    await redisPub.quit();
    await redisSub.quit();
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  if (redisConnected) {
    await redis.quit();
    await redisPub.quit();
    await redisSub.quit();
  }
  process.exit(0);
});

export const isRedisAvailable = () => redisConnected;
export default redis;
