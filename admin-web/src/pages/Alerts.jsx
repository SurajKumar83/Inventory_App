import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button.jsx";
import Card from "../components/common/Card.jsx";
import Modal from "../components/common/Modal.jsx";
import Sidebar from "../components/dashboard/Sidebar.jsx";
import {
  getAlerts,
  getSupplierContact,
  markAlertAsViewed,
} from "../services/alert.service.js";
import useAuthStore from "../store/authStore.js";

export default function Alerts() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filter, setFilter] = useState("ACTIVE");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [pagination.page, filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const result = await getAlerts({
        page: pagination.page,
        limit: pagination.limit,
        status: filter,
      });
      setAlerts(result.alerts);
      setPagination(result.pagination);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkViewed = async (alertId) => {
    try {
      await markAlertAsViewed(alertId);
      loadAlerts(); // Reload to update status
    } catch (err) {
      console.error("Failed to mark alert as viewed:", err);
    }
  };

  const handleContactSupplier = async (alert) => {
    try {
      setSelectedAlert(alert);
      const contact = await getSupplierContact(alert.id);
      setContactInfo(contact);
      setShowContactModal(true);
    } catch (err) {
      console.error("Failed to get supplier contact:", err);
      alert(err.response?.data?.error || "Failed to get supplier contact info");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "LOW":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
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
              <h1 className="text-3xl font-bold text-dukaan-green-600">
                Low-Stock Alerts
              </h1>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => navigate("/inventory")}
                >
                  Inventory
                </Button>
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
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex gap-2">
              <Button
                variant={filter === "ACTIVE" ? "primary" : "secondary"}
                onClick={() => setFilter("ACTIVE")}
              >
                Active
              </Button>
              <Button
                variant={filter === "VIEWED" ? "primary" : "secondary"}
                onClick={() => setFilter("VIEWED")}
              >
                Viewed
              </Button>
              <Button
                variant={filter === "RESOLVED" ? "primary" : "secondary"}
                onClick={() => setFilter("RESOLVED")}
              >
                Resolved
              </Button>
            </div>
          </div>

          {/* Alerts List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-dukaan-green-600"></div>
              <p className="mt-4 text-gray-600">Loading alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">No alerts found</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <Card key={alert.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold border ${getSeverityColor(alert.severity)}`}
                          >
                            {alert.severity}
                          </span>
                          <span className="text-sm text-gray-500">
                            {alert.shop.name}
                          </span>
                        </div>
                        <p className="text-gray-800 mb-2">{alert.message}</p>
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">Product:</span>{" "}
                          {alert.product.name} ({alert.product.sku})
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Triggered: {formatDate(alert.triggeredAt)}
                          {alert.viewedAt &&
                            ` • Viewed: ${formatDate(alert.viewedAt)}`}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {alert.status === "ACTIVE" && (
                          <Button
                            variant="secondary"
                            onClick={() => handleMarkViewed(alert.id)}
                          >
                            Mark Viewed
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          onClick={() => handleContactSupplier(alert)}
                        >
                          Contact Supplier
                        </Button>
                      </div>
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
        </main>

        {/* Contact Supplier Modal */}
        <Modal
          isOpen={showContactModal}
          onClose={() => {
            setShowContactModal(false);
            setContactInfo(null);
            setSelectedAlert(null);
          }}
          title="Contact Supplier"
          size="lg"
        >
          {contactInfo && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">
                  {contactInfo.supplier.name}
                </h3>
                <div className="space-y-1 text-sm">
                  {contactInfo.supplier.contactName && (
                    <p>
                      <span className="font-semibold">Contact:</span>{" "}
                      {contactInfo.supplier.contactName}
                    </p>
                  )}
                  {contactInfo.supplier.email && (
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      <a
                        href={`mailto:${contactInfo.supplier.email}`}
                        className="text-dukaan-green-600 hover:underline"
                      >
                        {contactInfo.supplier.email}
                      </a>
                    </p>
                  )}
                  {contactInfo.supplier.phone && (
                    <p>
                      <span className="font-semibold">Phone:</span>{" "}
                      <a
                        href={`tel:${contactInfo.supplier.phone}`}
                        className="text-dukaan-green-600 hover:underline"
                      >
                        {contactInfo.supplier.phone}
                      </a>
                    </p>
                  )}
                  {contactInfo.supplier.whatsapp && (
                    <p>
                      <span className="font-semibold">WhatsApp:</span>{" "}
                      <a
                        href={`https://wa.me/${contactInfo.supplier.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(contactInfo.message)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-dukaan-green-600 hover:underline"
                      >
                        {contactInfo.supplier.whatsapp}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Pre-filled Message
                </label>
                <textarea
                  readOnly
                  value={contactInfo.message}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                  rows={8}
                />
                <Button
                  variant="secondary"
                  onClick={() => copyToClipboard(contactInfo.message)}
                  className="mt-2 w-full"
                >
                  Copy Message
                </Button>
              </div>

              <div className="flex gap-2">
                {contactInfo.supplier.whatsapp && (
                  <a
                    href={`https://wa.me/${contactInfo.supplier.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(contactInfo.message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="primary" className="w-full">
                      Open WhatsApp
                    </Button>
                  </a>
                )}
                {contactInfo.supplier.email && (
                  <a
                    href={`mailto:${contactInfo.supplier.email}?subject=Reorder Request: ${contactInfo.product.name}&body=${encodeURIComponent(contactInfo.message)}`}
                    className="flex-1"
                  >
                    <Button variant="secondary" className="w-full">
                      Send Email
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
