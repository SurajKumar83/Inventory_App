import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore.js';

export default function Cart() {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTax,
    getDeliveryFee,
    getTotal,
  } = useCartStore();

  const subtotal = getSubtotal();
  const tax = getTax();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add some products to get started!</p>
        <button
          onClick={() => navigate('/products')}
          className="bg-dukaan-green-600 hover:bg-dukaan-green-700 text-white font-semibold py-3 px-8 rounded-lg"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Items */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 text-sm font-semibold"
            >
              Clear Cart
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-b-0 last:pb-0"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                  <p className="text-sm text-gray-600">{item.product.category}</p>
                  <p className="text-lg font-bold text-dukaan-green-600 mt-1">
                    ₹{item.price.toFixed(2)} per {item.product.unit}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-red-600 hover:text-red-700 text-sm font-semibold mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (18% GST)</span>
            <span className="font-semibold">₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee</span>
            <span className="font-semibold">
              {deliveryFee === 0 ? (
                <span className="text-dukaan-green-600">FREE</span>
              ) : (
                `₹${deliveryFee.toFixed(2)}`
              )}
            </span>
          </div>
          {subtotal < 500 && (
            <p className="text-sm text-gray-500 italic">
              Add ₹{(500 - subtotal).toFixed(2)} more for free delivery!
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span className="text-dukaan-green-600">₹{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-dukaan-green-600 hover:bg-dukaan-green-700 text-white font-bold py-4 px-6 rounded-lg text-lg"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
