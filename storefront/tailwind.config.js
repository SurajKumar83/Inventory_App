/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "dukaan-green": {
          50: "#f0fdf4",
          100: "#d1fae5",
          600: "#059669",
          700: "#047857",
        },
      },
    },
  },
  plugins: [],
};
