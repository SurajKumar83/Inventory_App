import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";
import ProductGrid from "../components/ProductGrid.jsx";
import SearchBar from "../components/SearchBar.jsx";

export default function Home() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const response = await apiClient.get(
        `${ENDPOINTS.PRODUCTS.LIST}?limit=8&isActive=true`,
      );
      setFeaturedProducts(response.data.products);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const categories = [
    { name: "Staples", value: "STAPLES", emoji: "🌾" },
    { name: "Fresh Produce", value: "FRESH_PRODUCE", emoji: "🥬" },
    { name: "Dairy", value: "DAIRY", emoji: "🥛" },
    { name: "Packaged Goods", value: "PACKAGED_GOODS", emoji: "📦" },
    { name: "Spices", value: "SPICES", emoji: "🌶️" },
    { name: "Personal Care", value: "PERSONAL_CARE", emoji: "🧴" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-dukaan-green-600 to-dukaan-green-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-4">Welcome to DukaanSync</h1>
          <p className="text-xl mb-8">
            Fresh groceries delivered to your doorstep
          </p>
          <div className="max-w-2xl">
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => navigate(`/products?category=${category.value}`)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
            >
              <div className="text-4xl mb-2">{category.emoji}</div>
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Featured Products
            </h2>
            <button
              onClick={() => navigate("/products")}
              className="text-dukaan-green-600 hover:text-dukaan-green-700 font-semibold"
            >
              View All →
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-dukaan-green-600"></div>
            </div>
          ) : (
            <ProductGrid products={featuredProducts} />
          )}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-5xl mb-4">🚚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Free Delivery
            </h3>
            <p className="text-gray-600">On orders above ₹500</p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Fresh Products
            </h3>
            <p className="text-gray-600">Quality guaranteed</p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Secure Payment
            </h3>
            <p className="text-gray-600">UPI, Cards, COD available</p>
          </div>
        </div>
      </div>
    </div>
  );
}
