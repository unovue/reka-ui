import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming/create'

// Reka UI Color Scheme
const rekaGreen = '#2db47c'
const rekaGreenDark = '#52d69d'

// Reka UI Dark Background
const rekaDarkBg = '#0a0f0c' // hsl(141 17% 5%)
const rekaDarkMuted = '#1c1917' // hsl(0 0% 15%)
const rekaDarkCard = '#1a1714' // hsl(24 9.8% 10%)

// Light theme
const lightTheme = create({
  base: 'light',
  brandTitle: 'Reka UI',
  brandUrl: 'https://reka-ui.com',
  brandTarget: '_blank',
  brandImage: '/logo.png',

  // Colors - Green accent
  colorPrimary: rekaGreen,
  colorSecondary: rekaGreen,

  // UI
  appBg: '#ffffff',
  appContentBg: '#ffffff',
  appPreviewBg: '#ffffff',
  appBorderColor: '#e5e5e5',
  appBorderRadius: 8,

  // Text colors
  textColor: '#18181b',
  textInverseColor: '#ffffff',
  textMutedColor: '#71717a',

  // Toolbar
  barTextColor: '#71717a',
  barSelectedColor: rekaGreen,
  barBg: '#ffffff',

  // Input
  inputBg: '#ffffff',
  inputBorder: '#e5e5e5',
  inputTextColor: '#18181b',
  inputBorderRadius: 6,
})

// Dark theme (default - matching Reka UI)
const darkTheme = create({
  base: 'dark',
  brandTitle: 'Reka UI',
  brandUrl: 'https://reka-ui.com',
  brandTarget: '_blank',
  brandImage: '/logo.png',

  // Colors - Green accent
  colorPrimary: rekaGreenDark,
  colorSecondary: rekaGreenDark,

  // UI - Reka UI dark colors
  appBg: rekaDarkBg,
  appContentBg: rekaDarkBg,
  appPreviewBg: rekaDarkBg,
  appBorderColor: 'rgba(255, 255, 255, 0.1)',
  appBorderRadius: 8,
  appHoverBg: '#56d7991a',

  // Text colors
  textColor: '#fafafa',
  textInverseColor: '#09090b',
  textMutedColor: '#a1a1aa',

  // Toolbar
  barTextColor: '#a1a1aa',
  barSelectedColor: rekaGreenDark,
  barBg: rekaDarkBg,
  barHoverColor: rekaGreen,

  // Input
  inputBg: rekaDarkCard,
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  inputTextColor: '#fafafa',
  inputBorderRadius: 6,
})

// Set the default theme to dark (Reka UI style)
addons.setConfig({
  theme: darkTheme,
})

export { darkTheme, lightTheme }
