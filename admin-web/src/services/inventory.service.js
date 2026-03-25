import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";

// Get all products
export const getProducts = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);
  if (filters.search) params.append("search", filters.search);
  if (filters.category) params.append("category", filters.category);
  if (filters.isActive !== undefined)
    params.append("isActive", filters.isActive);

  const response = await apiClient.get(`${ENDPOINTS.PRODUCTS.LIST}?${params}`);
  return response.data;
};

// Get product by ID
export const getProductById = async (productId) => {
  const response = await apiClient.get(ENDPOINTS.PRODUCTS.GET(productId));
  return response.data;
};

// Create product
export const createProduct = async (productData) => {
  const response = await apiClient.post(ENDPOINTS.PRODUCTS.CREATE, productData);
  return response.data;
};

// Update product
export const updateProduct = async (productId, updates) => {
  const response = await apiClient.put(
    ENDPOINTS.PRODUCTS.UPDATE(productId),
    updates,
  );
  return response.data;
};

// Delete product
export const deleteProduct = async (productId) => {
  const response = await apiClient.delete(ENDPOINTS.PRODUCTS.DELETE(productId));
  return response.data;
};

// Adjust stock
export const adjustStock = async (data) => {
  const response = await apiClient.post(ENDPOINTS.INVENTORY.ADJUST, data);
  return response.data;
};

// Transfer stock
export const transferStock = async (data) => {
  const response = await apiClient.post(ENDPOINTS.INVENTORY.TRANSFER, data);
  return response.data;
};

// Get stock history
export const getStockHistory = async (productId, filters = {}) => {
  const params = new URLSearchParams();

  if (filters.shopId) params.append("shopId", filters.shopId);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);

  const response = await apiClient.get(
    `${ENDPOINTS.INVENTORY.HISTORY(productId)}?${params}`,
  );
  return response.data;
};

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  transferStock,
  getStockHistory,
};
