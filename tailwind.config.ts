import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nav: {
          bg: "#0F172B",
        },
        brand: {
          primary: "#155DFC",
        },
        bg: {
          page: "#F8FAFC",
          surface: "#FFFFFF",
          "surface-selected": "#F4F9FF",
        },
        border: {
          subtle: "#E5E9F0",
        },
        status: {
          info: "#2B7FFF",
          warning: "#FF8904",
          success: "#20B388",
          danger: "#FB2C36",
          neutral: "#96A6BD",
          muted: "#98A2B3",
        },
        dept: {
          tech: "#2B7FFF",
          billing: "#25C590",
          hr: "#B861FF",
        },
        text: {
          primary: "#0F172B",
          secondary: "#64748B",
          inverse: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "Pretendard",
          "-apple-system",
          "system-ui",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "8px",
        badge: "6px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,43,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
