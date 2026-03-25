import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";
import useCartStore from "../store/cartStore.js";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(ENDPOINTS.PRODUCTS.GET_BY_ID(id));
      setProduct(response.data);
    } catch (err) {
      console.error("Failed to load product:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    alert(`Added ${quantity} ${product.unit}(s) of ${product.name} to cart`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-dukaan-green-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Product not found
        </h2>
        <button
          onClick={() => navigate("/products")}
          className="bg-dukaan-green-600 hover:bg-dukaan-green-700 text-white font-semibold py-2 px-6 rounded-lg"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const totalStock =
    product.stock?.reduce((sum, s) => sum + s.quantity, 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="text-dukaan-green-600 hover:text-dukaan-green-700 font-semibold mb-6"
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-96 object-cover"
            />
          ) : (
            <div className="w-full h-96 bg-gray-100 flex items-center justify-center text-6xl">
              📦
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <div className="inline-block bg-dukaan-green-100 text-dukaan-green-800 text-sm font-semibold px-3 py-1 rounded-full mb-2">
              {product.category}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            <p className="text-gray-600">{product.description}</p>
          </div>

          <div className="border-t border-b border-gray-200 py-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-dukaan-green-600">
                ₹{product.price.toFixed(2)}
              </span>
              <span className="text-gray-600">per {product.unit}</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Product Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">SKU:</span>
                <span className="font-semibold">{product.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-semibold">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unit:</span>
                <span className="font-semibold">{product.unit}</span>
              </div>
              {product.barcode && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Barcode:</span>
                  <span className="font-semibold">{product.barcode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Stock Status:</span>
                <span
                  className={`font-semibold ${totalStock > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {totalStock > 0
                    ? `In Stock (${totalStock} available)`
                    : "Out of Stock"}
                </span>
              </div>
            </div>
          </div>

          {totalStock > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <label className="font-semibold text-gray-900">Quantity:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    min="1"
                    max={totalStock}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
                  />
                  <button
                    onClick={() =>
                      setQuantity(Math.min(totalStock, quantity + 1))
                    }
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full bg-dukaan-green-600 hover:bg-dukaan-green-700 text-white font-bold py-4 px-6 rounded-lg text-lg"
              >
                Add to Cart - ₹{(product.price * quantity).toFixed(2)}
              </button>
            </div>
          )}

          {totalStock === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-semibold">
                This product is currently out of stock
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
