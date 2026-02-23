import type { Preview } from '@storybook/vue3'
import './style.css'

const preview: Preview = {
  parameters: {
    // Center stories (equivalent to Histoire's centering)
    layout: 'centered',
    docs: {
      canvas: { sourceState: 'shown' },
    },
  },
}

export default preview
