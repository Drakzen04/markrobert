import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F14",
        panel: "#11161D",
        panel2: "#161C25",
        line: "#232B36",
        gold: "#C9A24B",
        gold2: "#E8C976",
        buy: "#4FA37A",
        sell: "#C0564D",
        muted: "#8A93A3",
        paper: "#EDEFF3"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
