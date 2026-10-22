import type { OKLCHColor } from './types'
import { describe, expect, it } from 'vitest'
import { colorToString, convertToOklch, convertToRgb, getChannelValue, isValidColor, parseColor, setChannelValues } from '.'

const color: OKLCHColor = { space: 'oklch', l: 62.5, c: 0.18, h: 250, alpha: 0.5 }

describe('oklch CSS parsing', () => {
  it.each([
    'oklch(62.5% 0.18 250 / 50%)',
    'OKLCH(.625 45% 250deg / .5)',
    'oklch(6.25e-1 1.8e-1 -110 / 5e-1)',
  ])('parses equivalent CSS coordinates: %s', (css) => {
    expect(parseColor(css)).toEqual(color)
  })

  it.each([
    ['oklch(50% .2 .5turn)', 180],
    ['oklch(50% .2 200grad)', 180],
    [`oklch(50% .2 ${Math.PI}rad)`, 180],
    ['oklch(50% .2 -30deg)', 330],
    ['oklch(50% .2 720deg)', 0],
  ])('normalizes hue angles: %s', (css, hue) => {
    expect((parseColor(css) as OKLCHColor).h).toBeCloseTo(hue, 10)
  })

  it('maps missing CSS coordinates to zero for standalone colors', () => {
    expect(parseColor('oklch(none none none / none)')).toEqual({ space: 'oklch', l: 0, c: 0, h: 0, alpha: 0 })
  })

  it('clamps lightness/alpha and negative chroma, but does not cap chroma at the UI reference range', () => {
    expect(parseColor('oklch(120% -1 0 / 200%)')).toEqual({ space: 'oklch', l: 100, c: 0, h: 0, alpha: 1 })
    expect((parseColor('oklch(50% 150% 0)') as OKLCHColor).c).toBeCloseTo(0.6)
  })

  it.each([
    'oklch(.5 .2 10) garbage',
    'oklch(.5, .2, 10)',
    'oklch(.5 .2)',
    'oklch(.5 .2 10 /)',
    'oklch(.5 .2 1e999)',
    'oklch(.5 1e999 10)',
    'oklch(1e999 .2 10)',
    'oklch(.5 .2 10 / 1e999)',
    'oklch(50.% .2 10)',
  ])('rejects malformed or non-finite values: %s', (css) => {
    expect(isValidColor(css)).toBe(false)
  })

  it('serializes CSS without RGB quantization', () => {
    expect(colorToString(color, 'oklch')).toBe('oklch(62.5% 0.18 250 / 0.5)')
    expect(parseColor(colorToString(color, 'oklch'))).toEqual(color)
  })
})

describe('dependency-free OKLab conversions', () => {
  it.each([
    ['#ff0000', 62.795536, 0.257683, 29.233885],
    ['#00ff00', 86.643961, 0.294827, 142.495339],
    ['#0000ff', 45.201372, 0.313214, 264.052021],
  ])('matches the OKLab reference for %s', (hex, l, c, h) => {
    const actual = convertToOklch(parseColor(hex))
    expect(actual.l).toBeCloseTo(l, 4)
    expect(actual.c).toBeCloseTo(c, 5)
    expect(actual.h).toBeCloseTo(h, 4)
    expect(colorToString(actual, 'hex')).toBe(hex)
  })

  it('round trips a grid of sRGB colors and preserves alpha', () => {
    for (const r of [0, 32, 128, 255]) {
      for (const g of [0, 64, 192, 255]) {
        for (const b of [0, 16, 128, 255]) {
          const rgb = { space: 'rgb' as const, r, g, b, alpha: 0.123 }
          const roundTrip = convertToRgb(convertToOklch(rgb))
          expect(roundTrip.r).toBeCloseTo(r, 2)
          expect(roundTrip.g).toBeCloseTo(g, 2)
          expect(roundTrip.b).toBeCloseTo(b, 2)
          expect(roundTrip.alpha).toBe(rgb.alpha)
        }
      }
    }
  })

  it.each([0, 30, 120, 240, 300])('maps out-of-gamut colors without changing perceptual lightness or hue: %s', (hue) => {
    const source: OKLCHColor = { ...color, l: 60, c: 0.5, h: hue }
    const rgb = convertToRgb(source)
    for (const value of [rgb.r, rgb.g, rgb.b]) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(255)
    }
    const mapped = convertToOklch(rgb)
    expect(mapped.l).toBeCloseTo(source.l, 3)
    expect(mapped.h).toBeCloseTo(source.h, 2)
    expect(mapped.c).toBeLessThan(source.c)
    expect(rgb.alpha).toBe(source.alpha)
  })

  it.each([0, 100])('maps endpoint lightness to neutral black or white: %s', (l) => {
    const result = convertToRgb({ ...color, l, c: 0.4 })
    for (const value of [result.r, result.g, result.b])
      expect(value).toBeCloseTo(l === 0 ? 0 : 255, 3)
  })

  it('preserves powerless hue and precise native channels during edits', () => {
    const gray: OKLCHColor = { ...color, c: 0, h: 243.5 }
    expect(getChannelValue(gray, 'hue')).toBe(243.5)
    expect(setChannelValues(gray, [{ channel: 'chroma', value: 0.201 }, { channel: 'lightness', value: 62.75 }])).toEqual({ ...gray, c: 0.201, l: 62.75 })
  })
})
