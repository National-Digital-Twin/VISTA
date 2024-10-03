/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{jsx,js,tsx,ts}"],
  theme: {
    extend: {
      colors: {
        error: "#B80000",
        whiteSmoke: {
          DEFAULT: "#F5F5F5",
          50: "#E9E9E9",
          100: "#DDDDDD",
          200: "#D0D0D0",
          300: "#C4C4C4",
          400: "#ACACAC",
          500: "#949494",
          600: "#7C7C7C",
          700: "#636363",
          800: "#4B4B4B",
          900: "#333333",
        },
        black: {
          DEFAULT: "#0A0A0A",
          50: "#141414",
          100: "#1D1D1D",
          200: "#272727",
          300: "#303030",
          400: "#444444",
          500: "#575757",
          600: "#6A6A6A",
          700: "#7D7D7D",
          800: "#909090",
          900: "#A3A3A3",
        },
      },
    },
  },
  plugins: [],
};
