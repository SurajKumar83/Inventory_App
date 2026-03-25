import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "@dukaansync:offline_queue";

// Add operation to offline queue
export const addToQueue = async (operation) => {
  try {
    const queue = await getQueue();
    const newOperation = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: "pending", // pending, processing, completed, failed
      retryCount: 0,
      ...operation,
    };
    queue.push(newOperation);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return newOperation;
  } catch (error) {
    console.error("Failed to add operation to queue:", error);
    throw error;
  }
};

// Get all queued operations
export const getQueue = async () => {
  try {
    const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error("Failed to get queue:", error);
    return [];
  }
};

// Get pending operations
export const getPendingOperations = async () => {
  const queue = await getQueue();
  return queue.filter((op) => op.status === "pending");
};

// Update operation status
export const updateOperationStatus = async (
  operationId,
  status,
  error = null,
) => {
  try {
    const queue = await getQueue();
    const index = queue.findIndex((op) => op.id === operationId);

    if (index !== -1) {
      queue[index].status = status;
      if (error) {
        queue[index].error = error;
      }
      if (status === "processing") {
        queue[index].retryCount += 1;
      }
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (error) {
    console.error("Failed to update operation status:", error);
  }
};

// Remove operation from queue
export const removeFromQueue = async (operationId) => {
  try {
    const queue = await getQueue();
    const filteredQueue = queue.filter((op) => op.id !== operationId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filteredQueue));
  } catch (error) {
    console.error("Failed to remove operation from queue:", error);
  }
};

// Clear completed operations
export const clearCompletedOperations = async () => {
  try {
    const queue = await getQueue();
    const pendingQueue = queue.filter((op) => op.status !== "completed");
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(pendingQueue));
  } catch (error) {
    console.error("Failed to clear completed operations:", error);
  }
};

// Get queue stats
export const getQueueStats = async () => {
  const queue = await getQueue();
  return {
    total: queue.length,
    pending: queue.filter((op) => op.status === "pending").length,
    processing: queue.filter((op) => op.status === "processing").length,
    completed: queue.filter((op) => op.status === "completed").length,
    failed: queue.filter((op) => op.status === "failed").length,
  };
};
