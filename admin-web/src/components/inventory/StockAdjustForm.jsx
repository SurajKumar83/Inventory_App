import { useState } from "react";
import Button from "../common/Button.jsx";

export default function StockAdjustForm({ product, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    shopId: "shop1",
    quantity: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const quantity = parseInt(formData.quantity);
      if (isNaN(quantity) || quantity === 0) {
        throw new Error(
          "Please enter a valid quantity (positive to add, negative to remove)",
        );
      }

      await onSubmit({
        productId: product.id,
        shopId: formData.shopId,
        quantity,
        reason: formData.reason,
      });

      // Reset form
      setFormData({ shopId: "shop1", quantity: "", reason: "" });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentStock = product.stock?.find((s) => s.shopId === formData.shopId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Product
        </label>
        <p className="text-lg font-semibold dark:text-white">{product.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          SKU: {product.sku}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Shop Location
        </label>
        <select
          value={formData.shopId}
          onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
        >
          <option value="shop1">Shop 1 - Main Street</option>
          <option value="shop2">Shop 2 - Market Road</option>
        </select>
        {currentStock && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Current stock: {currentStock.quantity} {product.unit}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Quantity Adjustment
        </label>
        <input
          type="number"
          value={formData.quantity}
          onChange={(e) =>
            setFormData({ ...formData, quantity: e.target.value })
          }
          placeholder="Enter + to add or - to remove (e.g., +50 or -20)"
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Use positive numbers to add stock, negative numbers to remove
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Reason
        </label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="e.g., Received from supplier, Damaged goods removed, etc."
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Adjusting..." : "Adjust Stock"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
