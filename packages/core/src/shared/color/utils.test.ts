import type { HSBColor, HSLColor } from './types'
import { describe, expect, it } from 'vitest'
import {
  colorToHex,
  colorToHsl,
  colorToRgb,
  convertToHsb,
  convertToHsl,
  convertToRgb,
  getChannelRange,
  getChannelValue,
  isValidColor,
  normalizeColor,
  parseColor,
  setChannelValue,
  setChannelValues,
} from './index'

describe('color utilities', () => {
  describe('parseColor', () => {
    it('should parse hex colors', () => {
      expect(parseColor('#ff0000')).toEqual({
        space: 'rgb',
        r: 255,
        g: 0,
        b: 0,
        alpha: 1,
      })
      expect(parseColor('#00ff00')).toEqual({
        space: 'rgb',
        r: 0,
        g: 255,
        b: 0,
        alpha: 1,
      })
      expect(parseColor('#0000ff')).toEqual({
        space: 'rgb',
        r: 0,
        g: 0,
        b: 255,
        alpha: 1,
      })
    })

    it('should parse shorthand hex colors', () => {
      expect(parseColor('#f00')).toEqual({
        space: 'rgb',
        r: 255,
        g: 0,
        b: 0,
        alpha: 1,
      })
    })

    it('should parse hex with alpha', () => {
      expect(parseColor('#ff000080')).toEqual({
        space: 'rgb',
        r: 255,
        g: 0,
        b: 0,
        alpha: expect.closeTo(0.5, 0.01),
      })
    })

    it('should parse rgb() colors', () => {
      expect(parseColor('rgb(255, 128, 64)')).toEqual({
        space: 'rgb',
        r: 255,
        g: 128,
        b: 64,
        alpha: 1,
      })
    })

    it('should parse rgba() colors', () => {
      expect(parseColor('rgba(255, 128, 64, 0.5)')).toEqual({
        space: 'rgb',
        r: 255,
        g: 128,
        b: 64,
        alpha: 0.5,
      })
    })

    it('should parse hsl() colors', () => {
      expect(parseColor('hsl(120, 50%, 50%)')).toEqual({
        space: 'hsl',
        h: 120,
        s: 50,
        l: 50,
        alpha: 1,
      })
    })

    it('should parse hsla() colors', () => {
      expect(parseColor('hsla(120, 50%, 50%, 0.5)')).toEqual({
        space: 'hsl',
        h: 120,
        s: 50,
        l: 50,
        alpha: 0.5,
      })
    })

    it('should throw for invalid colors', () => {
      expect(() => parseColor('not a color')).toThrow()
      expect(() => parseColor('#gggggg')).toThrow()
    })
  })

  describe('isValidColor', () => {
    it('should return true for valid colors', () => {
      expect(isValidColor('#ff0000')).toBe(true)
      expect(isValidColor('rgb(255, 0, 0)')).toBe(true)
      expect(isValidColor('hsl(0, 100%, 50%)')).toBe(true)
    })

    it('should return false for invalid colors', () => {
      expect(isValidColor('not a color')).toBe(false)
      expect(isValidColor('#gggggg')).toBe(false)
    })
  })

  describe('normalizeColor', () => {
    it('should parse string colors', () => {
      const result = normalizeColor('#ff0000')
      expect(result.space).toBe('rgb')
      expect(result).toEqual(parseColor('#ff0000'))
    })

    it('should return color objects as-is', () => {
      const color = { space: 'hsl' as const, h: 120, s: 50, l: 50, alpha: 1 }
      expect(normalizeColor(color)).toBe(color)
    })
  })

  describe('colorToHex', () => {
    it('should convert RGB to hex', () => {
      const color = { space: 'rgb' as const, r: 255, g: 128, b: 64, alpha: 1 }
      expect(colorToHex(color)).toBe('#ff8040')
    })

    it('should convert HSL to hex', () => {
      const color = { space: 'hsl' as const, h: 0, s: 100, l: 50, alpha: 1 }
      expect(colorToHex(color)).toBe('#ff0000')
    })

    it('should include alpha for transparent colors', () => {
      const color = { space: 'rgb' as const, r: 255, g: 0, b: 0, alpha: 0.5 }
      expect(colorToHex(color)).toBe('#ff000080')
    })
  })

  describe('colorToRgb', () => {
    it('should format RGB color', () => {
      const color = { space: 'rgb' as const, r: 255, g: 128, b: 64, alpha: 1 }
      expect(colorToRgb(color)).toBe('rgb(255, 128, 64)')
    })

    it('should format RGBA for transparent colors', () => {
      const color = { space: 'rgb' as const, r: 255, g: 0, b: 0, alpha: 0.5 }
      expect(colorToRgb(color)).toBe('rgba(255, 0, 0, 0.5)')
    })
  })

  describe('colorToHsl', () => {
    it('should format HSL color', () => {
      const color = { space: 'hsl' as const, h: 120, s: 50, l: 50, alpha: 1 }
      expect(colorToHsl(color)).toBe('hsl(120, 50%, 50%)')
    })

    it('should format HSLA for transparent colors', () => {
      const color = { space: 'hsl' as const, h: 0, s: 100, l: 50, alpha: 0.5 }
      expect(colorToHsl(color)).toBe('hsla(0, 100%, 50%, 0.5)')
    })
  })

  describe('convertToRgb', () => {
    it('should convert HSL to RGB', () => {
      const hsl = { space: 'hsl' as const, h: 0, s: 100, l: 50, alpha: 1 }
      const rgb = convertToRgb(hsl)
      expect(rgb.space).toBe('rgb')
      expect(rgb.r).toBeCloseTo(255, 0)
      expect(rgb.g).toBeCloseTo(0, 0)
      expect(rgb.b).toBeCloseTo(0, 0)
    })

    it('should preserve existing RGB', () => {
      const rgb = { space: 'rgb' as const, r: 128, g: 64, b: 32, alpha: 1 }
      expect(convertToRgb(rgb)).toBe(rgb)
    })
  })

  describe('convertToHsl', () => {
    it('should convert RGB to HSL', () => {
      const rgb = { space: 'rgb' as const, r: 255, g: 0, b: 0, alpha: 1 }
      const hsl = convertToHsl(rgb)
      expect(hsl.space).toBe('hsl')
      expect(hsl.h).toBeCloseTo(0, 0)
      expect(hsl.s).toBeCloseTo(100, 0)
      expect(hsl.l).toBeCloseTo(50, 0)
    })

    it('should preserve existing HSL', () => {
      const hsl = { space: 'hsl' as const, h: 120, s: 50, l: 50, alpha: 1 }
      expect(convertToHsl(hsl)).toBe(hsl)
    })
  })

  describe('convertToHsb', () => {
    it('should convert RGB to HSB', () => {
      const rgb = { space: 'rgb' as const, r: 255, g: 0, b: 0, alpha: 1 }
      const hsb = convertToHsb(rgb)
      expect(hsb.space).toBe('hsb')
      expect(hsb.h).toBeCloseTo(0, 0)
      expect(hsb.s).toBeCloseTo(100, 0)
    })

    it('should preserve existing HSB', () => {
      const hsb = { space: 'hsb' as const, h: 120, s: 50, b: 75, alpha: 1 }
      expect(convertToHsb(hsb)).toBe(hsb)
    })
  })

  describe('getChannelRange', () => {
    it('should return correct ranges for hue', () => {
      expect(getChannelRange('hue')).toEqual({ min: 0, max: 360, step: 1 })
    })

    it('should return correct ranges for saturation/lightness/brightness/alpha', () => {
      expect(getChannelRange('saturation')).toEqual({ min: 0, max: 100, step: 1 })
      expect(getChannelRange('lightness')).toEqual({ min: 0, max: 100, step: 1 })
      expect(getChannelRange('brightness')).toEqual({ min: 0, max: 100, step: 1 })
      expect(getChannelRange('alpha')).toEqual({ min: 0, max: 100, step: 1 })
    })

    it('should return correct ranges for RGB channels', () => {
      expect(getChannelRange('red')).toEqual({ min: 0, max: 255, step: 1 })
      expect(getChannelRange('green')).toEqual({ min: 0, max: 255, step: 1 })
      expect(getChannelRange('blue')).toEqual({ min: 0, max: 255, step: 1 })
    })
  })

  describe('getChannelValue', () => {
    it('should get RGB values', () => {
      const rgb = { space: 'rgb' as const, r: 100, g: 150, b: 200, alpha: 1 }
      expect(getChannelValue(rgb, 'red')).toBe(100)
      expect(getChannelValue(rgb, 'green')).toBe(150)
      expect(getChannelValue(rgb, 'blue')).toBe(200)
    })

    it('should get HSL values', () => {
      const hsl = { space: 'hsl' as const, h: 120, s: 50, l: 50, alpha: 1 }
      expect(getChannelValue(hsl, 'hue')).toBe(120)
      expect(getChannelValue(hsl, 'saturation')).toBe(50)
      expect(getChannelValue(hsl, 'lightness')).toBe(50)
    })

    it('should get alpha as percentage', () => {
      const rgb = { space: 'rgb' as const, r: 100, g: 150, b: 200, alpha: 0.5 }
      expect(getChannelValue(rgb, 'alpha')).toBe(50)
    })
  })

  describe('getChannelValue - color space specific', () => {
    it('should get HSL saturation directly from HSL color', () => {
      const hsl: HSLColor = { space: 'hsl', h: 120, s: 50, l: 50, alpha: 1 }
      expect(getChannelValue(hsl, 'saturation')).toBe(50)
    })

    it('should get HSB saturation directly from HSB color', () => {
      const hsb: HSBColor = { space: 'hsb', h: 120, s: 50, b: 50, alpha: 1 }
      expect(getChannelValue(hsb, 'saturation')).toBe(50)
    })

    it('should get HSB brightness directly from HSB color', () => {
      const hsb: HSBColor = { space: 'hsb', h: 120, s: 50, b: 75, alpha: 1 }
      expect(getChannelValue(hsb, 'brightness')).toBe(75)
    })
  })

  describe('setChannelValues', () => {
    it('should set HSB saturation and brightness without cross-contamination', () => {
      // Start with HSB color
      const hsb: HSBColor = { space: 'hsb', h: 0, s: 0, b: 50, alpha: 1 }

      // Set saturation to 10, brightness stays at 50
      const result = setChannelValues(hsb, [
        { channel: 'saturation', value: 10 },
        { channel: 'brightness', value: 50 },
      ])

      expect(result.space).toBe('hsb')
      expect(getChannelValue(result, 'saturation')).toBe(10)
      expect(getChannelValue(result, 'brightness')).toBe(50)
    })

    it('should return HSB color when starting from RGB with saturation/brightness channels', () => {
      // Start with RGB color (like from hex)
      const rgb: RGBColor = { space: 'rgb', r: 128, g: 0, b: 128, alpha: 1 }

      // Set saturation to 99, brightness to 50
      const result = setChannelValues(rgb, [
        { channel: 'saturation', value: 99 },
        { channel: 'brightness', value: 50 },
      ])

      // Should return HSB (not convert back to RGB)
      expect(result.space).toBe('hsb')
      expect(getChannelValue(result, 'saturation')).toBe(99)
      expect(getChannelValue(result, 'brightness')).toBe(50)
    })

    it('should update only saturation when brightness unchanged', () => {
      const hsb: HSBColor = { space: 'hsb', h: 0, s: 0, b: 50, alpha: 1 }

      // Increase saturation to 10
      const result = setChannelValues(hsb, [
        { channel: 'saturation', value: 10 },
        { channel: 'brightness', value: 50 },
      ])

      expect(getChannelValue(result, 'saturation')).toBe(10)
      expect(getChannelValue(result, 'brightness')).toBe(50)
    })
  })

  describe('setChannelValue', () => {
    it('should set RGB values', () => {
      const rgb = { space: 'rgb' as const, r: 100, g: 150, b: 200, alpha: 1 }
      const result = setChannelValue(rgb, 'red', 255)
      expect(result.space).toBe('rgb')
      expect((result as any).r).toBe(255)
    })

    it('should set HSL values preserving color space', () => {
      const hsl = { space: 'hsl' as const, h: 120, s: 50, l: 50, alpha: 1 }
      const result = setChannelValue(hsl, 'hue', 180)
      expect(result.space).toBe('hsl')
      expect((result as any).h).toBe(180)
    })

    it('should set alpha value', () => {
      const rgb = { space: 'rgb' as const, r: 100, g: 150, b: 200, alpha: 1 }
      const result = setChannelValue(rgb, 'alpha', 50)
      expect(result.alpha).toBe(0.5)
    })

    it('should clamp values to valid range', () => {
      const hsl = { space: 'hsl' as const, h: 120, s: 50, l: 50, alpha: 1 }
      const result = setChannelValue(hsl, 'hue', 500)
      expect((result as any).h).toBe(360)
    })

    it('should maintain color space when setting cross-space channels', () => {
      const hsl = { space: 'hsl' as const, h: 120, s: 50, l: 50, alpha: 1 }
      const result = setChannelValue(hsl, 'red', 255)
      expect(result.space).toBe('hsl')
    })
  })
})
