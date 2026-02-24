/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 10s linear infinite",
        pulse: "pulse 4s ease-in-out infinite",
      },
      boxShadow: {
        neon: "0 0 20px rgba(236,72,153,0.6), 0 0 40px rgba(79,70,229,0.5)",
      },
    },
  },
  plugins: [],
};