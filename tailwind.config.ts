import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Triplan V5 Brand Colors
        tp: {
          cyan: "#1BBACA",
          "cyan-hover": "#087C89",
          "cyan-soft": "#9DE2E8",
          "cyan-tint": "#DDF6F8",
          midnight: "#0B2239",
          "midnight-light": "#16344F",
          "midnight-dark": "#061524",
          ivory: "#F6F3EE",
          cream: "#F1ECE3",
          terracotta: "#D9784B",
          "terracotta-hover": "#C06236",
          slate: "#3A4A57",
          muted: "#5C6B79",
          faint: "#8A96A1",
          line: "#E7E0D4",
          "line-2": "#E4DED3",
          surface: "#FFFFFF",
          "surface-2": "#FBF9F5",
          "ok-bg": "#CDEBDD",
          "ok-fg": "#0B5C3E",
          "warn-bg": "#F4E7D2",
          "warn-fg": "#9A5B00",
          "err-bg": "#F6D8D2",
          "err-fg": "#8A1F14",
        },
        morocco: {
          atlantic: { 50: "#f0f6f8", 600: "#0A3641", 800: "#062027", 900: "#04151a" },
          terracotta: { 50: "#fcf4f2", 500: "#D85A38", 600: "#ba4626" },
          sand: { 50: "#F7F3EB", 100: "#EFE8DB", 200: "#DFD4C0" },
          atlas: { 600: "#2D6A4F" },
        },
        brand: {
          teal: "#0B2239",
          "teal-dark": "#061524",
          orange: "#1BBACA",
          "orange-hover": "#087C89",
          sand: "#F6F3EE",
          "sand-card": "#FFFFFF",
          gold: "#D9784B",
          green: "#0B5C3E",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        arabic: ["var(--font-tajawal)", "Cairo", "Tajawal", "sans-serif"],
        display: ["var(--font-inter)", "Bricolage Grotesque", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "card": "18px",
        "card-lg": "22px",
        "control": "12px",
        "pill": "11px",
      },
      boxShadow: {
        "tp-sm": "0 1px 3px rgba(15, 27, 45, 0.06)",
        "tp-md": "0 6px 18px rgba(15, 27, 45, 0.09)",
        "tp-lg": "0 12px 30px rgba(15, 27, 45, 0.12)",
        "tp-xl": "0 20px 46px rgba(15, 27, 45, 0.16)",
        "tp-cyan": "0 10px 30px -5px rgba(27, 186, 202, 0.35)",
        "tp-lift": "0 14px 30px rgba(11, 34, 57, 0.12)",
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "pulse-subtle": "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
