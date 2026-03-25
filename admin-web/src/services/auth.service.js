import { ENDPOINTS } from "../../../shared/api-client/endpoints.js";
import apiClient from "../../../shared/api-client/index.js";

// Login
export const login = async (email, password) => {
  const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
    email,
    password,
  });
  return response.data;
};

// Verify MFA OTP
export const verifyMFA = async (userId, otp) => {
  const response = await apiClient.post(ENDPOINTS.AUTH.MFA_VERIFY, {
    userId,
    otp,
  });
  return response.data;
};

// Logout
export const logout = async () => {
  const response = await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
  return response.data;
};

export default {
  login,
  verifyMFA,
  logout,
};
