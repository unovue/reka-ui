import { describe, expect, it } from 'vitest'
import * as Reka from '../../index'

// The color utilities at the package root are frozen public API: parsing, comparison,
// conversion and formatting. Channel and gradient helpers stay internal (#2789).
describe('color utilities exported from the package root', () => {
  it.each([
    'parseColor',
    'normalizeColor',
    'isValidColor',
    'isEqualColor',
    'colorToHex',
    'colorToString',
    'convertToRgb',
    'convertToHsl',
    'convertToHsb',
  ])('exports %s', (name) => {
    expect(typeof (Reka as Record<string, unknown>)[name]).toBe('function')
  })

  it.each([
    'colorToRgb',
    'colorToHsl',
    'colorToHsb',
    'convertToSpace',
    'getChannelName',
    'getChannelRange',
    'getChannelValue',
    'getChannelColorSpace',
    'setChannelValue',
    'setChannelValues',
    'getAreaBackgroundStyle',
    'getAreaGradient',
    'getSliderBackgroundStyle',
    'getSliderGradient',
    'getSliderGradientDirection',
    'getColorName',
    'getColorContrast',
    'hexToRGB',
    'hexToHSL',
  ])('does not export the internal helper %s', (name) => {
    expect(name in Reka).toBe(false)
  })
})
