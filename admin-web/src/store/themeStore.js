import { create } from "zustand";
import { persist } from "zustand/middleware";

// Apply theme to document
const applyTheme = (theme) => {
  if (typeof window === "undefined") return;

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

// Get initial theme from localStorage
const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";

  try {
    const stored = localStorage.getItem("theme-storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.theme) {
        return parsed.state.theme;
      }
    }
  } catch (e) {
    console.error("Error reading theme from localStorage:", e);
  }

  // Fallback to system preference
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
};

/**
 * Theme Store
 * Manages app-wide theme state (light/dark mode)
 * Persists theme preference to localStorage
 */
const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),

      // Toggle between light and dark theme
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";
          applyTheme(newTheme);
          return { theme: newTheme };
        });
      },

      // Set specific theme
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      // Initialize theme
      initializeTheme: () => {
        const currentTheme = get().theme;
        applyTheme(currentTheme);
      },
    }),
    {
      name: "theme-storage",
      // Ensure theme is applied after hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    },
  ),
);

// Apply initial theme on module load
if (typeof window !== "undefined") {
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);
}

export default useThemeStore;
