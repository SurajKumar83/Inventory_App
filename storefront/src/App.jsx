import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import useAuthStore from "../../shared/stores/authStore.js";
import Checkout from "./components/Checkout.jsx";
import CartPage from "./pages/CartPage.jsx";
import Home from "./pages/Home.jsx";
import OrderTracking from "./pages/OrderTracking.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Products from "./pages/Products.jsx";
import useCartStore from "./store/cartStore.js";

function App() {
  const { user, isAuthenticated } = useAuthStore();
  const cartItemCount = useCartStore((state) => state.getItemCount());

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="text-2xl font-bold text-dukaan-green-600">
                DukaanSync
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-dukaan-green-600 font-semibold"
                >
                  Home
                </Link>
                <Link
                  to="/products"
                  className="text-gray-700 hover:text-dukaan-green-600 font-semibold"
                >
                  Products
                </Link>
              </nav>

              <div className="flex items-center gap-4">
                <Link
                  to="/cart"
                  className="relative text-gray-700 hover:text-dukaan-green-600"
                >
                  <span className="text-2xl">🛒</span>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>

                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-700 font-semibold">
                      {user?.name}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      alert("Login functionality to be implemented")
                    }
                    className="bg-dukaan-green-600 hover:bg-dukaan-green-700 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route
              path="/checkout"
              element={
                isAuthenticated ? <Checkout /> : <Navigate to="/" replace />
              }
            />
            <Route path="/orders/:id" element={<OrderTracking />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-3">DukaanSync</h3>
                <p className="text-gray-400">
                  Your trusted neighborhood grocery store, now online.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-3">Quick Links</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link to="/" className="hover:text-white">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link to="/products" className="hover:text-white">
                      Products
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-3">Contact</h3>
                <p className="text-gray-400">Email: support@dukaansync.com</p>
                <p className="text-gray-400">Phone: +91 1234567890</p>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2026 DukaanSync. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
