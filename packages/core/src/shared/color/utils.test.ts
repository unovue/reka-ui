import { describe, expect, it } from 'vitest'
import { getColorContrast, getColorName, hexToHSL, hexToRGB } from './utils'

describe('hexToRGB', () => {
  it('should convert 6-digit hex color to RGB', () => {
    expect(hexToRGB('#FF5733')).toEqual({ r: 255, g: 87, b: 51 })
    expect(hexToRGB('#ff5733')).toEqual({ r: 255, g: 87, b: 51 })
    expect(hexToRGB('#000000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToRGB('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('should convert 3-digit shorthand hex color to RGB', () => {
    expect(hexToRGB('#F53')).toEqual({ r: 255, g: 85, b: 51 })
    expect(hexToRGB('#f53')).toEqual({ r: 255, g: 85, b: 51 })
    expect(hexToRGB('#000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToRGB('#FFF')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('should handle hex without leading hash', () => {
    expect(hexToRGB('FF5733')).toEqual({ r: 255, g: 87, b: 51 })
    expect(hexToRGB('F53')).toEqual({ r: 255, g: 85, b: 51 })
  })

  it('should throw error for invalid hex colors', () => {
    expect(() => hexToRGB('#GGGGGG')).toThrow('Invalid hex color: GGGGGG')
    expect(() => hexToRGB('#12345')).toThrow('Invalid hex color: 12345')
    expect(() => hexToRGB('#1234567')).toThrow('Invalid hex color: 1234567')
    expect(() => hexToRGB('invalid')).toThrow('Invalid hex color: invalid')
    expect(() => hexToRGB('')).toThrow('Invalid hex color: ')
  })
})

describe('hexToHSL', () => {
  it('should convert hex color to HSL correctly', () => {
    const red = hexToHSL('#FF0000')
    expect(red.h).toBeCloseTo(0, 0)
    expect(red.s).toBeCloseTo(100, 0)
    expect(red.l).toBeCloseTo(50, 0)

    const green = hexToHSL('#00FF00')
    expect(green.h).toBeCloseTo(120, 0)
    expect(green.s).toBeCloseTo(100, 0)
    expect(green.l).toBeCloseTo(50, 0)

    const blue = hexToHSL('#0000FF')
    expect(blue.h).toBeCloseTo(240, 0)
    expect(blue.s).toBeCloseTo(100, 0)
    expect(blue.l).toBeCloseTo(50, 0)
  })

  it('should handle achromatic colors (grays)', () => {
    const black = hexToHSL('#000000')
    expect(black.h).toBe(0)
    expect(black.s).toBe(0)
    expect(black.l).toBe(0)

    const white = hexToHSL('#FFFFFF')
    expect(white.h).toBe(0)
    expect(white.s).toBe(0)
    expect(white.l).toBe(100)

    const gray = hexToHSL('#808080')
    expect(gray.h).toBe(0)
    expect(gray.s).toBe(0)
    expect(gray.l).toBeCloseTo(50, 0)
  })

  it('should handle 3-digit shorthand hex colors', () => {
    const red = hexToHSL('#F00')
    expect(red.h).toBeCloseTo(0, 0)
    expect(red.s).toBeCloseTo(100, 0)
    expect(red.l).toBeCloseTo(50, 0)
  })
})

describe('getColorName', () => {
  it('should return correct achromatic color names', () => {
    expect(getColorName('#000000')).toBe('black')
    expect(getColorName('#FFFFFF')).toBe('white')
    expect(getColorName('#1a1a1a')).toBe('very dark gray')
    expect(getColorName('#333333')).toBe('dark gray')
    expect(getColorName('#808080')).toBe('gray')
    expect(getColorName('#aaaaaa')).toBe('light gray')
    expect(getColorName('#eeeeee')).toBe('very light gray')
  })

  it('should return correct base color names by hue', () => {
    expect(getColorName('#9ACD32')).toBe('yellow-green')
    expect(getColorName('#20B2AA')).toBe('cyan')
    expect(getColorName('#8A2BE2')).toBe('violet')
  })

  it('should add vibrant descriptor for high saturation colors (s > 80)', () => {
    expect(getColorName('#FF0000')).toBe('vibrant red')
    expect(getColorName('#00FF00')).toBe('vibrant green')
    expect(getColorName('#0000FF')).toBe('vibrant blue-violet')
    expect(getColorName('#FF8C00')).toBe('vibrant orange')
    expect(getColorName('#FFFF00')).toBe('vibrant yellow')
    expect(getColorName('#00FFFF')).toBe('vibrant cyan')
    expect(getColorName('#FF00FF')).toBe('vibrant magenta')
    expect(getColorName('#9400D3')).toBe('vibrant violet')
    expect(getColorName('#FF1493')).toBe('vibrant red-magenta')
  })

  it('should add muted descriptor for low saturation colors (s < 30)', () => {
    // Low saturation colors with s < 30 would be muted
    // Example: #C0C0C0 (silver) has s=0, so it's achromatic (gray)
    // Need a color with s between 10 and 30 to test muted
    expect(getColorName('#B8A89A')).toContain('muted')
  })

  it('should add light descriptor for high lightness colors (l > 80)', () => {
    // High lightness with l > 80
    expect(getColorName('#E6F5E6')).toContain('light')
  })

  it('should add dark descriptor for low lightness colors (l < 30)', () => {
    // Low lightness with l < 30
    expect(getColorName('#006400')).toBe('vibrant dark green')
  })

  it('should combine multiple descriptors correctly', () => {
    // Color with high saturation (>80) and low lightness (<30)
    expect(getColorName('#800000')).toBe('vibrant dark red')
  })
})

describe('getColorContrast', () => {
  it('should return "light" for dark colors (luminance <= 0.5)', () => {
    expect(getColorContrast('#000000')).toBe('light')
    expect(getColorContrast('#333333')).toBe('light')
    expect(getColorContrast('#666666')).toBe('light')
    expect(getColorContrast('#FF0000')).toBe('light')
    expect(getColorContrast('#008000')).toBe('light')
    expect(getColorContrast('#0000FF')).toBe('light')
  })

  it('should return "dark" for light colors (luminance > 0.5)', () => {
    expect(getColorContrast('#FFFFFF')).toBe('dark')
    expect(getColorContrast('#CCCCCC')).toBe('dark')
    expect(getColorContrast('#999999')).toBe('dark')
    expect(getColorContrast('#808080')).toBe('dark')
    expect(getColorContrast('#FFFF00')).toBe('dark')
    expect(getColorContrast('#00FF00')).toBe('dark')
    expect(getColorContrast('#87CEEB')).toBe('dark')
  })

  it('should handle 3-digit shorthand hex colors', () => {
    expect(getColorContrast('#000')).toBe('light')
    expect(getColorContrast('#FFF')).toBe('dark')
    expect(getColorContrast('#F00')).toBe('light')
  })
})
