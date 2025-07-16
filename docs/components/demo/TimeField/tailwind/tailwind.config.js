const { blackA, grass, gray, green } = require('@radix-ui/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./**/*.vue'],
  theme: {
    extend: {
      colors: {
        ...blackA,
        ...grass,
        ...gray,
        ...green,
      },
    },
  },
  plugins: [],
}
