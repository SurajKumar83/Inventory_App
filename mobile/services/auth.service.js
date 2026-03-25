import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";

export const login = async (email, password) => {
  const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
    email,
    password,
  });
  return response.data;
};

export const verifyMFA = async (userId, otp) => {
  const response = await apiClient.post(ENDPOINTS.AUTH.VERIFY_MFA, {
    userId,
    otp,
  });
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
  return response.data;
};
