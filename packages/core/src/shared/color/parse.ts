import type { Color, HSBColor, HSLColor, RGBColor } from './types'
import { clamp } from '../clamp'

const HEX3_RE = /^[0-9A-F]{3}$/i
const HEX6_RE = /^[0-9A-F]{6}$/i
const HEX8_RE = /^[0-9A-F]{8}$/i
const RGB_RE = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/
const HSL_RE = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/
const HSB_RE = /^hs[bv]a?\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*(?:,\s*([\d.]+)\s*)?\)$/

/** Hue is an angle: 400 is 40. 360 itself is kept, as the hue channel's range allows it. */
function wrapHue(hue: number): number {
  return hue > 360 ? hue % 360 : hue
}

/**
 * Parses a color string into a Color object.
 * Supports hex (#rrggbb, #rgb), rgb(), hsl(), and hsb()/hsv() formats.
 */
export function parseColor(value: string): Color {
  const trimmed = value.trim().toLowerCase()

  // Hex format
  if (trimmed.startsWith('#')) {
    return parseHex(trimmed)
  }

  // rgb() format
  if (trimmed.startsWith('rgb')) {
    return parseRgb(trimmed)
  }

  // hsl() format
  if (trimmed.startsWith('hsl')) {
    return parseHsl(trimmed)
  }

  // hsb() or hsv() format
  if (trimmed.startsWith('hsb') || trimmed.startsWith('hsv')) {
    return parseHsb(trimmed)
  }

  throw new Error(`Unable to parse color: ${value}`)
}

function parseHex(hex: string): RGBColor {
  let normalized = hex.slice(1)

  // Validate hex format (3, 6, or 8 hex digits)
  if (!HEX3_RE.test(normalized) && !HEX6_RE.test(normalized) && !HEX8_RE.test(normalized)) {
    throw new Error(`Invalid hex color: ${hex}. Expected format: #RGB, #RRGGBB, or #RRGGBBAA`)
  }

  // Expand shorthand (e.g., #f00 -> #ff0000)
  if (normalized.length === 3) {
    normalized = normalized.split('').map(c => c + c).join('')
  }

  // Handle 6-digit hex
  if (normalized.length === 6) {
    const bigint = parseInt(normalized, 16)
    return {
      space: 'rgb',
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
      alpha: 1,
    }
  }

  // Handle 8-digit hex (with alpha)
  if (normalized.length === 8) {
    const bigint = parseInt(normalized, 16)
    return {
      space: 'rgb',
      r: (bigint >> 24) & 255,
      g: (bigint >> 16) & 255,
      b: (bigint >> 8) & 255,
      alpha: (bigint & 255) / 255,
    }
  }

  throw new Error(`Invalid hex color: ${hex}`)
}

function parseRgb(rgb: string): RGBColor {
  const match = rgb.match(RGB_RE)
  if (!match) {
    throw new Error(`Invalid RGB color: ${rgb}`)
  }

  return {
    space: 'rgb',
    r: clamp(parseFloat(match[1]), 0, 255),
    g: clamp(parseFloat(match[2]), 0, 255),
    b: clamp(parseFloat(match[3]), 0, 255),
    alpha: match[4] ? clamp(parseFloat(match[4]), 0, 1) : 1,
  }
}

function parseHsl(hsl: string): HSLColor {
  const match = hsl.match(HSL_RE)
  if (!match) {
    throw new Error(`Invalid HSL color: ${hsl}`)
  }

  return {
    space: 'hsl',
    h: wrapHue(parseFloat(match[1])),
    s: clamp(parseFloat(match[2]), 0, 100),
    l: clamp(parseFloat(match[3]), 0, 100),
    alpha: match[4] ? clamp(parseFloat(match[4]), 0, 1) : 1,
  }
}

function parseHsb(hsb: string): HSBColor {
  const match = hsb.match(HSB_RE)
  if (!match) {
    throw new Error(`Invalid HSB color: ${hsb}`)
  }

  return {
    space: 'hsb',
    h: wrapHue(parseFloat(match[1])),
    s: clamp(parseFloat(match[2]), 0, 100),
    b: clamp(parseFloat(match[3]), 0, 100),
    alpha: match[4] ? clamp(parseFloat(match[4]), 0, 1) : 1,
  }
}

/**
 * Normalizes a value to a Color object.
 * If already a Color, returns it. If a string, parses it.
 */
export function normalizeColor(value: string | Color): Color {
  if (typeof value === 'string') {
    return parseColor(value)
  }
  return value
}

/**
 * Checks if a string is a valid color.
 */
export function isValidColor(value: string): boolean {
  try {
    parseColor(value)
    return true
  }
  catch {
    return false
  }
}
