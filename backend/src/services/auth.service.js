import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/database.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// Generate access token
export const generateAccessToken = (userId, email, role) => {
  return jwt.sign({ userId, email, role, type: "access" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Generate refresh token
export const generateRefreshToken = (userId, tokenVersion) => {
  return jwt.sign(
    { userId, tokenVersion, type: "refresh" },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN },
  );
};

// Verify access token
export const verifyAccessToken = (token) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== "access") {
      throw new Error("Invalid token type");
    }
    return payload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

// Verify refresh token
export const verifyRefreshToken = async (token) => {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET);
    if (payload.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    // Check if token version matches (invalidates old tokens on password change)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new Error("Token invalidated");
    }

    return { user, payload };
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

// Hash password
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Compare password
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Generate OTP for MFA
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Store OTP in Redis with expiry (5 minutes)
export const storeOTP = async (redis, userId, otp) => {
  const key = `otp:${userId}`;
  await redis.setex(key, 300, otp); // 5 minutes expiry
};

// Verify OTP from Redis
export const verifyOTP = async (redis, userId, otp) => {
  const key = `otp:${userId}`;
  const storedOTP = await redis.get(key);

  if (!storedOTP || storedOTP !== otp) {
    return false;
  }

  // Delete OTP after successful verification
  await redis.del(key);
  return true;
};

// Invalidate all refresh tokens by incrementing tokenVersion
export const invalidateRefreshTokens = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  generateOTP,
  storeOTP,
  verifyOTP,
  invalidateRefreshTokens,
};
