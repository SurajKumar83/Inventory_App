import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";
import ProductGrid from "../components/ProductGrid.jsx";
import SearchBar from "../components/SearchBar.jsx";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  useEffect(() => {
    loadProducts();
  }, [search, category, pagination.page]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        isActive: true,
      });

      if (search) queryParams.append("search", search);
      if (category) queryParams.append("category", category);

      const response = await apiClient.get(
        `${ENDPOINTS.PRODUCTS.LIST}?${queryParams.toString()}`,
      );
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm) => {
    const params = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    setSearchParams(params);
    setPagination({ ...pagination, page: 1 });
  };

  const handleCategoryChange = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (cat) {
      params.set("category", cat);
    } else {
      params.delete("category");
    }
    setSearchParams(params);
    setPagination({ ...pagination, page: 1 });
  };

  const categories = [
    { name: "All", value: "" },
    { name: "Staples", value: "STAPLES" },
    { name: "Fresh Produce", value: "FRESH_PRODUCE" },
    { name: "Dairy", value: "DAIRY" },
    { name: "Packaged Goods", value: "PACKAGED_GOODS" },
    { name: "Spices", value: "SPICES" },
    { name: "Personal Care", value: "PERSONAL_CARE" },
    { name: "Other", value: "OTHER" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Products</h1>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="mb-4">
          <SearchBar onSearch={handleSearch} placeholder="Search products..." />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                category === cat.value
                  ? "bg-dukaan-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-dukaan-green-600"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No products found
          </h2>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <ProductGrid products={products} />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-semibold"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-semibold"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
