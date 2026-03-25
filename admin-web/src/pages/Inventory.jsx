import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertBadge from "../components/alerts/AlertBadge.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import Sidebar from "../components/dashboard/Sidebar.jsx";
import ProductCard from "../components/inventory/ProductCard.jsx";
import StockAdjustForm from "../components/inventory/StockAdjustForm.jsx";
import TransferForm from "../components/inventory/TransferForm.jsx";
import useRealTimeSync from "../hooks/useRealTimeSync.js";
import {
  adjustStock,
  getProducts,
  transferStock,
} from "../services/inventory.service.js";
import useAuthStore from "../store/authStore.js";
import useInventoryStore from "../store/inventoryStore.js";

export default function Inventory() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    products,
    loading,
    pagination,
    filters,
    setProducts,
    setLoading,
    setError,
    setFilters,
    setPagination,
  } = useInventoryStore();

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Real-time sync for inventory updates
  useRealTimeSync((events) => {
    // Reload products when inventory updates are received
    const hasInventoryUpdate = events.some(
      (event) =>
        event.type === "stock_adjusted" || event.type === "stock_transferred",
    );
    if (hasInventoryUpdate) {
      loadProducts();
    }
  });

  useEffect(() => {
    loadProducts();
  }, [filters, pagination.page]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await getProducts({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      setProducts(result.products, result.pagination);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load products");
    }
  };

  const handleAdjust = (product) => {
    setSelectedProduct(product);
    setShowAdjustModal(true);
  };

  const handleTransfer = (product) => {
    setSelectedProduct(product);
    setShowTransferModal(true);
  };

  const handleAdjustSubmit = async (data) => {
    try {
      await adjustStock(data);
      setShowAdjustModal(false);
      setSelectedProduct(null);
      loadProducts(); // Reload to get updated stock
    } catch (err) {
      throw err;
    }
  };

  const handleTransferSubmit = async (data) => {
    try {
      await transferStock(data);
      setShowTransferModal(false);
      setSelectedProduct(null);
      loadProducts(); // Reload to get updated stock
    } catch (err) {
      throw err;
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
              <div>
                <h1 className="text-3xl font-bold text-dukaan-green-600">
                  Manage Your Two Shops
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Welcome back, {user?.firstName}!
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/alerts")}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Alerts"
                >
                  <AlertBadge />
                </button>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/suppliers")}
                >
                  Suppliers
                </Button>
                <Button variant="secondary" onClick={() => navigate("/orders")}>
                  Orders
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
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ search: e.target.value })}
                  placeholder="Search products by name or SKU..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={filters.category || ""}
                  onChange={(e) =>
                    setFilters({ category: e.target.value || null })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="STAPLES">Staples</option>
                  <option value="FRESH_PRODUCE">Fresh Produce</option>
                  <option value="DAIRY">Dairy</option>
                  <option value="PACKAGED_GOODS">Packaged Goods</option>
                  <option value="SPICES">Spices</option>
                  <option value="PERSONAL_CARE">Personal Care</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-dukaan-green-600"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">No products found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdjust={handleAdjust}
                    onTransfer={handleTransfer}
                    onEdit={() => {}}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPagination({ page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setPagination({ page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Modals */}
        <Modal
          isOpen={showAdjustModal}
          onClose={() => {
            setShowAdjustModal(false);
            setSelectedProduct(null);
          }}
          title="Adjust Stock"
        >
          {selectedProduct && (
            <StockAdjustForm
              product={selectedProduct}
              onSubmit={handleAdjustSubmit}
              onCancel={() => {
                setShowAdjustModal(false);
                setSelectedProduct(null);
              }}
            />
          )}
        </Modal>

        <Modal
          isOpen={showTransferModal}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedProduct(null);
          }}
          title="Transfer Stock"
        >
          {selectedProduct && (
            <TransferForm
              product={selectedProduct}
              onSubmit={handleTransferSubmit}
              onCancel={() => {
                setShowTransferModal(false);
                setSelectedProduct(null);
              }}
            />
          )}
        </Modal>
      </div>
    </div>
  );
}
