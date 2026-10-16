import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F2F4F1",
        panel: "#FBFCFA",
        ink: "#17212B",
        muted: "#55626C",
        rule: "#D3DAD4",
        gain: "#0E7C66",
        loss: "#B3382C",
        caution: "#8A5A0B",
        navy: "#1F3A5F",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
