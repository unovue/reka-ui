import type { HSBColor, HSLColor, RGBColor } from './types'
import { describe, expect, it } from 'vitest'
import { getChannelColorSpace, getChannelValue, setChannelValue, setChannelValues } from './channel'
import { isEqualColor } from './isEqualColor'

const greyHsl: HSLColor = { space: 'hsl', h: 200, s: 0, l: 50, alpha: 1 }
const greyHsb: HSBColor = { space: 'hsb', h: 200, s: 0, b: 50, alpha: 1 }
const rgb: RGBColor = { space: 'rgb', r: 5, g: 4, b: 4, alpha: 1 }

describe('getChannelColorSpace', () => {
  it('prefers the given space when it holds every channel', () => {
    expect(getChannelColorSpace(['hue', 'saturation'], 'hsb')).toBe('hsb')
    expect(getChannelColorSpace('alpha', 'rgb')).toBe('rgb')
  })

  it('falls back to the space that holds the channels', () => {
    expect(getChannelColorSpace('red', 'hsl')).toBe('rgb')
    expect(getChannelColorSpace(['saturation', 'brightness'], 'rgb')).toBe('hsb')
    expect(getChannelColorSpace(['hue', 'lightness'])).toBe('hsl')
    expect(getChannelColorSpace('saturation', 'rgb')).toBe('hsl')
  })
})

describe('getChannelValue', () => {
  it('reads the channel from the color\'s own space, keeping the hue of greys', () => {
    expect(getChannelValue(greyHsl, 'hue')).toBe(200)
    expect(getChannelValue(greyHsb, 'hue')).toBe(200)
    expect(getChannelValue(greyHsb, 'saturation')).toBe(0)
  })

  it('converts on demand for channels outside the space', () => {
    expect(getChannelValue(rgb, 'saturation')).toBeCloseTo(100 / 9, 6)
    expect(getChannelValue(rgb, 'brightness')).toBeCloseTo(5 / 2.55, 6)
    expect(getChannelValue(greyHsl, 'red')).toBeCloseTo(127.5, 6)
    expect(getChannelValue({ ...rgb, alpha: 0.25 }, 'alpha')).toBe(25)
  })

  it('throws for unknown channels', () => {
    expect(() => getChannelValue(rgb, 'chroma' as never)).toThrow()
  })
})

describe('setChannelValue', () => {
  it('writes natively and returns a new object', () => {
    const next = setChannelValue(greyHsl, 'hue', 120)
    expect(next).toEqual({ ...greyHsl, h: 120 })
    expect(next).not.toBe(greyHsl)
    expect(greyHsl.h).toBe(200)
  })

  it('keeps fractional precision and clamps to the channel range', () => {
    expect(setChannelValue(greyHsl, 'saturation', 12.345)).toMatchObject({ s: 12.345 })
    expect(setChannelValue(greyHsl, 'hue', 999)).toMatchObject({ h: 360 })
    expect(setChannelValue(rgb, 'red', -4)).toMatchObject({ r: 0 })
    expect(setChannelValue(rgb, 'alpha', 50)).toMatchObject({ alpha: 0.5 })
  })

  it('returns the original space for a channel outside it', () => {
    const next = setChannelValue(rgb, 'saturation', 50)
    expect(next.space).toBe('rgb')
    expect(getChannelValue(next, 'saturation')).toBeCloseTo(50, 6)
  })
})

describe('setChannelValues', () => {
  it('sets every channel in the space that holds them all', () => {
    expect(setChannelValues(greyHsb, [{ channel: 'saturation', value: 40 }, { channel: 'brightness', value: 60 }]))
      .toEqual({ space: 'hsb', h: 200, s: 40, b: 60, alpha: 1 })
    const fromRgb = setChannelValues(rgb, [{ channel: 'hue', value: 300 }, { channel: 'lightness', value: 20 }])
    expect(fromRgb).toMatchObject({ space: 'hsl', h: 300, l: 20 })
  })

  it('returns the input for no channels', () => {
    expect(setChannelValues(rgb, [])).toBe(rgb)
  })

  it('produces a different color when only the hue of a grey changes', () => {
    const next = setChannelValues(greyHsl, [{ channel: 'hue', value: 10 }])
    expect(isEqualColor(next, greyHsl)).toBe(false)
  })
})

describe('isEqualColor', () => {
  it('compares across spaces structurally', () => {
    expect(isEqualColor('#ff0000', { space: 'hsl', h: 0, s: 100, l: 50, alpha: 1 })).toBe(true)
    expect(isEqualColor('#ff0000', '#ff0001')).toBe(false)
    expect(isEqualColor({ ...greyHsl }, greyHsl)).toBe(true)
    expect(isEqualColor(greyHsl, { ...greyHsl, alpha: 0.5 })).toBe(false)
  })

  it('treats the hue of a grey as part of the color, in both argument orders', () => {
    expect(isEqualColor('#808080', { ...greyHsl, l: 128 / 2.55 })).toBe(false)
    expect(isEqualColor({ ...greyHsl, l: 128 / 2.55 }, '#808080')).toBe(false)
    // HSL and HSB share the hue axis, so the same grey with the same hue is equal.
    expect(isEqualColor(greyHsl, greyHsb)).toBe(true)
    expect(isEqualColor(greyHsl, { ...greyHsb, h: 100 })).toBe(false)
  })
})
