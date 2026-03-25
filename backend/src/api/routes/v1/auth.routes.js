import express from "express";
import { body } from "express-validator";
import prisma from "../../../config/database.js";
import redis from "../../../config/redis.js";
import {
  comparePassword,
  generateAccessToken,
  generateOTP,
  generateRefreshToken,
  hashPassword,
  storeOTP,
  verifyOTP,
  verifyRefreshToken,
} from "../../../services/auth.service.js";
import { sendOTPEmail } from "../../../services/email.service.js";
import {
  loginLimiter,
  publicLimiter,
} from "../../middleware/rateLimiter.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = express.Router();

// POST /api/v1/auth/register
router.post(
  "/register",
  publicLimiter,
  [
    body("email").isEmail().normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("firstName").trim().notEmpty(),
    body("lastName").trim().notEmpty(),
    body("phone")
      .optional()
      .matches(/^\+91[0-9]{10}$/),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user (only OWNER can be created via register in v1)
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          role: role || "OWNER",
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          mfaEnabled: true,
        },
      });

      res.status(201).json({
        message: "User registered successfully",
        user,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  },
);

// POST /api/v1/auth/login
router.post(
  "/login",
  loginLimiter,
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await comparePassword(
        password,
        user.passwordHash,
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // If MFA enabled, send OTP
      if (user.mfaEnabled) {
        const otp = generateOTP();
        await storeOTP(redis, user.id, otp);
        await sendOTPEmail(user.email, otp, user.firstName);

        return res.json({
          message: "OTP sent to your email",
          requiresMFA: true,
          userId: user.id,
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id, user.tokenVersion);

      res.json({
        message: "Login successful",
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  },
);

// POST /api/v1/auth/mfa/verify
router.post(
  "/mfa/verify",
  loginLimiter,
  [body("userId").isUUID(), body("otp").isLength({ min: 6, max: 6 })],
  validate,
  async (req, res) => {
    try {
      const { userId, otp } = req.body;

      // Verify OTP
      const isValid = await verifyOTP(redis, userId, otp);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid or expired OTP" });
      }

      // Get user
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email, user.role);
      const refreshToken = generateRefreshToken(user.id, user.tokenVersion);

      res.json({
        message: "MFA verification successful",
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("MFA verification error:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  },
);

// POST /api/v1/auth/refresh
router.post(
  "/refresh",
  publicLimiter,
  [body("refreshToken").notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const { user } = await verifyRefreshToken(refreshToken);

      // Generate new access token
      const accessToken = generateAccessToken(user.id, user.email, user.role);

      res.json({
        message: "Token refreshed",
        accessToken,
      });
    } catch (error) {
      res.status(401).json({ error: "Invalid refresh token" });
    }
  },
);

// POST /api/v1/auth/logout
router.post("/logout", async (req, res) => {
  // Client should delete tokens
  // Optionally increment tokenVersion to invalidate all refresh tokens
  res.json({ message: "Logged out successfully" });
});

export default router;
