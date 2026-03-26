import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis, { isRedisAvailable } from "../../config/redis.js";

// Helper to create store (Redis or memory)
const createStore = (prefix) => {
  if (isRedisAvailable()) {
    return new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix,
    });
  }
  // Fall back to in-memory store when Redis is unavailable
  return undefined; // express-rate-limit uses memory store by default
};

// Rate limiter for authenticated routes (100 req/min)
export const authenticatedLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: "Too many requests from this user, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("rl:auth:"),
  keyGenerator: (req) => req.user?.userId || req.ip,
});

// Rate limiter for public routes (30 req/min)
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("rl:public:"),
  keyGenerator: (req) => req.ip,
});

// Strict rate limiter for login attempts (20 req/min per IP)
// Allows for development/testing while still preventing brute force attacks
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: "Too many login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("rl:login:"),
  keyGenerator: (req) => req.ip,
});

export default { authenticatedLimiter, publicLimiter, loginLimiter };
