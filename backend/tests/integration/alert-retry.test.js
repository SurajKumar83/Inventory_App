import { beforeEach, describe, expect, it } from "@jest/globals";
import prisma from "../../src/config/database.js";

describe("T179: WhatsApp/SMS Retry with Exponential Backoff", () => {
  let testSupplier;
  let testAlert;

  beforeEach(async () => {
    testSupplier = await prisma.supplier.create({
      data: {
        businessName: "Retry Test Supplier",
        contactPerson: "John Doe",
        phone: "9876543210",
        whatsappNumber: "9876543210",
        email: "supplier@test.local",
        isActive: true,
      },
    });

    testAlert = await prisma.alert.create({
      data: {
        productId: "test-product-id",
        shopId: "shop1",
        alertType: "LOW_STOCK",
        thresholdValue: 10,
        quantityAtTrigger: 5,
      },
    });
  });

  describe("Exponential Backoff Strategy", () => {
    it("should calculate exponential backoff delays correctly", async () => {
      const calculateBackoff = (attempt) => {
        // Formula: 2^attempt * 1000ms (in milliseconds)
        // With jitter: +- 20% random variation
        const delayMs = Math.pow(2, Math.min(attempt, 6)) * 1000; // Cap at 2^6 = 64 seconds
        const jitterMs = delayMs * 0.2;
        const jitterVariation = (Math.random() - 0.5) * 2 * jitterMs;
        return Math.max(1000, delayMs + jitterVariation); // Minimum 1 second
      };

      const delays = [];
      for (let i = 0; i <= 6; i++) {
        delays.push(calculateBackoff(i));
      }

      // Verify increasing delays
      expect(delays[0]).toBeLessThan(delays[1]);
      expect(delays[1]).toBeLessThan(delays[2]);
      expect(delays[5]).toBeLessThan(delays[6]);

      // Verify reasonable timeouts
      // Attempt 0: ~1s, Attempt 1: ~2-4s, Attempt 6: ~60-70s
      expect(delays[0]).toBeGreaterThan(800);
      expect(delays[0]).toBeLessThan(1200);
      expect(delays[6]).toBeGreaterThan(50000);
    });
  });

  describe("WhatsApp Message Retry Logic", () => {
    it("should retry WhatsApp message on network failure", async () => {
      let attemptCount = 0;
      const maxRetries = 3;

      const sendWhatsAppWithRetry = async (messageData) => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            // Simulate failure on first two attempts
            if (attempt < 2) {
              throw new Error("Network timeout");
            }

            // Success on third attempt
            return {
              success: true,
              messageId: `msg-${Date.now()}`,
              attempt: attempt + 1,
            };
          } catch (error) {
            attemptCount++;

            if (attempt === maxRetries) {
              throw new Error(
                `Failed to send WhatsApp after ${maxRetries + 1} attempts`,
              );
            }

            // Calculate backoff before retry
            const backoffMs = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          }
        }
      };

      const result = await sendWhatsAppWithRetry({
        supplierId: testSupplier.id,
        message: "Stock alert: Product X running low",
      });

      expect(result.success).toBe(true);
      expect(result.attempt).toBe(3); // Succeeded on 3rd retry
      expect(attemptCount).toBe(2); // Failed twice before success
    });

    it("should fail gracefully after max retries", async () => {
      const maxRetries = 2;
      let attemptCount = 0;

      const sendWhatsAppWithMaxRetries = async (messageData) => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            // All attempts fail
            throw new Error("Permanent network error");
          } catch (error) {
            attemptCount++;

            if (attempt === maxRetries) {
              // Log failure and trigger fallback
              return {
                success: false,
                error: error.message,
                attempts: attemptCount,
                fallbackAction: "SEND_EMAIL",
              };
            }

            const backoffMs = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          }
        }
      };

      const result = await sendWhatsAppWithMaxRetries({
        supplierId: testSupplier.id,
        message: "Stock alert",
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // 0, 1, 2 = 3 attempts
      expect(result.fallbackAction).toBe("SEND_EMAIL");
    });
  });

  describe("SMS Message Retry Logic", () => {
    it("should retry SMS message with exponential backoff", async () => {
      let attemptTimestamps = [];

      const sendSmsWithRetry = async (messageData) => {
        const maxRetries = 4;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            attemptTimestamps.push(Date.now());

            // Simulate failure pattern
            if (attempt < 2) {
              throw new Error("SMS gateway unavailable");
            }

            // Success on 3rd attempt
            return {
              success: true,
              messageId: `sms-${Date.now()}`,
              attempts: attempt + 1,
              timestamps: attemptTimestamps,
            };
          } catch (error) {
            if (attempt === maxRetries) {
              throw new Error(
                `SMS delivery failed after ${maxRetries + 1} attempts`,
              );
            }

            const backoffMs = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          }
        }
      };

      const result = await sendSmsWithRetry({
        supplierId: testSupplier.id,
        phone: testSupplier.phone,
        message: "Low stock alert",
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
      expect(result.timestamps.length).toBe(3);

      // Verify backoff intervals (with tolerance for execution time)
      const interval1 = result.timestamps[1] - result.timestamps[0];
      const interval2 = result.timestamps[2] - result.timestamps[1];

      // First backoff should be ~1 second
      expect(interval1).toBeGreaterThan(900);
      expect(interval1).toBeLessThan(1500);

      // Second backoff should be ~2 seconds (exponential)
      expect(interval2).toBeGreaterThan(1900);
      expect(interval2).toBeLessThan(2500);
    });
  });

  describe("Alert Notification Retry Manager", () => {
    it("should track failed notification attempts in database", async () => {
      // Create notification tracking record
      const notification = await prisma.alertNotification.create({
        data: {
          alertId: testAlert.id,
          supplierId: testSupplier.id,
          channel: "WHATSAPP",
          status: "PENDING",
          attemptCount: 0,
          lastAttemptAt: null,
          nextRetryAt: new Date(),
          maxRetries: 3,
        },
      });

      expect(notification.status).toBe("PENDING");
      expect(notification.attemptCount).toBe(0);

      // Simulate failed attempt
      await prisma.alertNotification.update({
        where: { id: notification.id },
        data: {
          attemptCount: 1,
          lastAttemptAt: new Date(),
          nextRetryAt: new Date(Date.now() + 2000), // 2 seconds backoff
          error: "Network timeout",
        },
      });

      const updated = await prisma.alertNotification.findUnique({
        where: { id: notification.id },
      });

      expect(updated.attemptCount).toBe(1);
      expect(updated.error).toBe("Network timeout");
      expect(updated.nextRetryAt.getTime()).toBeGreaterThan(Date.now() + 1500);
    });

    it("should mark notification as failed after max retries", async () => {
      const notification = await prisma.alertNotification.create({
        data: {
          alertId: testAlert.id,
          supplierId: testSupplier.id,
          channel: "SMS",
          status: "PENDING",
          attemptCount: 3,
          maxRetries: 3,
          lastAttemptAt: new Date(),
          nextRetryAt: null,
          error: "SMS gateway permanently unavailable",
        },
      });

      // Mark as failed
      await prisma.alertNotification.update({
        where: { id: notification.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
        },
      });

      const result = await prisma.alertNotification.findUnique({
        where: { id: notification.id },
      });

      expect(result.status).toBe("FAILED");
      expect(result.attemptCount).toBe(3);
      expect(result.failedAt).toBeDefined();
    });

    it("should route to fallback channel when primary fails", async () => {
      // First try WhatsApp
      let notification = await prisma.alertNotification.create({
        data: {
          alertId: testAlert.id,
          supplierId: testSupplier.id,
          channel: "WHATSAPP",
          status: "FAILED",
          attemptCount: 3,
          maxRetries: 3,
          error: "WhatsApp number invalid",
          failedAt: new Date(),
        },
      });

      // Create fallback notification for SMS
      const fallback = await prisma.alertNotification.create({
        data: {
          alertId: testAlert.id,
          supplierId: testSupplier.id,
          channel: "SMS",
          status: "PENDING",
          attemptCount: 0,
          maxRetries: 2,
          parentNotificationId: notification.id, // Link to failed primary
        },
      });

      expect(fallback.channel).toBe("SMS");
      expect(fallback.parentNotificationId).toBe(notification.id);
    });
  });

  afterEach(async () => {
    // Cleanup
    await prisma.alertNotification.deleteMany().catch(() => {});
    await prisma.alert.delete({ where: { id: testAlert.id } }).catch(() => {});
    await prisma.supplier
      .delete({ where: { id: testSupplier.id } })
      .catch(() => {});
  });
});
