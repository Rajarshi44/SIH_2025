import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: "#B6FF00",
        dark: {
          900: "#0a0e1a",
          800: "#121825",
          700: "#1a2332",
          600: "#232e3f",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(182, 255, 0, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(182, 255, 0, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
