import type { ChannelRange, Color, ColorChannel, ColorSpace } from './types'
import { convertToHsb, convertToHsl, convertToOklch, convertToRgb } from './convert'

/**
 * Returns UI bounds and step: degrees for hue, 0–255 for RGB, percentages otherwise.
 * Chroma instead uses unitless [0, 0.4] with step 0.001, not a gamut boundary.
 * Throws for unknown channels.
 */
export function getChannelRange(channel: ColorChannel): ChannelRange {
  switch (channel) {
    case 'hue':
      return { min: 0, max: 360, step: 1 }
    case 'chroma':
      return { min: 0, max: 0.4, step: 0.001 }
    case 'saturation':
    case 'lightness':
    case 'brightness':
    case 'alpha':
      return { min: 0, max: 100, step: 1 }
    case 'red':
    case 'green':
    case 'blue':
      return { min: 0, max: 255, step: 1 }
    default:
      throw new Error(`Unknown channel: ${channel}`)
  }
}

/** Returns the English channel label, falling back to the supplied name for unknown channels. */
export function getChannelName(channel: ColorChannel): string {
  const names: Record<ColorChannel, string> = {
    red: 'Red',
    green: 'Green',
    blue: 'Blue',
    hue: 'Hue',
    saturation: 'Saturation',
    lightness: 'Lightness',
    brightness: 'Brightness',
    chroma: 'Chroma',
    alpha: 'Alpha',
  }
  return names[channel] ?? channel
}

/**
 * Reads a channel in UI units: degree hue, 0–255 RGB, unitless chroma, percentages otherwise.
 * Uses native hue and OKLCH lightness; saturation is HSB only for HSB input, otherwise HSL.
 * Converts other channels as needed (gamut-mapping OKLCH to sRGB); throws for unknown channels.
 */
export function getChannelValue(color: Color, channel: ColorChannel): number {
  switch (channel) {
    case 'red':
      return convertToRgb(color).r
    case 'green':
      return convertToRgb(color).g
    case 'blue':
      return convertToRgb(color).b
    case 'hue':
      return color.space === 'rgb' ? convertToHsl(color).h : color.h
    case 'saturation':
      return color.space === 'hsb' ? color.s : convertToHsl(color).s
    case 'lightness':
      return color.space === 'oklch' ? color.l : convertToHsl(color).l
    case 'brightness':
      return convertToHsb(color).b
    case 'chroma':
      return convertToOklch(color).c
    case 'alpha':
      return color.alpha * 100
    default:
      throw new Error(`Unknown channel: ${channel}`)
  }
}

/** Converts to the requested space, preserving alpha; throws for unknown spaces. */
function convertToSpace(color: Color, space: ColorSpace): Color {
  switch (space) {
    case 'rgb':
      return convertToRgb(color)
    case 'hsl':
      return convertToHsl(color)
    case 'hsb':
      return convertToHsb(color)
    case 'oklch':
      return convertToOklch(color)
    default:
      throw new Error(`Unknown color space: ${space}`)
  }
}

/**
 * Returns a new color in the input space after clamping the channel to its UI range.
 * Alpha uses percentage input; cross-space edits may gamut-map through sRGB.
 * Throws for unknown channels.
 */
export function setChannelValue(color: Color, channel: ColorChannel, value: number): Color {
  const range = getChannelRange(channel)
  const clamped = Math.max(range.min, Math.min(range.max, value))
  if (channel === 'alpha')
    return { ...color, alpha: clamped / 100 }

  let updated: Color
  switch (channel) {
    case 'red':
    case 'green':
    case 'blue':
      updated = { ...convertToRgb(color), [channel === 'red' ? 'r' : channel === 'green' ? 'g' : 'b']: clamped }
      break
    case 'hue':
      updated = { ...(color.space === 'rgb' ? convertToHsl(color) : color), h: clamped }
      break
    case 'lightness':
      updated = { ...(color.space === 'oklch' ? color : convertToHsl(color)), l: clamped }
      break
    case 'saturation':
      updated = { ...(color.space === 'hsb' ? color : convertToHsl(color)), s: clamped }
      break
    case 'brightness':
      updated = { ...convertToHsb(color), b: clamped }
      break
    case 'chroma':
      updated = { ...convertToOklch(color), c: clamped }
      break
    default:
      throw new Error(`Unknown channel: ${channel}`)
  }
  return convertToSpace(updated, color.space)
}

/**
 * Applies clamped channel edits in order, returning the chosen working color space.
 * Multiple edits prefer RGB, then OKLCH (chroma or native hue/lightness/alpha), then HSB
 * (brightness), otherwise HSL. Empty edits return the input; a single edit retains its space.
 */
export function setChannelValues(color: Color, channels: Array<{ channel: ColorChannel, value: number }>): Color {
  if (channels.length === 0)
    return color
  if (channels.length === 1)
    return setChannelValue(color, channels[0].channel, channels[0].value)

  const names = channels.map(({ channel }) => channel)
  let space: ColorSpace
  if (names.some(channel => channel === 'red' || channel === 'green' || channel === 'blue'))
    space = 'rgb'
  else if (names.includes('chroma') || (color.space === 'oklch' && names.every(channel => channel === 'hue' || channel === 'lightness' || channel === 'alpha')))
    space = 'oklch'
  else if (names.includes('brightness'))
    space = 'hsb'
  else
    space = 'hsl'

  let result = convertToSpace(color, space)
  for (const { channel, value } of channels)
    result = setChannelValue(result, channel, value)
  return result
}
