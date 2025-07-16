const { green, grass, mauve } = require('@radix-ui/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./**/*.vue'],
  theme: {
    extend: {
      colors: {
        ...mauve,
        ...green,
        ...grass,
      },
      keyframes: {
        slideDown: {
          from: { height: 0 },
          to: { height: 'var(--reka-accordion-content-height)' },
        },
        slideUp: {
          from: { height: 'var(--reka-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        slideDown: 'slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1)',
        slideUp: 'slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1)',
      },
    },
  },
  plugins: [],
}
