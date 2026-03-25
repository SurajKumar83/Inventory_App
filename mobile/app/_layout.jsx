import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import useAuthStore from "../../shared/stores/authStore";
import {
  registerForPushNotifications,
  setupNotificationListeners,
} from "../services/pushNotification";
import { initSyncManager } from "../services/syncManager";

export default function RootLayout() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check authentication on mount
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      // Initialize sync manager for offline queue
      initSyncManager();

      // Register for push notifications
      registerForPushNotifications().catch((err) =>
        console.error("Failed to register push notifications:", err),
      );

      // Setup notification listeners
      const cleanup = setupNotificationListeners(
        (notification) => {
          // Handle notification received while app is foregrounded
          console.log("Foreground notification:", notification);
        },
        (response) => {
          // Handle user interaction with notification
          const data = response.notification.request.content.data;

          if (data.type === "LOW_STOCK") {
            // Navigate to alerts tab
            router.push("/(tabs)/alerts");
          }
        },
      );

      return cleanup;
    }
  }, [isAuthenticated]);

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(modals)/stock-adjust"
        options={{
          presentation: "modal",
          title: "Adjust Stock",
        }}
      />
      <Stack.Screen
        name="(modals)/transfer"
        options={{
          presentation: "modal",
          title: "Transfer Stock",
        }}
      />
    </Stack>
  );
}
