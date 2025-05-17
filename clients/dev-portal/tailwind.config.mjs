/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "./node_modules/flowbite/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0078D4", // Microsoft blue
          100: "#E6F2FB",
          200: "#B3D7F2",
          300: "#80BCE9",
          400: "#4DA1E0",
          500: "#0078D4",
          600: "#0062AB",
          700: "#004982",
          800: "#003159",
          900: "#001830",
        },
        secondary: {
          DEFAULT: "#2B2B2B", // Dark gray
          100: "#E8E8E8",
          200: "#C5C5C5",
          300: "#A2A2A2",
          400: "#7F7F7F",
          500: "#5C5C5C",
          600: "#4A4A4A",
          700: "#393939",
          800: "#2B2B2B",
          900: "#1A1A1A",
        },
        accent: {
          DEFAULT: "#FFB900", // Yellow
          100: "#FFF6E6",
          200: "#FFE7B3",
          300: "#FFD880",
          400: "#FFC94D",
          500: "#FFB900",
          600: "#CC9400",
          700: "#996F00",
          800: "#664A00",
          900: "#332500",
        }
      },
    },
  },
  plugins: [require("flowbite/plugin")],
};
