/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./ui/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#F47C25",
        secondary: "#3C454C",
        tertiary: "#E84E4C",
        background: "#fffcfa"
      },
      fontFamily: {
        tlight: ["RobotoCondensed-Light", "sans-serif"],
        tmedium: ["RobotoCondensed-Medium", "sans-serif"],
        tregular: ["RobotoCondensed-Regular", "sans-serif"],
        tsemibold: ["RobotoCondensed-SemiBold", "sans-serif"],
        tbold: ["RobotoCondensed-Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
};
