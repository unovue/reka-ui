import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming'

// Mirrors the reka-ui docs dark theme (docs/.vitepress/theme/style.css):
// hsl() tokens converted to hex.
const theme = create({
  base: 'dark',

  brandTitle: 'Reka UI',
  brandUrl: 'https://reka-ui.com',
  brandImage: './logo.svg',
  brandTarget: '_blank',

  colorPrimary: '#56d799', // --primary (dark): hsl(151 62% 59%)
  colorSecondary: '#16a34a', // --primary (light) / brand green: hsl(142.1 76.2% 36.3%)

  appBg: '#0b0f0d', // --background: hsl(141 17% 5%)
  appContentBg: '#0b0f0d',
  appPreviewBg: '#0b0f0d',
  appBorderColor: '#27272a', // --border: hsl(240 3.7% 15.9%)
  appBorderRadius: 8, // --radius: 0.5rem

  textColor: '#f2f2f2', // --foreground: hsl(0 0% 95%)
  textInverseColor: '#09090b',
  textMutedColor: '#9ea3a2', // --muted-foreground: hsl(168 2.6% 62.9%)

  barBg: '#0b0f0d',
  barTextColor: '#9ea3a2',
  barHoverColor: '#56d799',
  barSelectedColor: '#56d799',

  buttonBg: '#1c1917', // --card: hsl(24 9.8% 10%)
  buttonBorder: '#27272a',
  booleanBg: '#1c1917',
  booleanSelectedBg: '#27272a',

  inputBg: '#0b0f0d',
  inputBorder: '#27272a',
  inputTextColor: '#f2f2f2',
  inputBorderRadius: 6,

  fontBase: '"Geist", ui-sans-serif, system-ui, sans-serif',
  fontCode: '"GeistMono", ui-monospace, SFMono-Regular, Menlo, monospace',
})

addons.setConfig({ theme })
