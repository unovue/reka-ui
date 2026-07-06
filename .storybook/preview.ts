import type { Preview } from '@storybook/vue3-vite'
import './style.css'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      options: {
        dark: { name: 'Dark', value: '#1c2333' },
        light: { name: 'Light', value: '#f8fafc' },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'dark' },
  },
}

export default preview
