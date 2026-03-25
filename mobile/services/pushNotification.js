import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import apiClient from "../../../shared/api-client/index.js";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and send token to backend
 */
export const registerForPushNotifications = async () => {
  try {
    if (!Device.isDevice) {
      console.log("Push notifications only work on physical devices");
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permissions not granted");
      return null;
    }

    // Get push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID || "your-project-id",
    });
    const pushToken = tokenData.data;

    // Send token to backend
    await apiClient.post("/devices/register", { pushToken });

    console.log("Push token registered:", pushToken);
    return pushToken;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
};

/**
 * Setup notification listeners
 */
export const setupNotificationListeners = (
  onNotification,
  onNotificationResponse,
) => {
  // Listener for notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received:", notification);
      if (onNotification) {
        onNotification(notification);
      }
    },
  );

  // Listener for when user interacts with notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification response:", response);
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};

/**
 * Get current notification badge count
 */
export const getBadgeCount = async () => {
  const count = await Notifications.getBadgeCountAsync();
  return count;
};

/**
 * Set notification badge count
 */
export const setBadgeCount = async (count) => {
  await Notifications.setBadgeCountAsync(count);
};

/**
 * Clear all notifications
 */
export const clearNotifications = async () => {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
};
