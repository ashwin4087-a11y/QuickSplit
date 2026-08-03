/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#10B981",
        surface: "#1E293B",
        background: "#0B1220",
        "on-surface": "#dce2f6",
        "on-surface-variant": "#94a3b8",
        "outline-variant": "#334155",
        "error-container": "#ef4444"
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
