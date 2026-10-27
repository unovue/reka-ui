// Channel operations
export { getChannelColorSpace, getChannelName, getChannelRange, getChannelValue, setChannelValue, setChannelValues } from './channel'

// Conversion
export {
  colorToHex,
  colorToHsb,
  colorToHsl,
  colorToRgb,
  colorToString,
  convertToHsb,
  convertToHsl,
  convertToRgb,
  convertToSpace,
} from './convert'

// Gradients
export { getAreaBackgroundStyle, getAreaGradient, getSliderBackgroundStyle, getSliderGradient, getSliderGradientDirection } from './gradient'
export type { SliderGradientLayout } from './gradient'

// Equality
export { isEqualColor } from './isEqualColor'

// Parsing
export { isValidColor, normalizeColor, parseColor } from './parse'

// Types
export type {
  ChannelRange,
  Color,
  ColorChannel,
  ColorFormat,
  ColorSpace,
  HSBColor,
  HSLColor,
  RGBColor,
} from './types'

// Legacy utilities (keeping for backwards compatibility)
export { getColorContrast, getColorName, hexToHSL, hexToRGB } from './utils'
