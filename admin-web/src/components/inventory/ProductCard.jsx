import Card from "../common/Card.jsx";

export default function ProductCard({ product, onAdjust, onTransfer, onEdit }) {
  const shop1Stock = product.stock?.find((s) => s.shopId === "shop1");
  const shop2Stock = product.stock?.find((s) => s.shopId === "shop2");

  const getStockBadge = (stock) => {
    if (!stock) return { color: "gray", text: "N/A" };

    const { quantity, reorderLevel } = stock;
    if (quantity === 0) {
      return { color: "red", text: "Out of Stock" };
    } else if (quantity <= reorderLevel) {
      return { color: "yellow", text: "Low Stock" };
    }
    return { color: "green", text: "In Stock" };
  };

  const shop1Badge = getStockBadge(shop1Stock);
  const shop2Badge = getStockBadge(shop2Stock);

  return (
    <Card>
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <img
            src={product.imageUrls?.[0] || "https://via.placeholder.com/150"}
            alt={product.name}
            className="w-24 h-24 object-cover rounded-lg"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                SKU: {product.sku}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {product.category}
              </p>
            </div>
            <p className="text-lg font-bold text-dukaan-green-600 dark:text-dukaan-green-400">
              ₹{parseFloat(product.price).toFixed(2)}
            </p>
          </div>

          {/* Stock Information */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            {/* Shop 1 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 dark:bg-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Shop 1
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    shop1Badge.color === "green"
                      ? "bg-green-100 text-green-800"
                      : shop1Badge.color === "yellow"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {shop1Badge.text}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {shop1Stock?.quantity || 0}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  {product.unit}
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Reorder: {shop1Stock?.reorderLevel || 0}
              </p>
            </div>

            {/* Shop 2 */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 dark:bg-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Shop 2
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    shop2Badge.color === "green"
                      ? "bg-green-100 text-green-800"
                      : shop2Badge.color === "yellow"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {shop2Badge.text}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {shop2Stock?.quantity || 0}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  {product.unit}
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Reorder: {shop2Stock?.reorderLevel || 0}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onAdjust(product)}
              className="flex-1 px-3 py-2 text-sm font-medium text-dukaan-green-600 bg-dukaan-green-50 dark:text-dukaan-green-400 dark:bg-dukaan-green-900/30 rounded-lg hover:bg-dukaan-green-100 dark:hover:bg-dukaan-green-900/50 transition-colors"
            >
              Adjust Stock
            </button>
            <button
              onClick={() => onTransfer(product)}
              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              Transfer
            </button>
            <button
              onClick={() => onEdit(product)}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 dark:text-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
