/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Enable dark mode with class strategy
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand colors
        "dukaan-green": {
          50: "#f0fdf4",
          100: "#d1fae5",
          600: "#059669",
          700: "#047857",
        },
        // Semantic colors using CSS variables
        primary: {
          DEFAULT: "rgb(var(--color-bg-primary) / <alpha-value>)",
          text: "rgb(var(--color-text-primary) / <alpha-value>)",
          border: "rgb(var(--color-border-primary) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-bg-secondary) / <alpha-value>)",
          text: "rgb(var(--color-text-secondary) / <alpha-value>)",
          border: "rgb(var(--color-border-secondary) / <alpha-value>)",
        },
        brand: {
          DEFAULT: "rgb(var(--color-brand-primary) / <alpha-value>)",
          light: "rgb(var(--color-brand-light) / <alpha-value>)",
          lighter: "rgb(var(--color-brand-lighter) / <alpha-value>)",
        },
      },
      backgroundColor: {
        primary: "rgb(var(--color-bg-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-bg-secondary) / <alpha-value>)",
        tertiary: "rgb(var(--color-bg-tertiary) / <alpha-value>)",
        hover: "rgb(var(--color-bg-hover) / <alpha-value>)",
        card: "rgb(var(--color-card-bg) / <alpha-value>)",
      },
      textColor: {
        primary: "rgb(var(--color-text-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
        tertiary: "rgb(var(--color-text-tertiary) / <alpha-value>)",
        inverse: "rgb(var(--color-text-inverse) / <alpha-value>)",
      },
      borderColor: {
        primary: "rgb(var(--color-border-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-border-secondary) / <alpha-value>)",
        focus: "rgb(var(--color-border-focus) / <alpha-value>)",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
      },
    },
  },
  plugins: [],
};
