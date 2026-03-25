import { useState } from "react";
import Button from "../common/Button.jsx";

export default function TransferForm({ product, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    fromShopId: "shop1",
    toShopId: "shop2",
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
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error("Please enter a valid positive quantity");
      }

      if (formData.fromShopId === formData.toShopId) {
        throw new Error("Cannot transfer to the same shop");
      }

      await onSubmit({
        productId: product.id,
        fromShopId: formData.fromShopId,
        toShopId: formData.toShopId,
        quantity,
        reason: formData.reason,
      });

      // Reset form
      setFormData({
        fromShopId: "shop1",
        toShopId: "shop2",
        quantity: "",
        reason: "",
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fromStock = product.stock?.find(
    (s) => s.shopId === formData.fromShopId,
  );
  const toStock = product.stock?.find((s) => s.shopId === formData.toShopId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product
        </label>
        <p className="text-lg font-semibold">{product.name}</p>
        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Shop
          </label>
          <select
            value={formData.fromShopId}
            onChange={(e) =>
              setFormData({ ...formData, fromShopId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
          >
            <option value="shop1">Shop 1 - Main Street</option>
            <option value="shop2">Shop 2 - Market Road</option>
          </select>
          {fromStock && (
            <p className="text-sm text-gray-500 mt-1">
              Available: {fromStock.quantity} {product.unit}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Shop
          </label>
          <select
            value={formData.toShopId}
            onChange={(e) =>
              setFormData({ ...formData, toShopId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
          >
            <option value="shop1">Shop 1 - Main Street</option>
            <option value="shop2">Shop 2 - Market Road</option>
          </select>
          {toStock && (
            <p className="text-sm text-gray-500 mt-1">
              Current: {toStock.quantity} {product.unit}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Transfer Quantity
        </label>
        <input
          type="number"
          value={formData.quantity}
          onChange={(e) =>
            setFormData({ ...formData, quantity: e.target.value })
          }
          placeholder="Enter quantity to transfer"
          required
          min="1"
          max={fromStock?.quantity}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reason
        </label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="e.g., Balancing stock between locations, High demand at destination shop"
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dukaan-green-500 focus:border-transparent"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Transferring..." : "Transfer Stock"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
