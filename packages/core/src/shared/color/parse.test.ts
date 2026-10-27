import { describe, expect, it } from 'vitest'
import { isValidColor, normalizeColor, parseColor } from './parse'

describe('parseColor', () => {
  it.each([
    ['#ff8000', { space: 'rgb', r: 255, g: 128, b: 0, alpha: 1 }],
    ['#F80', { space: 'rgb', r: 255, g: 136, b: 0, alpha: 1 }],
    ['  #00ff0080 ', { space: 'rgb', r: 0, g: 255, b: 0, alpha: 128 / 255 }],
    ['rgb(1, 2, 3)', { space: 'rgb', r: 1, g: 2, b: 3, alpha: 1 }],
    ['rgba(1.5, 2, 3, 0.25)', { space: 'rgb', r: 1.5, g: 2, b: 3, alpha: 0.25 }],
    ['hsl(200, 0%, 50%)', { space: 'hsl', h: 200, s: 0, l: 50, alpha: 1 }],
    ['HSLA(10.5, 20%, 30%, 0.5)', { space: 'hsl', h: 10.5, s: 20, l: 30, alpha: 0.5 }],
    ['hsb(120, 50%, 75%)', { space: 'hsb', h: 120, s: 50, b: 75, alpha: 1 }],
    ['hsv(120, 50, 75)', { space: 'hsb', h: 120, s: 50, b: 75, alpha: 1 }],
  ])('parses %s into its own space', (input, expected) => {
    expect(parseColor(input)).toEqual(expected)
  })

  it.each(['', 'red', '#12', '#12345', '#ggg', 'rgb(1, 2)', 'hsl(1, 2, 3)', 'hsb()'])('rejects %j', (input) => {
    expect(() => parseColor(input)).toThrow()
    expect(isValidColor(input)).toBe(false)
  })

  it('keeps the hue of a grey given in a hue space', () => {
    expect(parseColor('hsl(200, 0%, 50%)')).toMatchObject({ h: 200, s: 0 })
  })
})

describe('normalizeColor', () => {
  it('parses strings and returns Color objects as-is', () => {
    const color = { space: 'hsl', h: 200, s: 0, l: 50, alpha: 1 } as const
    expect(normalizeColor(color)).toBe(color)
    expect(normalizeColor('#000')).toEqual({ space: 'rgb', r: 0, g: 0, b: 0, alpha: 1 })
  })
})
