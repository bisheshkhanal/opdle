import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Treasure Map Parchment - warm, weathered paper tones
        parchment: {
          50: "#FDF8F0", // cream highlight
          100: "#F9F0E3", // main background
          200: "#F0E4D1", // card background
          300: "#E3D4B8", // borders, muted
          400: "#C9B896", // aged paper edge
          500: "#A89470", // dark parchment
        },
        // Deep Ocean Navy - rich nautical ink
        navy: {
          50: "#f0f4f8",
          100: "#dce4ed",
          200: "#b8c9db",
          300: "#8aa6c2",
          400: "#5c82a8",
          500: "#3d6389",
          600: "#1E3A5F", // primary text
          700: "#15294A", // headers, emphasis
          800: "#0D1B31", // deepest ink
          900: "#08101D", // near-black
        },
        // Gleaming Treasure Gold - bright, vibrant
        gold: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#F4C430", // bright gold
          500: "#D4A520", // standard gold
          600: "#B8860B", // dark gold
          700: "#8B6914", // aged gold
          800: "#6B5210",
          900: "#4A3A0C",
        },
        // Bold Tile Colors - high contrast, punchy
        tile: {
          // Correct: rich forest green
          correct: "#2E7D32",
          correctBorder: "#1B5E20",
          correctDark: "#145218",
          // Partial: bright amber gold
          partial: "#E6A700",
          partialBorder: "#C99000",
          partialDark: "#A67C00",
          // Wrong: bold crimson
          wrong: "#C62828",
          wrongBorder: "#B71C1C",
          wrongDark: "#8E0000",
          // Unknown: steel gray
          unknown: "#546E7A",
          unknownBorder: "#455A64",
          unknownDark: "#37474F",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-alegreya)", "Georgia", "serif"],
        pirate: ["var(--font-pirate)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.05)",
        card: "0 2px 8px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.08)",
        float: "0 4px 20px rgba(0, 0, 0, 0.12), 0 8px 40px rgba(0, 0, 0, 0.1)",
        glow: "0 0 20px rgba(244, 196, 48, 0.3), 0 0 40px rgba(244, 196, 48, 0.15)",
        inner: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
        "inner-soft": "inset 0 1px 2px rgba(0, 0, 0, 0.06)",
        "tile-correct":
          "0 4px 12px rgba(46, 125, 50, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        "tile-wrong":
          "0 4px 12px rgba(198, 40, 40, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        "tile-partial":
          "0 4px 12px rgba(230, 167, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
      },
      animation: {
        "tile-flip": "tileFlipBold 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slide-up": "slideUpBounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fade-in": "fadeIn 0.2s ease-out",
        "scale-in": "scaleInBounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "win-celebrate": "winCelebrate 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "bounce-subtle": "bounceSubtle 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        tileFlipBold: {
          "0%": {
            transform: "rotateY(-90deg) scale(0.8)",
            opacity: "0",
          },
          "60%": { transform: "rotateY(10deg) scale(1.05)" },
          "100%": { transform: "rotateY(0) scale(1)", opacity: "1" },
        },
        slideUpBounce: {
          "0%": { transform: "translateY(30px)", opacity: "0" },
          "70%": { transform: "translateY(-5px)" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleInBounce: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "70%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        winCelebrate: {
          "0%": {
            transform: "scale(0.5) rotate(-10deg)",
            opacity: "0",
          },
          "50%": { transform: "scale(1.15) rotate(3deg)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      letterSpacing: {
        tighter: "-0.02em",
        tight: "-0.01em",
      },
    },
  },
  plugins: [],
};

export default config;
