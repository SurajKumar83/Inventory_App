import NetInfo from "@react-native-community/netinfo";
import { adjustStock, transferStock } from "./inventory.service.js";
import {
  clearCompletedOperations,
  getPendingOperations,
  removeFromQueue,
  updateOperationStatus,
} from "./offlineQueue.js";

let syncInterval = null;
let isOnline = false;

// Initialize sync manager
export const initSyncManager = () => {
  // Listen to network state changes
  NetInfo.addEventListener((state) => {
    const wasOffline = !isOnline;
    isOnline = state.isConnected && state.isInternetReachable;

    console.log("Network state:", {
      connected: state.isConnected,
      reachable: state.isInternetReachable,
      type: state.type,
    });

    // If coming back online, trigger sync
    if (wasOffline && isOnline) {
      console.log("Coming back online, starting sync...");
      syncPendingOperations();
    }
  });

  // Start periodic sync every 30 seconds
  startPeriodicSync(30000);
};

// Start periodic sync
export const startPeriodicSync = (intervalMs = 30000) => {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(() => {
    if (isOnline) {
      syncPendingOperations();
    }
  }, intervalMs);
};

// Stop periodic sync
export const stopPeriodicSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};

// Sync pending operations
export const syncPendingOperations = async () => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected || !netInfo.isInternetReachable) {
    console.log("Cannot sync: offline");
    return { success: false, reason: "offline" };
  }

  const pendingOps = await getPendingOperations();
  if (pendingOps.length === 0) {
    console.log("No pending operations to sync");
    return { success: true, synced: 0 };
  }

  console.log(`Syncing ${pendingOps.length} pending operations...`);
  let syncedCount = 0;
  let failedCount = 0;

  for (const operation of pendingOps) {
    // Skip if max retries exceeded (3 attempts)
    if (operation.retryCount >= 3) {
      console.log(
        `Operation ${operation.id} exceeded max retries, marking as failed`,
      );
      await updateOperationStatus(
        operation.id,
        "failed",
        "Max retries exceeded",
      );
      failedCount++;
      continue;
    }

    try {
      await updateOperationStatus(operation.id, "processing");

      // Execute the operation based on type
      switch (operation.type) {
        case "adjustStock":
          await adjustStock({
            productId: operation.data.productId,
            shopId: operation.data.shopId,
            quantity: operation.data.quantity,
            reason: operation.data.reason,
          });
          break;

        case "transferStock":
          await transferStock({
            productId: operation.data.productId,
            fromShopId: operation.data.fromShopId,
            toShopId: operation.data.toShopId,
            quantity: operation.data.quantity,
            reason: operation.data.reason,
          });
          break;

        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      // Mark as completed and remove from queue
      await updateOperationStatus(operation.id, "completed");
      await removeFromQueue(operation.id);
      syncedCount++;
      console.log(`Operation ${operation.id} synced successfully`);
    } catch (error) {
      console.error(`Failed to sync operation ${operation.id}:`, error);
      await updateOperationStatus(
        operation.id,
        "pending",
        error.response?.data?.error || error.message,
      );
      failedCount++;
    }
  }

  // Clear completed operations periodically
  await clearCompletedOperations();

  console.log(`Sync completed: ${syncedCount} synced, ${failedCount} failed`);
  return { success: true, synced: syncedCount, failed: failedCount };
};

// Check if online
export const checkOnlineStatus = async () => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected && netInfo.isInternetReachable;
};

// Force sync now
export const forceSyncNow = async () => {
  return await syncPendingOperations();
};
