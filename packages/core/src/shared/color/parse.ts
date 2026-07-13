import type { Color, HSBColor, HSLColor, OKLCHColor, RGBColor } from './types'

const HEX3_RE = /^[0-9A-F]{3}$/i
const HEX6_RE = /^[0-9A-F]{6}$/i
const HEX8_RE = /^[0-9A-F]{8}$/i
const RGB_RE = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/
const HSL_RE = /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/
const HSB_RE = /hsb[av]?\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*(?:,\s*([\d.]+)\s*)?\)/
const NUMBER_PATTERN = '[+-]?(?:\\d*\\.\\d+|\\d+\\.?\\d*)(?:e[+-]?\\d+)?'
const OKLCH_RE = new RegExp(
  `^oklch\\(\\s*(${NUMBER_PATTERN})(%)?\\s+(${NUMBER_PATTERN})(%)?\\s+(${NUMBER_PATTERN})(deg|grad|rad|turn)?\\s*(?:/\\s*(${NUMBER_PATTERN})(%)?\\s*)?\\)$`,
  'i',
)

/**
 * Parses a color string into a Color object.
 * Supports hex (#rrggbb, #rgb), rgb(), hsl(), hsb()/hsv(), and oklch() formats.
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

  // oklch() format
  if (trimmed.startsWith('oklch')) {
    return parseOklch(trimmed)
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
    r: parseFloat(match[1]),
    g: parseFloat(match[2]),
    b: parseFloat(match[3]),
    alpha: match[4] ? parseFloat(match[4]) : 1,
  }
}

function parseHsl(hsl: string): HSLColor {
  const match = hsl.match(HSL_RE)
  if (!match) {
    throw new Error(`Invalid HSL color: ${hsl}`)
  }

  return {
    space: 'hsl',
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
    alpha: match[4] ? parseFloat(match[4]) : 1,
  }
}

function parseHsb(hsb: string): HSBColor {
  const match = hsb.match(HSB_RE)
  if (!match) {
    throw new Error(`Invalid HSB color: ${hsb}`)
  }

  return {
    space: 'hsb',
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    b: parseFloat(match[3]),
    alpha: match[4] ? parseFloat(match[4]) : 1,
  }
}

function parseOklch(value: string): OKLCHColor {
  const match = value.match(OKLCH_RE)
  if (!match)
    throw new Error(`Invalid OKLCH color: ${value}`)

  const lightness = Number(match[1]) * (match[2] ? 1 : 100)
  const chroma = Number(match[3]) * (match[4] ? 0.004 : 1)
  const alpha = match[7] ? Number(match[7]) / (match[8] ? 100 : 1) : 1
  const parsedHue = toDegrees(Number(match[5]), match[6])
  const hue = parsedHue >= 0 && parsedHue < 360
    ? parsedHue
    : ((parsedHue % 360) + 360) % 360
  return {
    space: 'oklch',
    l: Math.max(0, Math.min(100, lightness)),
    c: Math.max(0, chroma),
    h: hue,
    alpha: Math.max(0, Math.min(1, alpha)),
  }
}

function toDegrees(value: number, unit?: string): number {
  switch (unit) {
    case 'grad':
      return value * 0.9
    case 'rad':
      return value * 180 / Math.PI
    case 'turn':
      return value * 360
    default:
      return value
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
