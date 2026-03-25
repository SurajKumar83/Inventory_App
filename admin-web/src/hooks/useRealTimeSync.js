import { useCallback, useEffect, useState } from "react";
import apiClient from "../../../shared/api-client/index.js";

/**
 * Real-time sync hook with polling
 * Polls for inventory updates every 2 seconds
 */
export default function useRealTimeSync(onUpdate) {
  const [lastPoll, setLastPoll] = useState(Date.now());
  const [isPolling, setIsPolling] = useState(true);

  const poll = useCallback(async () => {
    if (!isPolling) return;

    try {
      const response = await apiClient.get(`/events/poll?since=${lastPoll}`);

      if (response.data.events && response.data.events.length > 0) {
        // Notify about new events
        if (onUpdate) {
          onUpdate(response.data.events);
        }
      }

      // Update last poll timestamp
      setLastPoll(response.data.timestamp);
    } catch (error) {
      console.error("Polling error:", error);
    }
  }, [lastPoll, isPolling, onUpdate]);

  useEffect(() => {
    if (!isPolling) return;

    // Initial poll
    poll();

    // Poll every 2 seconds
    const interval = setInterval(poll, 2000);

    return () => clearInterval(interval);
  }, [poll, isPolling]);

  const pause = useCallback(() => setIsPolling(false), []);
  const resume = useCallback(() => setIsPolling(true), []);

  return { pause, resume, isPolling };
}
