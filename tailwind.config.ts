import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        "move-bg": "moveBg 10s infinite alternate",
      },
      keyframes: {
        moveBg: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      backgroundImage: {
        "radial-gradient":
          "radial-gradient(circle at center, #00ffff33 0%, transparent 40%), radial-gradient(circle at top left, #ff00ff33 0%, transparent 40%), radial-gradient(circle at bottom right, #ffff0033 0%, transparent 40%)",
      },
    },
  },
  plugins: [],
};
export default config;
