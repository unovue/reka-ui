import type { Color } from './types'
import { convertToSpace } from './convert'
import { normalizeColor } from './parse'

const EPSILON = 1e-9

function matches(a: Color, b: Color) {
  const converted = convertToSpace(a, b.space) as unknown as Record<string, unknown>
  return Object.entries(b).every(([key, value]) => {
    const other = converted[key]
    return typeof value === 'number' && typeof other === 'number'
      ? Math.abs(value - other) < EPSILON
      : value === other
  })
}

/**
 * Structural color equality. Strings are parsed first. Two colors are equal when
 * each one, converted to the other's space, has the same channels, so `#ff0000`
 * equals `hsl(0, 100%, 50%)`, but an HSL grey with hue 200 differs from the same
 * grey in RGB (which has no hue to keep).
 */
export function isEqualColor(a: string | Color, b: string | Color): boolean {
  if (a === b)
    return true
  const left = normalizeColor(a)
  const right = normalizeColor(b)
  return matches(left, right) && matches(right, left)
}
