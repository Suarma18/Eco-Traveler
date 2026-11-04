import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-outfit)", "sans-serif"],
        sans: ["var(--font-jakarta)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      colors: {
        subak: {
          50: "#f0f9f4",
          100: "#daf1e4",
          200: "#b8e3cc",
          300: "#89ceac",
          400: "#57b388",
          500: "#34976b",
          600: "#247954",
          700: "#1e6145",
          800: "#1a4d38",
          900: "#16402f",
          950: "#0b241a",
        },
        terracotta: {
          50: "#fdf5f3",
          100: "#fbe8e4",
          200: "#f8d5cd",
          300: "#f2b7aa",
          400: "#e88d79",
          500: "#db684f",
          600: "#c74d33",
          700: "#a63d27",
          800: "#893524",
          900: "#723023",
        },
      },
    },
  },
  plugins: [],
};

export default config;
