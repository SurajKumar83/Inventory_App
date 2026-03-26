import { useCallback, useEffect, useRef, useState } from "react";
import useAuthStore from "../store/authStore.js";

/**
 * Real-time sync hook with Server-Sent Events (SSE)
 * Establishes persistent connection to receive inventory updates instantly
 * Falls back to 60-second polling if SSE connection fails repeatedly
 */
export default function useRealTimeSync(onUpdate) {
  const { accessToken } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [usePolling, setUsePolling] = useState(false);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const lastPollRef = useRef(Date.now());
  const pollingIntervalRef = useRef(null);

  // SSE connection logic
  const connectSSE = useCallback(() => {
    if (usePolling || !accessToken) return;

    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
      const eventSource = new EventSource(`${apiUrl}/events/stream`);

      eventSource.addEventListener("connected", () => {
        console.log("SSE connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      });

      eventSource.addEventListener("inventory_update", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onUpdate) {
            onUpdate([data]);
          }
        } catch (error) {
          console.error("Error parsing SSE inventory_update:", error);
        }
      });

      eventSource.addEventListener("heartbeat", () => {
        // Heartbeat received - connection is healthy
      });

      eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        setIsConnected(false);
        eventSource.close();

        // Increment reconnect attempts
        reconnectAttemptsRef.current += 1;

        // Fall back to polling after 3 failed attempts
        if (reconnectAttemptsRef.current >= 3) {
          console.warn(
            "SSE connection failed 3 times, falling back to polling",
          );
          setUsePolling(true);
          return;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 4000);
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(
            `Reconnecting SSE (attempt ${reconnectAttemptsRef.current})...`,
          );
          connectSSE();
        }, delay);
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error("Error creating SSE connection:", error);
      setUsePolling(true);
    }
  }, [accessToken, onUpdate, usePolling]);

  // Polling fallback logic
  const poll = useCallback(async () => {
    if (!usePolling) return;

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
      const response = await fetch(
        `${apiUrl}/events/poll?since=${lastPollRef.current}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const data = await response.json();

      if (data.events && data.events.length > 0 && onUpdate) {
        onUpdate(data.events);
      }

      lastPollRef.current = data.timestamp;
    } catch (error) {
      console.error("Polling error:", error);
    }
  }, [accessToken, onUpdate, usePolling]);

  // Initialize connection
  useEffect(() => {
    if (usePolling) {
      // Start polling every 60 seconds
      poll();
      pollingIntervalRef.current = setInterval(poll, 60000);
    } else {
      // Try SSE connection
      connectSSE();
    }

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [connectSSE, poll, usePolling]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (usePolling) {
      poll();
    } else {
      // For SSE, just notify that refresh was requested
      // The connection will receive updates automatically
      console.log("Refresh requested (SSE mode - updates are automatic)");
    }
  }, [poll, usePolling]);

  return {
    isConnected: usePolling ? true : isConnected,
    refresh,
    mode: usePolling ? "polling" : "sse",
  };
}
