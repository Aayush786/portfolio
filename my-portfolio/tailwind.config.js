/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Space Grotesk',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
        ],
      },
      animation: {
        "spin-slow": "spin 10s linear infinite",
        pulse: "pulse 4s ease-in-out infinite",
      },
      boxShadow: {
        neon: "0 0 20px rgba(16,185,129,0.6), 0 0 40px rgba(79,70,229,0.5)",
      },
    },
  },
  plugins: [],
};