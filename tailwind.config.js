/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#F47C25",
        secondary: "#3C454C",
        tertiary: "#E84E4C",
      },
      fontFamily: {
        rlight: ["RobotoCondensed-Light", "sans-serif"],
        rmedium: ["RobotoCondensed-Medium", "sans-serif"],
        rregular: ["RobotoCondensed-Regular", "sans-serif"],
        rsemibold: ["RobotoCondensed-SemiBold", "sans-serif"],
        rbold: ["RobotoCondensed-Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
};
