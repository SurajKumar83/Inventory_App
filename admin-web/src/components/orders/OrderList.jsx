import { useState } from "react";
import { ENDPOINTS } from "../../../../shared/api-client/endpoints.js";
import apiClient from "../../../../shared/api-client/index.js";

export default function OrderList({ orders, loading, onOrderUpdated }) {
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-purple-100 text-purple-800",
    SHIPPED: "bg-orange-100 text-orange-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const statusOptions = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
  ];

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      await apiClient.patch(ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
        status: newStatus,
      });
      onOrderUpdated();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update order status");
    } finally {
      setUpdatingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-dukaan-green-600"></div>
        <p className="mt-4 text-gray-600">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No orders found
        </h3>
        <p className="text-gray-600">
          Orders will appear here when customers place them
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Order #{order.orderNumber}
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Customer: {order.customer.name} ({order.customer.email})
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}
                >
                  {order.status}
                </span>
                <p className="text-xl font-bold text-dukaan-green-600">
                  ₹{order.total.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Items:
              </h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="font-semibold">
                      ₹{item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            {order.deliveryAddress && (
              <div className="border-t border-gray-200 pt-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                  Delivery Address:
                </h4>
                <p className="text-sm text-gray-600">
                  {order.deliveryAddress.addressLine1},{" "}
                  {order.deliveryAddress.city}, {order.deliveryAddress.state} -{" "}
                  {order.deliveryAddress.postalCode}
                </p>
                <p className="text-sm text-gray-600">
                  Phone: {order.deliveryAddress.phone}
                </p>
              </div>
            )}

            {/* Fulfillment Shop */}
            {order.fulfillmentShop && (
              <div className="border-t border-gray-200 pt-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                  Fulfillment Shop:
                </h4>
                <p className="text-sm text-gray-600">
                  {order.fulfillmentShop.name}
                </p>
              </div>
            )}

            {/* Payment Info */}
            {order.payments && order.payments.length > 0 && (
              <div className="border-t border-gray-200 pt-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                  Payment:
                </h4>
                <p className="text-sm text-gray-600">
                  Method: {order.paymentMethod} | Status:{" "}
                  {order.payments[0].status}
                </p>
              </div>
            )}

            {/* Status Update */}
            {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Update Status:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {statusOptions
                    .filter((status) => status !== order.status)
                    .map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(order.id, status)}
                        disabled={updatingOrder === order.id}
                        className="px-3 py-1.5 bg-dukaan-green-600 hover:bg-dukaan-green-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded"
                      >
                        {updatingOrder === order.id
                          ? "Updating..."
                          : `Mark as ${status}`}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
