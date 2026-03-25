import { create } from "zustand";

const useInventoryStore = create((set, get) => ({
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    category: null,
    isActive: true,
  },

  // Set products list
  setProducts: (products, pagination) => {
    set({ products, pagination, loading: false, error: null });
  },

  // Set selected product
  setSelectedProduct: (product) => {
    set({ selectedProduct: product });
  },

  // Set loading state
  setLoading: (loading) => {
    set({ loading });
  },

  // Set error
  setError: (error) => {
    set({ error, loading: false });
  },

  // Update filters
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    }));
  },

  // Set pagination
  setPagination: (pagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
  },

  // Add new product to list
  addProduct: (product) => {
    set((state) => ({
      products: [product, ...state.products],
    }));
  },

  // Update product in list
  updateProduct: (productId, updates) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, ...updates } : p,
      ),
      selectedProduct:
        state.selectedProduct?.id === productId
          ? { ...state.selectedProduct, ...updates }
          : state.selectedProduct,
    }));
  },

  // Remove product from list
  removeProduct: (productId) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== productId),
      selectedProduct:
        state.selectedProduct?.id === productId ? null : state.selectedProduct,
    }));
  },

  // Clear state
  clear: () => {
    set({
      products: [],
      selectedProduct: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      filters: {
        search: "",
        category: null,
        isActive: true,
      },
    });
  },
}));

export default useInventoryStore;
