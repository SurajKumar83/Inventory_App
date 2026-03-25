import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cancelOrder, getOrderById } from "../services/order.service.js";

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const data = await getOrderById(id);
      setOrder(data);
    } catch (err) {
      console.error("Failed to load order:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    setCancelling(true);
    try {
      await cancelOrder(id);
      loadOrder(); // Reload to show updated status
      alert("Order cancelled successfully");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-dukaan-green-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Order not found
        </h2>
        <button
          onClick={() => navigate("/")}
          className="bg-dukaan-green-600 hover:bg-dukaan-green-700 text-white font-semibold py-2 px-6 rounded-lg"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const statusSteps = [
    { status: "PENDING", label: "Order Placed", icon: "📝" },
    { status: "CONFIRMED", label: "Confirmed", icon: "✅" },
    { status: "PROCESSING", label: "Processing", icon: "📦" },
    { status: "SHIPPED", label: "Shipped", icon: "🚚" },
    { status: "DELIVERED", label: "Delivered", icon: "✨" },
  ];

  const statusIndex = statusSteps.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === "CANCELLED";

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-purple-100 text-purple-800",
    SHIPPED: "bg-orange-100 text-orange-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const paymentStatusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Order #{order.orderNumber}
        </h1>
        <span
          className={`px-4 py-2 rounded-full font-semibold ${statusColors[order.status]}`}
        >
          {order.status}
        </span>
      </div>

      {/* Order Timeline */}
      {!isCancelled && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status</h2>
          <div className="relative">
            <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-dukaan-green-600 transition-all duration-300"
                style={{
                  width: `${(statusIndex / (statusSteps.length - 1)) * 100}%`,
                }}
              />
            </div>
            <div className="relative flex justify-between">
              {statusSteps.map((step, index) => (
                <div key={step.status} className="flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 ${
                      index <= statusIndex
                        ? "bg-dukaan-green-600 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span
                    className={`text-sm font-semibold text-center ${
                      index <= statusIndex ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">❌</span>
            <div>
              <h3 className="font-bold text-red-900">Order Cancelled</h3>
              <p className="text-red-600">This order has been cancelled</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Delivery Address
          </h2>
          {order.deliveryAddress && (
            <>
              <p className="font-semibold">{order.deliveryAddress.label}</p>
              <p className="text-gray-600">
                {order.deliveryAddress.addressLine1}
                {order.deliveryAddress.addressLine2 &&
                  `, ${order.deliveryAddress.addressLine2}`}
              </p>
              <p className="text-gray-600">
                {order.deliveryAddress.city}, {order.deliveryAddress.state} -{" "}
                {order.deliveryAddress.postalCode}
              </p>
              <p className="text-gray-600 mt-2">
                Phone: {order.deliveryAddress.phone}
              </p>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Payment Information
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Method:</span>
              <span className="font-semibold">{order.paymentMethod}</span>
            </div>
            {order.payments && order.payments.length > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-sm font-semibold ${
                      paymentStatusColors[order.payments[0].status]
                    }`}
                  >
                    {order.payments[0].status}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-0"
            >
              {item.product.imageUrl ? (
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-2xl">
                  📦
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {item.product.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity} {item.product.unit}
                </p>
                <p className="text-sm text-gray-600">
                  Price: ₹{item.price.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  ₹{item.subtotal.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold">₹{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax</span>
            <span className="font-semibold">₹{order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee</span>
            <span className="font-semibold">
              {order.deliveryFee === 0 ? (
                <span className="text-dukaan-green-600">FREE</span>
              ) : (
                `₹${order.deliveryFee.toFixed(2)}`
              )}
            </span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-dukaan-green-600">
              ₹{order.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {order.status === "PENDING" && (
        <div className="flex justify-end">
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg"
          >
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        </div>
      )}
    </div>
  );
}
