import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";
import useAuthStore from "../../../shared/stores/authStore.js";
import { createOrder } from "../services/order.service.js";
import { initiateRazorpayPayment } from "../services/payment.service.js";
import useCartStore from "../store/cartStore.js";

export default function Checkout() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { items, clearCart, getTotal } = useCartStore();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("RAZORPAY");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (items.length === 0) {
      navigate("/cart");
      return;
    }

    loadAddresses();
  }, [isAuthenticated, items]);

  const loadAddresses = async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.CUSTOMERS.ADDRESSES);
      setAddresses(response.data);
      if (response.data.length > 0) {
        setSelectedAddressId(response.data[0].id);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post(
        ENDPOINTS.CUSTOMERS.CREATE_ADDRESS,
        addressForm,
      );
      setAddresses([...addresses, response.data]);
      setSelectedAddressId(response.data.id);
      setShowAddressForm(false);
      setAddressForm({
        label: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        phone: "",
      });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddressId: selectedAddressId,
        paymentMethod,
        notes,
      };

      const { order, payment } = await createOrder(orderData);

      if (paymentMethod === "RAZORPAY") {
        // Initiate Razorpay payment
        await initiateRazorpayPayment(
          order,
          payment,
          async (paymentResponse) => {
            // Payment success - send to backend webhook
            try {
              await apiClient.post(ENDPOINTS.ORDERS.PAYMENT_WEBHOOK, {
                ...paymentResponse,
                status: "success",
              });
              clearCart();
              navigate(`/orders/${order.id}`);
            } catch (err) {
              console.error("Payment verification failed:", err);
              alert("Payment verification failed. Please contact support.");
            }
          },
          async (reason) => {
            // Payment failed
            await apiClient.post(ENDPOINTS.ORDERS.PAYMENT_WEBHOOK, {
              razorpay_order_id: payment.razorpayOrderId,
              status: "failed",
              reason,
            });
            alert("Payment failed. Your order has been cancelled.");
            navigate("/cart");
          },
        );
      } else {
        // COD - order confirmed immediately
        clearCart();
        navigate(`/orders/${order.id}`);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Delivery Address
            </h2>

            {addresses.length === 0 && !showAddressForm && (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">No saved addresses</p>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="bg-dukaan-green-600 hover:bg-dukaan-green-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Add New Address
                </button>
              </div>
            )}

            {addresses.length > 0 && !showAddressForm && (
              <>
                <div className="space-y-3 mb-4">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedAddressId === address.id
                          ? "border-dukaan-green-600 bg-dukaan-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddressId === address.id}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="mr-3"
                      />
                      <div className="inline-block">
                        <p className="font-semibold">{address.label}</p>
                        <p className="text-sm text-gray-600">
                          {address.addressLine1},{" "}
                          {address.addressLine2 && `${address.addressLine2}, `}
                          {address.city}, {address.state} - {address.postalCode}
                        </p>
                        <p className="text-sm text-gray-600">
                          Phone: {address.phone}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="text-dukaan-green-600 hover:text-dukaan-green-700 font-semibold"
                >
                  + Add New Address
                </button>
              </>
            )}

            {showAddressForm && (
              <form onSubmit={handleAddAddress} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Label (e.g., Home, Office)
                  </label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, label: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine1}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        addressLine1: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine2}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        addressLine2: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, city: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={addressForm.state}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          state: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          postalCode: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          phone: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-dukaan-green-600 hover:bg-dukaan-green-700 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Payment Method
            </h2>
            <div className="space-y-3">
              <label className="block p-4 border-2 border-dukaan-green-600 bg-dukaan-green-50 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="RAZORPAY"
                  checked={paymentMethod === "RAZORPAY"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <span className="font-semibold">
                  Online Payment (UPI/Card/NetBanking)
                </span>
              </label>
              <label className="block p-4 border-2 border-gray-200 hover:border-gray-300 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <span className="font-semibold">Cash on Delivery</span>
              </label>
            </div>
          </div>

          {/* Order Notes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Order Notes (Optional)
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions for your order..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Order Summary
            </h2>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between text-sm"
                >
                  <span className="text-gray-600">
                    {item.product.name} x {item.quantity}
                  </span>
                  <span className="font-semibold">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">
                  ₹{useCartStore.getState().getSubtotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (18% GST)</span>
                <span className="font-semibold">
                  ₹{useCartStore.getState().getTax().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-semibold">
                  {useCartStore.getState().getDeliveryFee() === 0 ? (
                    <span className="text-dukaan-green-600">FREE</span>
                  ) : (
                    `₹${useCartStore.getState().getDeliveryFee().toFixed(2)}`
                  )}
                </span>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-dukaan-green-600">
                  ₹{getTotal().toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={loading || !selectedAddressId}
              className="w-full bg-dukaan-green-600 hover:bg-dukaan-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg text-lg mt-6"
            >
              {loading ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
