import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";

export const getSuppliers = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.search) queryParams.append("search", params.search);
  if (params.isActive !== undefined)
    queryParams.append("isActive", params.isActive);

  const response = await apiClient.get(
    `${ENDPOINTS.SUPPLIERS.LIST}?${queryParams.toString()}`,
  );
  return response.data;
};

export const getSupplierById = async (supplierId) => {
  const response = await apiClient.get(ENDPOINTS.SUPPLIERS.GET(supplierId));
  return response.data;
};

export const createSupplier = async (data) => {
  const response = await apiClient.post(ENDPOINTS.SUPPLIERS.CREATE, data);
  return response.data;
};

export const updateSupplier = async (supplierId, data) => {
  const response = await apiClient.put(
    ENDPOINTS.SUPPLIERS.UPDATE(supplierId),
    data,
  );
  return response.data;
};

export const deleteSupplier = async (supplierId) => {
  const response = await apiClient.delete(
    ENDPOINTS.SUPPLIERS.DELETE(supplierId),
  );
  return response.data;
};

export const linkProducts = async (supplierId, productIds) => {
  const response = await apiClient.post(
    ENDPOINTS.SUPPLIERS.LINK_PRODUCT(supplierId),
    { productIds },
  );
  return response.data;
};
