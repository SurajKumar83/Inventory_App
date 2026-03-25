import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";

export const getAlerts = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.status) queryParams.append("status", params.status);
  if (params.shopId) queryParams.append("shopId", params.shopId);

  const response = await apiClient.get(
    `${ENDPOINTS.ALERTS.LIST}?${queryParams.toString()}`,
  );
  return response.data;
};

export const getUnviewedAlertCount = async () => {
  const response = await apiClient.get(ENDPOINTS.ALERTS.UNVIEWED_COUNT);
  return response.data;
};

export const markAlertAsViewed = async (alertId) => {
  const response = await apiClient.patch(ENDPOINTS.ALERTS.MARK_VIEWED(alertId));
  return response.data;
};

export const getSupplierContact = async (alertId) => {
  const response = await apiClient.get(
    ENDPOINTS.ALERTS.CONTACT_SUPPLIER(alertId),
  );
  return response.data;
};
