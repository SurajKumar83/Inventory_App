import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      requiresMFA: false,
      mfaUserId: null,

      // Set user and tokens after login
      setAuth: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          requiresMFA: false,
          mfaUserId: null,
        });
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
      },

      // Set MFA required state
      setMFARequired: (userId) => {
        set({
          requiresMFA: true,
          mfaUserId: userId,
        });
      },

      // Update access token (after refresh)
      setAccessToken: (accessToken) => {
        set({ accessToken });
        localStorage.setItem("accessToken", accessToken);
      },

      // Logout
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          requiresMFA: false,
          mfaUserId: null,
        });
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      },

      // Get current user
      getUser: () => get().user,

      // Check if authenticated
      checkAuth: () => {
        const token = localStorage.getItem("accessToken");
        return !!token && get().isAuthenticated;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
