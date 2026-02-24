import type { Preview } from '@storybook/vue3-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import { darkTheme } from './manager'
import './style.css'

const preview: Preview = {
  parameters: {
    // Center stories (equivalent to Histoire's centering)
    layout: 'centered',
    docs: {
      canvas: { sourceState: 'shown' },
      // Use dark theme for docs by default
      theme: darkTheme,
    },
    // Set dark as default theme
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0f0c' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
}

export const decorators = [
  withThemeByClassName({
    themes: {
      light: 'light',
      dark: 'dark',
    },
    defaultTheme: 'dark',
  }),
]

export default preview
