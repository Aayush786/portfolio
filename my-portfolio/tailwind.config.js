/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // enable manual dark mode toggle
  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 10s linear infinite", // for the tech ring animation
        pulse: "pulse 4s ease-in-out infinite",   // smooth background pulse
      },
      backgroundImage: {
        "glass-gradient":
          "linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
      },
      boxShadow: {
        neon: "0 0 20px rgba(236,72,153,0.6), 0 0 40px rgba(79,70,229,0.5)",
      },
    },
  },
  plugins: [],
};