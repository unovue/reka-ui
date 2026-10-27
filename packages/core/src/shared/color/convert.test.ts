import type { Color, HSBColor, HSLColor, RGBColor } from './types'
import { describe, expect, it } from 'vitest'
import { colorToHex, colorToString, convertToHsb, convertToHsl, convertToRgb, convertToSpace } from './convert'

function expectClose(actual: Color, expected: Color) {
  expect(actual.space).toBe(expected.space)
  for (const [key, value] of Object.entries(expected)) {
    if (typeof value === 'number')
      expect((actual as unknown as Record<string, number>)[key]).toBeCloseTo(value, 6)
  }
}

const red: RGBColor = { space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 }
const teal: RGBColor = { space: 'rgb', r: 0, g: 128, b: 128, alpha: 0.5 }

describe('convert', () => {
  it('converts RGB to HSL and HSB', () => {
    expectClose(convertToHsl(red), { space: 'hsl', h: 0, s: 100, l: 50, alpha: 1 })
    expectClose(convertToHsb(red), { space: 'hsb', h: 0, s: 100, b: 100, alpha: 1 })
    expectClose(convertToHsl(teal), { space: 'hsl', h: 180, s: 100, l: 128 / 255 * 50, alpha: 0.5 })
  })

  it.each([
    { space: 'rgb', r: 12.5, g: 200, b: 99, alpha: 0.3 },
    { space: 'hsl', h: 275.25, s: 63.5, l: 41.2, alpha: 1 },
    { space: 'hsb', h: 33.3, s: 12, b: 87.5, alpha: 0.75 },
  ] satisfies Color[])('round-trips $space through every space without loss', (color) => {
    for (const space of ['rgb', 'hsl', 'hsb'] as const)
      expectClose(convertToSpace(convertToSpace(color, space), color.space), color)
  })

  it('returns the same object when the color is already in the target space', () => {
    const hsl: HSLColor = { space: 'hsl', h: 1, s: 2, l: 3, alpha: 1 }
    expect(convertToSpace(hsl, 'hsl')).toBe(hsl)
    expect(convertToRgb(red)).toBe(red)
  })

  it('keeps the hue of a grey between HSL and HSB', () => {
    const grey: HSLColor = { space: 'hsl', h: 200, s: 0, l: 50, alpha: 1 }
    const hsb = convertToHsb(grey)
    expectClose(hsb, { space: 'hsb', h: 200, s: 0, b: 50, alpha: 1 })
    expectClose(convertToHsl(hsb), grey)
    // RGB has no hue, so the grey comes back with hue 0.
    expect(convertToHsl(convertToRgb(grey)).h).toBe(0)
  })

  it('handles black and white without dividing by zero', () => {
    const black: HSBColor = { space: 'hsb', h: 120, s: 50, b: 0, alpha: 1 }
    expectClose(convertToHsl(black), { space: 'hsl', h: 120, s: 0, l: 0, alpha: 1 })
    const white: HSLColor = { space: 'hsl', h: 60, s: 30, l: 100, alpha: 1 }
    expectClose(convertToHsb(white), { space: 'hsb', h: 60, s: 0, b: 100, alpha: 1 })
  })

  it('serializes to strings, rounding only on output', () => {
    const hsl: HSLColor = { space: 'hsl', h: 120.4, s: 50.6, l: 50, alpha: 1 }
    expect(colorToHex(red)).toBe('#ff0000')
    expect(colorToHex(teal)).toBe('#00808080')
    expect(colorToString(hsl, 'hsl')).toBe('hsl(120, 51%, 50%)')
    expect(colorToString(red, 'hsb')).toBe('hsb(0, 100%, 100%)')
    expect(colorToString(teal, 'rgb')).toBe('rgba(0, 128, 128, 0.5)')
    expect(() => colorToString(red, 'lab' as never)).toThrow()
  })
})
