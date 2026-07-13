import type { Color, ColorFormat, HSBColor, HSLColor, OKLCHColor, RGBColor } from './types'

/**
 * Converts a Color object to a string representation.
 */
export function colorToString(color: Color, format: ColorFormat = 'hex'): string {
  switch (format) {
    case 'hex':
      return colorToHex(color)
    case 'rgb':
      return colorToRgb(color)
    case 'hsl':
      return colorToHsl(color)
    case 'hsb':
      return colorToHsb(color)
    case 'oklch':
      return colorToOklch(color)
    default:
      throw new Error(`Unknown format: ${format}`)
  }
}

/**
 * Converts any color to hex string.
 */
export function colorToHex(color: Color): string {
  const rgb = color.space === 'rgb' ? color : convertToRgb(color)
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0')

  if (rgb.alpha < 1) {
    const alpha = Math.round(rgb.alpha * 255).toString(16).padStart(2, '0')
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}${alpha}`
  }

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

/**
 * Converts any color to rgb() string.
 */
export function colorToRgb(color: Color): string {
  const rgb = color.space === 'rgb' ? color : convertToRgb(color)
  const { r, g, b, alpha } = rgb

  if (alpha < 1) {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`
  }
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

/**
 * Converts any color to hsl() string.
 */
export function colorToHsl(color: Color): string {
  const hsl = color.space === 'hsl' ? color : convertToHsl(color)
  const { h, s, l, alpha } = hsl

  if (alpha < 1) {
    return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${alpha})`
  }
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}

/**
 * Converts any color to hsb() string.
 */
export function colorToHsb(color: Color): string {
  const hsb = color.space === 'hsb' ? color : convertToHsb(color)
  const { h, s, b, alpha } = hsb

  if (alpha < 1) {
    return `hsba(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(b)}%, ${alpha})`
  }
  return `hsb(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(b)}%)`
}

/**
 * Converts any color to CSS oklch() syntax.
 */
export function colorToOklch(color: Color): string {
  const oklch = color.space === 'oklch' ? color : convertToOklch(color)
  const value = `oklch(${format(oklch.l)}% ${format(oklch.c)} ${format(oklch.h)}`
  return oklch.alpha < 1 ? `${value} / ${format(oklch.alpha)})` : `${value})`
}

/**
 * Converts any color to RGB color space.
 */
export function convertToRgb(color: Color): RGBColor {
  if (color.space === 'rgb') {
    return color
  }
  if (color.space === 'hsl') {
    return hslToRgb(color)
  }
  if (color.space === 'hsb') {
    return hsbToRgb(color)
  }
  if (color.space === 'oklch') {
    return oklchToSrgb(color)
  }
  throw new Error(`Unknown color space: ${(color as Color).space}`)
}

/**
 * Converts any color to HSL color space.
 */
export function convertToHsl(color: Color): HSLColor {
  if (color.space === 'hsl') {
    return color
  }
  return rgbToHsl(convertToRgb(color))
}

/**
 * Converts any color to HSB color space.
 */
export function convertToHsb(color: Color): HSBColor {
  if (color.space === 'hsb') {
    return color
  }
  return rgbToHsb(convertToRgb(color))
}

/**
 * Converts any color to OKLCH color space.
 */
export function convertToOklch(color: Color): OKLCHColor {
  if (color.space === 'oklch') {
    return color
  }
  return rgbToOklch(convertToRgb(color))
}

/**
 * Converts RGB to HSL.
 */
function rgbToHsl(rgb: RGBColor): HSLColor {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    space: 'hsl',
    h: h * 360,
    s: s * 100,
    l: l * 100,
    alpha: rgb.alpha,
  }
}

/**
 * Converts HSL to RGB.
 */
function hslToRgb(hsl: HSLColor): RGBColor {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  }
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0)
        t += 1
      if (t > 1)
        t -= 1
      if (t < 1 / 6)
        return p + (q - p) * 6 * t
      if (t < 1 / 2)
        return q
      if (t < 2 / 3)
        return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    space: 'rgb',
    r: r * 255,
    g: g * 255,
    b: b * 255,
    alpha: hsl.alpha,
  }
}

/**
 * Converts RGB to HSB.
 */
function rgbToHsb(rgb: RGBColor): HSBColor {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    space: 'hsb',
    h: h * 360,
    s: s * 100,
    b: v * 100,
    alpha: rgb.alpha,
  }
}

/**
 * Converts HSB to RGB.
 */
function hsbToRgb(hsb: HSBColor): RGBColor {
  const h = hsb.h / 360
  const s = hsb.s / 100
  const v = hsb.b / 100

  let r = 0
  let g = 0
  let b = 0

  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)

  switch (i % 6) {
    case 0:
      r = v
      g = t
      b = p
      break
    case 1:
      r = q
      g = v
      b = p
      break
    case 2:
      r = p
      g = v
      b = t
      break
    case 3:
      r = p
      g = q
      b = v
      break
    case 4:
      r = t
      g = p
      b = v
      break
    case 5:
      r = v
      g = p
      b = q
      break
  }

  return {
    space: 'rgb',
    r: r * 255,
    g: g * 255,
    b: b * 255,
    alpha: hsb.alpha,
  }
}

// OKLab matrices from Björn Ottosson's reference implementation:
// https://bottosson.github.io/posts/oklab/#converting-from-linear-srgb-to-oklab
function rgbToOklch(rgb: RGBColor): OKLCHColor {
  const r = srgbToLinear(rgb.r / 255)
  const g = srgbToLinear(rgb.g / 255)
  const b = srgbToLinear(rgb.b / 255)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const labB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const chroma = Math.hypot(a, labB)
  const hue = chroma < 0.000004 ? 0 : normalizeHue(Math.atan2(labB, a) * 180 / Math.PI)
  return { space: 'oklch', l: lightness * 100, c: chroma, h: hue, alpha: rgb.alpha }
}

/** Reduces chroma until the color fits in sRGB while preserving lightness and hue. */
function oklchToSrgb(oklch: OKLCHColor): RGBColor {
  const direct = oklchToRgbRaw(oklch)
  if (inSrgbGamut(direct))
    return clampRgb(direct)

  let low = 0
  let high = Math.max(0, oklch.c)
  let mapped = oklchToRgbRaw({ ...oklch, c: 0 })
  for (let index = 0; index < 24; index++) {
    const chroma = (low + high) / 2
    const candidate = oklchToRgbRaw({ ...oklch, c: chroma })
    if (inSrgbGamut(candidate)) {
      low = chroma
      mapped = candidate
    }
    else {
      high = chroma
    }
  }
  return clampRgb(mapped)
}

function clampRgb(color: RGBColor): RGBColor {
  return {
    ...color,
    r: clamp(color.r, 0, 255),
    g: clamp(color.g, 0, 255),
    b: clamp(color.b, 0, 255),
  }
}

function oklchToRgbRaw(oklch: OKLCHColor): RGBColor {
  const lightness = clamp(oklch.l, 0, 100) / 100
  const hue = normalizeHue(oklch.h) * Math.PI / 180
  const a = Math.max(0, oklch.c) * Math.cos(hue)
  const b = Math.max(0, oklch.c) * Math.sin(hue)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  return {
    space: 'rgb',
    r: linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s) * 255,
    g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s) * 255,
    b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s) * 255,
    alpha: oklch.alpha,
  }
}

function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function linearToSrgb(value: number): number {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055
}

function inSrgbGamut(color: RGBColor): boolean {
  const epsilon = 0.0001
  return color.r >= -epsilon && color.r <= 255 + epsilon
    && color.g >= -epsilon && color.g <= 255 + epsilon
    && color.b >= -epsilon && color.b <= 255 + epsilon
}

function normalizeHue(value: number): number {
  if (value >= 0 && value < 360)
    return value
  return ((value % 360) + 360) % 360
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function format(value: number): string {
  return String(Number(value.toFixed(4)))
}
