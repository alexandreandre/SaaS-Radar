import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: {
          DEFAULT: "#2563EB",
          foreground: "#ffffff",
          muted: "#EFF6FF",
        },
        hero: "#0A0A0A",
        muted: {
          DEFAULT: "#F4F4F5",
          foreground: "#71717A",
        },
        border: "#E4E4E7",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover": "0 10px 40px -10px rgb(0 0 0 / 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
