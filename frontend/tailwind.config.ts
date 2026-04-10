import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#C45D3E", dark: "#A34830", light: "#e8a87c" },
        surface: "#ffffff",
        elevated: "#faf6f1",
        base: "#f5efe8",
        "text-primary": "#3d2a1f",
        "text-secondary": "#6b5b4f",
        border: "#e8ddd0",
        success: "#2e7d32",
        warning: "#e65100",
        danger: "#c62828",
      },
      boxShadow: {
        card: "0 1px 3px rgba(61, 42, 31, 0.08), 0 1px 2px rgba(61, 42, 31, 0.06)",
        elevated: "0 4px 12px rgba(61, 42, 31, 0.1)",
        modal: "0 8px 30px rgba(61, 42, 31, 0.15)",
      },
      fontFamily: {
        heading: ["var(--font-secular-one)", "sans-serif"],
        body: ["var(--font-heebo)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
