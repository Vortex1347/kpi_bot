/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      colors: {
        bg: "rgb(var(--ks-color-bg) / <alpha-value>)",
        surface: "rgb(var(--ks-color-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--ks-color-surface-2) / <alpha-value>)",
        border: "rgb(var(--ks-color-border) / <alpha-value>)",
        text: "rgb(var(--ks-color-text) / <alpha-value>)",
        "text-muted": "rgb(var(--ks-color-text-muted) / <alpha-value>)",
        primary: {
          50: "rgb(var(--ks-color-primary-50) / <alpha-value>)",
          100: "rgb(var(--ks-color-primary-100) / <alpha-value>)",
          200: "rgb(var(--ks-color-primary-200) / <alpha-value>)",
          300: "rgb(var(--ks-color-primary-300) / <alpha-value>)",
          400: "rgb(var(--ks-color-primary-400) / <alpha-value>)",
          500: "rgb(var(--ks-color-primary-500) / <alpha-value>)",
          600: "rgb(var(--ks-color-primary-600) / <alpha-value>)",
          700: "rgb(var(--ks-color-primary-700) / <alpha-value>)",
          800: "rgb(var(--ks-color-primary-800) / <alpha-value>)",
          900: "rgb(var(--ks-color-primary-900) / <alpha-value>)"
        },
        success: "rgb(var(--ks-color-success) / <alpha-value>)",
        warning: "rgb(var(--ks-color-warning) / <alpha-value>)",
        error: "rgb(var(--ks-color-error) / <alpha-value>)",
        info: "rgb(var(--ks-color-info) / <alpha-value>)"
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px"
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px"
      },
      boxShadow: {
        0: "none",
        1: "0 1px 2px rgba(0, 0, 0, 0.24)",
        2: "0 8px 24px rgba(0, 0, 0, 0.28)",
        3: "0 16px 40px rgba(0, 0, 0, 0.32)"
      }
    }
  },
  plugins: []
};
