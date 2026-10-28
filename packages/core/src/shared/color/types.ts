export type ColorSpace = 'rgb' | 'hsl' | 'hsb' | 'oklch'

export interface RGBColor {
  space: 'rgb'
  r: number
  g: number
  b: number
  alpha: number
}

export interface HSLColor {
  space: 'hsl'
  h: number
  s: number
  l: number
  alpha: number
}

export interface HSBColor {
  space: 'hsb'
  h: number
  s: number
  b: number
  alpha: number
}

/**
 * OKLCH color. Lightness uses the same 0–100 presentation range as HSL,
 * while chroma follows CSS Color 4's 0–0.4 reference range.
 */
export interface OKLCHColor {
  space: 'oklch'
  l: number
  c: number
  h: number
  alpha: number
}

export type Color = RGBColor | HSLColor | HSBColor | OKLCHColor

export type RGBChannel = 'red' | 'green' | 'blue' | 'alpha'
export type HSLChannel = 'hue' | 'saturation' | 'lightness' | 'alpha'
export type HSBChannel = 'hue' | 'saturation' | 'brightness' | 'alpha'
export type OKLCHChannel = 'lightness' | 'chroma' | 'hue' | 'alpha'
export type ColorChannel = RGBChannel | HSLChannel | HSBChannel | OKLCHChannel

export interface ChannelRange {
  min: number
  max: number
  step: number
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsb' | 'oklch'
