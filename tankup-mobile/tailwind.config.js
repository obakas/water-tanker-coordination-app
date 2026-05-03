/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0b1220",
        card: "#111a2e",
        border: "#1f2a44",
        foreground: "#e6edf7",
        muted: "#7c8aa6",
        primary: "#1e88ff",
        "primary-foreground": "#ffffff",
        success: "#22c55e",
        warning: "#f59e0b",
        destructive: "#ef4444",
      },
    },
  },
  plugins: [],
};
