/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{jsx, js}"],
  theme: {
    extend: {
      boxShadow: {
        "surround-lg": "0 0 14px 0 rgb(0 0 0 / 0.05)",
      },
      colors: {
        appColor: "rgb(var(--color-app) / <alpha-value>)",
        error: "#B80000",
        jet: "#292929",
        ravenBlack: "#3D3D3D",
        brilliantLicorice: "#525252",
        greyOfDarkness: "#A3A3A3",
        ravenBlack: "#3D3D3D",
        geoAppColour: "#3CF73C",
        greenishTeal: {
          DEFAULT: "#32BF7B",
        },
        fluorescentRed: {
          DEFAULT: "#FF5454",
        },
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
