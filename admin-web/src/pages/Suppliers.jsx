import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button.jsx";
import Card from "../components/common/Card.jsx";
import Modal from "../components/common/Modal.jsx";
import Layout from "../components/layout/Layout.jsx";
import { getProducts } from "../services/inventory.service.js";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  linkProducts,
  updateSupplier,
} from "../services/supplier.service.js";
import useAuthStore from "../store/authStore.js";

export default function Suppliers() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [linkingSupplier, setLinkingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    address: "",
  });
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  useEffect(() => {
    loadSuppliers();
    loadProducts();
  }, [pagination.page, search]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const result = await getSuppliers({
        page: pagination.page,
        limit: pagination.limit,
        search,
      });
      setSuppliers(result.suppliers);
      setPagination(result.pagination);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await getProducts({ limit: 1000, isActive: true });
      setProducts(result.products || []);
    } catch (err) {
      console.error("Failed to load products:", err);
      setProducts([]);
    }
  };

  const handleCreate = () => {
    setEditingSupplier(null);
    setFormData({
      businessName: "",
      contactPerson: "",
      email: "",
      phone: "",
      whatsappNumber: "",
      address: "",
    });
    setShowModal(true);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      businessName: supplier.businessName,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      whatsappNumber: supplier.whatsappNumber || "",
      address: supplier.address || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (supplierId) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;

    try {
      await deleteSupplier(supplierId);
      loadSuppliers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete supplier");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
      } else {
        await createSupplier(formData);
      }
      setShowModal(false);
      loadSuppliers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save supplier");
    }
  };

  const handleLinkProducts = (supplier) => {
    setLinkingSupplier(supplier);
    // Pre-select already linked products
    const linkedIds =
      supplier.supplierProducts?.map((sp) => sp.productId) || [];
    setSelectedProductIds(linkedIds);
    setShowLinkModal(true);
  };

  const handleSaveProductLinks = async () => {
    try {
      await linkProducts(linkingSupplier.id, selectedProductIds);
      setShowLinkModal(false);
      loadSuppliers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to link products");
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const headerActions = (
    <Button variant="primary" onClick={handleCreate}>
      Add Supplier
    </Button>
  );

  return (
    <Layout
      title="Suppliers"
      subtitle="Manage supplier relationships and products"
      actions={headerActions}
    >
      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers by name, email, or phone..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
        />
      </div>

      {/* Suppliers List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-dukaan-green-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading suppliers...
          </p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">No suppliers found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {supplier.businessName}
                </h3>
                <div className="space-y-1 text-sm mb-4">
                  {supplier.contactPerson && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Contact:</span>{" "}
                      {supplier.contactPerson}
                    </p>
                  )}
                  {supplier.email && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Email:</span>{" "}
                      {supplier.email}
                    </p>
                  )}
                  {supplier.phone && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Phone:</span>{" "}
                      {supplier.phone}
                    </p>
                  )}
                  {supplier.whatsappNumber && (
                    <p className="text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">WhatsApp:</span>{" "}
                      {supplier.whatsappNumber}
                    </p>
                  )}
                </div>

                {supplier.supplierProducts &&
                  supplier.supplierProducts.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Supplies ({supplier.supplierProducts.length}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {supplier.supplierProducts.slice(0, 3).map((sp) => (
                          <span
                            key={sp.productId}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                          >
                            {sp.product.name}
                          </span>
                        ))}
                        {supplier.supplierProducts.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                            +{supplier.supplierProducts.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(supplier)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleLinkProducts(supplier)}
                  >
                    Link Products
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(supplier.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setPagination({
                    ...pagination,
                    page: pagination.page - 1,
                  })
                }
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() =>
                  setPagination({
                    ...pagination,
                    page: pagination.page + 1,
                  })
                }
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Supplier Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Business Name *
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Contact Person *
            </label>
            <input
              type="text"
              value={formData.contactPerson}
              onChange={(e) =>
                setFormData({ ...formData, contactPerson: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              WhatsApp Number
            </label>
            <input
              type="tel"
              value={formData.whatsappNumber}
              onChange={(e) =>
                setFormData({ ...formData, whatsappNumber: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingSupplier ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Link Products Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title={`Link Products to ${linkingSupplier?.businessName}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select which products this supplier provides:
          </p>

          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
            {products.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No products available. Please add products first.
              </p>
            ) : (
              products.map((product) => (
                <label
                  key={product.id}
                  className="flex items-center gap-2 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                    className="h-4 w-4 text-dukaan-green-600 focus:ring-dukaan-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm">
                    {product.name} ({product.sku}) - {product.category}
                  </span>
                </label>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowLinkModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveProductLinks}
              disabled={selectedProductIds.length === 0}
            >
              Save Links ({selectedProductIds.length})
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
