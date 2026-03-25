import { Expo } from "expo-server-sdk";

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to a device
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  // Check that the token is valid
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return null;
  }

  // Construct the message
  const messages = [
    {
      to: pushToken,
      sound: "default",
      title,
      body,
      data,
      priority: "high",
      channelId: "low-stock-alerts",
    },
  ];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Error sending push notification chunk:", error);
      }
    }

    return tickets;
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
};

/**
 * Send low-stock alert push notification
 */
const sendLowStockAlertPush = async (
  pushToken,
  product,
  shop,
  currentStock,
  unit,
) => {
  return sendPushNotification(
    pushToken,
    "Low Stock Alert",
    `${product.name} at ${shop.name}: ${currentStock} ${unit} remaining`,
    {
      type: "LOW_STOCK",
      productId: product.id,
      shopId: shop.id,
      currentStock,
    },
  );
};

/**
 * Send push notification to all user devices
 */
const sendPushToUser = async (userId, title, body, data = {}) => {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  try {
    // Get all active device tokens for the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true },
    });

    if (!user || !user.pushToken) {
      console.log(`No push token found for user ${userId}`);
      return [];
    }

    return await sendPushNotification(user.pushToken, title, body, data);
  } catch (error) {
    console.error("Error sending push to user:", error);
    throw error;
  }
};

export { sendLowStockAlertPush, sendPushNotification, sendPushToUser };

