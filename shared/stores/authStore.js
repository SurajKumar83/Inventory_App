import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// For web: use localStorage
// For mobile (React Native): create a separate store with AsyncStorage
const storage =
  typeof window !== "undefined" && window.localStorage
    ? window.localStorage
    : undefined;

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      requiresMFA: false,
      mfaUserId: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          requiresMFA: false,
          mfaUserId: null,
        }),

      setMFARequired: (required, userId) =>
        set({
          requiresMFA: required,
          mfaUserId: userId,
        }),

      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          requiresMFA: false,
          mfaUserId: null,
        }),

      checkAuth: () => {
        const { accessToken } = get();
        return !!accessToken;
      },
    }),
    {
      name: "dukaansync-auth",
      ...(storage && {
        storage: createJSONStorage(() => storage),
      }),
    },
  ),
);

export default useAuthStore;
