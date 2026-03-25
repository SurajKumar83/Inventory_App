import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";
import useAuthStore from "../../../shared/stores/authStore.js";
import Button from "../components/common/Button.jsx";
import Sidebar from "../components/dashboard/Sidebar.jsx";
import OrderList from "../components/orders/OrderList.jsx";

export default function Orders() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadOrders();
  }, [statusFilter, pagination.page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (statusFilter) queryParams.append("status", statusFilter);

      const response = await apiClient.get(
        `${ENDPOINTS.ORDERS.LIST}?${queryParams.toString()}`,
      );
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdated = () => {
    loadOrders();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const statusOptions = [
    { value: "", label: "All Orders" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "PROCESSING", label: "Processing" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  // Filter orders locally by search term if provided
  const filteredOrders = searchTerm
    ? orders.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : orders;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-dukaan-green-600">
                Orders Management
              </h1>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => navigate("/inventory")}
                >
                  Inventory
                </Button>
                <Button variant="secondary" onClick={() => navigate("/alerts")}>
                  Alerts
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/suppliers")}
                >
                  Suppliers
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Orders
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by order number, customer name or email..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <OrderList
            orders={filteredOrders}
            loading={loading}
            onOrderUpdated={handleOrderUpdated}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-semibold"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {pagination.page} of {pagination.totalPages} (
                {pagination.total} total orders)
              </span>
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-semibold"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
