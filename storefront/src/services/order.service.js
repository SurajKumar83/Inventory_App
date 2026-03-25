import apiClient from '../../../shared/api-client/index.js';
import { ENDPOINTS } from '../../../shared/api-client/endpoints.js';

export const createOrder = async (orderData) => {
  const response = await apiClient.post(ENDPOINTS.ORDERS.CREATE, orderData);
  return response.data;
};

export const getOrders = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.status) queryParams.append('status', params.status);

  const response = await apiClient.get(
    `${ENDPOINTS.ORDERS.LIST}?${queryParams.toString()}`
  );
  return response.data;
};

export const getOrderById = async (orderId) => {
  const response = await apiClient.get(ENDPOINTS.ORDERS.GET(orderId));
  return response.data;
};

export const cancelOrder = async (orderId) => {
  const response = await apiClient.post(ENDPOINTS.ORDERS.CANCEL(orderId));
  return response.data;
};
