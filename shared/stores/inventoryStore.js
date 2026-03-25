import { create } from "zustand";

const useInventoryStore = create((set) => ({
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

  setProducts: (products, pagination) =>
    set({ products, pagination, loading: false, error: null }),

  setSelectedProduct: (product) => set({ selectedProduct: product }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    })),

  setPagination: (pagination) =>
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    })),

  addProduct: (product) =>
    set((state) => ({
      products: [product, ...state.products],
    })),

  updateProduct: (productId, updates) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, ...updates } : p,
      ),
    })),

  removeProduct: (productId) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== productId),
    })),
}));

export default useInventoryStore;
