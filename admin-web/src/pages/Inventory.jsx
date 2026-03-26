import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertBadge from "../components/alerts/AlertBadge.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import AddProductForm from "../components/inventory/AddProductForm.jsx";
import EditProductForm from "../components/inventory/EditProductForm.jsx";
import ProductCard from "../components/inventory/ProductCard.jsx";
import StockAdjustForm from "../components/inventory/StockAdjustForm.jsx";
import TransferForm from "../components/inventory/TransferForm.jsx";
import Layout from "../components/layout/Layout.jsx";
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
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Real-time sync for inventory updates
  const { refresh, isConnected, mode } = useRealTimeSync((events) => {
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

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
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

  const handleEditSubmit = async () => {
    setShowEditModal(false);
    setSelectedProduct(null);
    await loadProducts(); // Reload to get updated product
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Header actions specific to Inventory page
  const headerActions = (
    <>
      <Button onClick={() => setShowAddProductModal(true)}>
        + Add New Product
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          refresh();
          loadProducts();
        }}
        title={
          mode === "sse"
            ? `Real-time sync ${isConnected ? "active" : "connecting..."}`
            : "Polling mode (60s)"
        }
      >
        <span className="flex items-center gap-2">
          {mode === "sse" && (
            <span
              className={`inline-block w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}
            />
          )}
          ↻ Refresh
        </span>
      </Button>
      <button
        onClick={() => navigate("/alerts")}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Alerts"
      >
        <AlertBadge />
      </button>
    </>
  );

  return (
    <Layout title="Manage Your Two Shops" actions={headerActions}>
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Search products by name or SKU..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filters.category || ""}
              onChange={(e) => setFilters({ category: e.target.value || null })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading products...
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">No products found</p>
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
                onEdit={handleEdit}
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
              <span className="text-sm text-gray-600 dark:text-gray-400">
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

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        title="Edit Product"
      >
        {selectedProduct && (
          <EditProductForm
            product={selectedProduct}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </Modal>

      <AddProductForm
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onSuccess={() => {
          loadProducts(); // Reload products after successful creation
        }}
      />
    </Layout>
  );
}
