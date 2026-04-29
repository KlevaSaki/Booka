export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0F3D2E",
        background: "#F5F1E8",
        success: "#16A34A",
        danger: "#DC2626",
      },
      spacing: {
        1: "8px",
        2: "16px",
        3: "24px",
        4: "32px",
      },
    },
  },
  plugins: [],
};