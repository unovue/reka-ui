import type { Color } from './types'
import { convertToHsb, convertToHsl, convertToRgb } from './convert'

/** Compare in the requested color space, retaining hue and sub-byte precision. */
export function isEqualColor(current: Color, next: Color): boolean {
  const converted = next.space === 'hsl' ? convertToHsl(current) : next.space === 'hsb' ? convertToHsb(current) : convertToRgb(current)
  return Object.entries(next).every(([key, value]) => {
    const previous = converted[key as keyof typeof converted]
    return typeof value === 'number' && typeof previous === 'number'
      ? Math.abs(value - previous) < 1e-10
      : value === previous
  })
}
