import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../../../shared/api-client/endpoints.js";
import apiClient from "../../../../shared/api-client/index.js";
import DashboardCard from "./DashboardCard.jsx";

export default function OverviewMetrics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.DASHBOARD.STATS);
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-md p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600 font-semibold">{error}</p>
        <button
          onClick={loadStats}
          className="mt-2 text-red-700 hover:text-red-800 font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Products"
          value={stats.totalProducts}
          subtitle={`Across ${stats.totalShops} shops`}
          icon="📦"
          color="blue"
          onClick={() => navigate("/inventory")}
        />

        <DashboardCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          subtitle={`${stats.activeAlertsCount} active alerts`}
          icon="⚠️"
          color="yellow"
          onClick={() => navigate("/alerts")}
        />

        <DashboardCard
          title="Today's Sales"
          value={`₹${stats.todaysSales.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${stats.todaysOrderCount} orders`}
          icon="💰"
          color="green"
        />

        <DashboardCard
          title="Pending Orders"
          value={stats.pendingOrdersCount}
          subtitle="Awaiting confirmation"
          icon="🛒"
          color="purple"
          onClick={() => navigate("/orders?status=PENDING")}
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <DashboardCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon="👥"
          color="blue"
        />

        <DashboardCard
          title="Suppliers"
          value={stats.totalSuppliers}
          icon="🚛"
          color="green"
          onClick={() => navigate("/suppliers")}
        />

        <DashboardCard
          title="Active Shops"
          value={stats.totalShops}
          icon="🏪"
          color="purple"
        />
      </div>

      {/* Recent Orders */}
      {stats.recentOrders && stats.recentOrders.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
            <button
              onClick={() => navigate("/orders")}
              className="text-dukaan-green-600 hover:text-dukaan-green-700 font-semibold text-sm"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/orders`)}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    Order #{order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.customerName} • {order.itemCount} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-dukaan-green-600">
                    ₹{order.total.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
