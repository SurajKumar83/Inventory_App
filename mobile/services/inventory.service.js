import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";

export const getProducts = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.search) queryParams.append("search", params.search);
  if (params.category) queryParams.append("category", params.category);
  if (params.isActive !== undefined)
    queryParams.append("isActive", params.isActive);

  const response = await apiClient.get(
    `${ENDPOINTS.PRODUCTS.LIST}?${queryParams.toString()}`,
  );
  return response.data;
};

export const getProductById = async (productId) => {
  const response = await apiClient.get(
    ENDPOINTS.PRODUCTS.GET.replace(":id", productId),
  );
  return response.data;
};

export const adjustStock = async (data) => {
  const response = await apiClient.post(ENDPOINTS.INVENTORY.ADJUST, data);
  return response.data;
};

export const transferStock = async (data) => {
  const response = await apiClient.post(ENDPOINTS.INVENTORY.TRANSFER, data);
  return response.data;
};

export const getStockHistory = async (productId, params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.shopId) queryParams.append("shopId", params.shopId);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);

  const response = await apiClient.get(
    `${ENDPOINTS.INVENTORY.HISTORY.replace(":productId", productId)}?${queryParams.toString()}`,
  );
  return response.data;
};
