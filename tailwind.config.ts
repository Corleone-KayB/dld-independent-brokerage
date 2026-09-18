import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#0b0d0f",
        charcoal: {
          DEFAULT: "#171a1d",
          light: "#20242a",
          lighter: "#2b3038",
        },
        ivory: "#f4f0e8",
        "soft-white": "#faf9f6",
        stone: {
          DEFAULT: "#b8b1a5",
          light: "#d8d3c9",
        },
        champagne: {
          DEFAULT: "#c6a56b",
          light: "#dabf8f",
          dark: "#a3803f",
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
        elevated: "0 1px 2px rgba(11, 13, 15, 0.04), 0 16px 40px -12px rgba(11, 13, 15, 0.16)",
        "elevated-hover": "0 1px 2px rgba(11, 13, 15, 0.05), 0 24px 56px -16px rgba(11, 13, 15, 0.22)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
