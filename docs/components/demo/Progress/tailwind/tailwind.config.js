const { blackA } = require('@radix-ui/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./**/*.vue'],
  theme: {
    extend: {
      colors: {
        ...blackA,
      },
    },
    keyframes: {
      progress: {
        '0%': { backgroundPosition: '0 0' },
        '100%': { backgroundPosition: '30px 30px' },
      },
    },
    animation: {
      progress: 'progress 1s infinite linear',
    },
  },
  plugins: [],
}
