import type { Preview } from '@storybook/vue3-vite'
import './style.css'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      // Matches the reka-ui docs theme (--background in dark/light mode).
      options: {
        dark: { name: 'Dark', value: '#0b0f0d' },
        light: { name: 'Light', value: '#ffffff' },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'dark' },
  },
}

export default preview
