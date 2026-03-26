import { useEffect, useState } from "react";
import { getUnviewedAlertCount } from "../../services/alert.service.js";
import useAuthStore from "../../store/authStore.js";

export default function AlertBadge() {
  const [count, setCount] = useState(0);
  const { isAuthenticated, accessToken } = useAuthStore();

  useEffect(() => {
    // Only fetch if user is authenticated and has a token
    if (!isAuthenticated || !accessToken) {
      return;
    }

    fetchCount();

    // Poll every 60 seconds to stay in sync with server (reduced from 30s)
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, accessToken]);

  const fetchCount = async () => {
    try {
      const result = await getUnviewedAlertCount();
      setCount(result.count);
    } catch (err) {
      console.error("Failed to fetch alert count:", err);
      // Reset count on error to prevent stale data
      setCount(0);
    }
  };

  if (count === 0) return null;

  return (
    <div className="relative inline-flex items-center justify-center">
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
        {count > 9 ? "9+" : count}
      </span>
      <svg
        className="h-6 w-6 text-gray-600"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </div>
  );
}
