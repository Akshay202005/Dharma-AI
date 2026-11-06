/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cosmic: "#03060C",
        gold: "#FFD76A",
        "gold-dark": "#A87A22",
        ivory: "#F5F1E6",
        muted: "#8A8F9C",
      },
    },
  },
  plugins: [],
};