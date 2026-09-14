import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: "#14171c",
          light: "#1e2229",
          lighter: "#282d36",
        },
        ivory: "#f7f5f0",
        champagne: {
          DEFAULT: "#c9a962",
          light: "#ddc48a",
          dark: "#a4863f",
        },
        "deep-blue": {
          DEFAULT: "#0b1f3a",
          light: "#15335c",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
