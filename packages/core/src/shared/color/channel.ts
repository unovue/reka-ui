import type { ChannelRange, Color, ColorChannel, ColorSpace } from './types'
import { convertToSpace } from './convert'

/** The object key that holds each channel, per color space. Alpha is shared by every space. */
const CHANNEL_KEYS: Record<ColorSpace, Partial<Record<ColorChannel, string>>> = {
  rgb: { red: 'r', green: 'g', blue: 'b' },
  hsl: { hue: 'h', saturation: 's', lightness: 'l' },
  hsb: { hue: 'h', saturation: 's', brightness: 'b' },
}

/**
 * Gets the range (min, max, step) for a color channel.
 */
export function getChannelRange(channel: ColorChannel): ChannelRange {
  switch (channel) {
    case 'hue':
      return { min: 0, max: 360, step: 1 }
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

/**
 * Gets the display name for a channel.
 */
export function getChannelName(channel: ColorChannel): string {
  const names: Record<ColorChannel, string> = {
    red: 'Red',
    green: 'Green',
    blue: 'Blue',
    hue: 'Hue',
    saturation: 'Saturation',
    lightness: 'Lightness',
    brightness: 'Brightness',
    alpha: 'Alpha',
  }
  return names[channel] ?? channel
}

function hasChannel(space: ColorSpace, channel: ColorChannel) {
  return channel === 'alpha' || CHANNEL_KEYS[space][channel] !== undefined
}

/**
 * Resolves the color space that holds every given channel. `preferred` wins when it
 * holds them all; otherwise RGB channels pick `rgb`, brightness picks `hsb`, and
 * hue, saturation and lightness pick `hsl`.
 */
export function getChannelColorSpace(channels: ColorChannel | readonly ColorChannel[], preferred?: ColorSpace): ColorSpace {
  const list: readonly ColorChannel[] = typeof channels === 'string' ? [channels] : channels
  if (preferred && list.every(channel => hasChannel(preferred, channel)))
    return preferred
  if (list.some(channel => channel === 'red' || channel === 'green' || channel === 'blue'))
    return 'rgb'
  if (list.includes('brightness'))
    return 'hsb'
  return 'hsl'
}

/**
 * Gets the value of a specific channel from a color. The channel is read from the
 * color's own space when it has one (so the hue of an HSL/HSB grey is kept);
 * otherwise the color is converted to the channel's space first.
 */
export function getChannelValue(color: Color, channel: ColorChannel): number {
  if (channel === 'alpha')
    return color.alpha * 100
  if (!CHANNEL_KEYS[color.space]) {
    throw new Error(`Unknown color space: ${(color as Color).space}`)
  }
  const space = getChannelColorSpace(channel, color.space)
  const key = CHANNEL_KEYS[space][channel]
  if (!key)
    throw new Error(`Unknown channel: ${channel}`)
  return (convertToSpace(color, space) as unknown as Record<string, number>)[key]
}

/**
 * Sets a channel value on a color, returning a new color in the original color space.
 * Setting a channel the space does not hold (`red` on an HSL color) round-trips
 * through the channel's space; convert the color first to keep that precision.
 */
export function setChannelValue(color: Color, channel: ColorChannel, value: number): Color {
  const result = setChannelValues(color, [{ channel, value }])
  return convertToSpace(result, color.space)
}

/**
 * Sets several channel values at once and returns the color in the space that holds
 * all of them: the color's own space when it does, else the space picked by
 * `getChannelColorSpace`. Used by the two-dimensional color area.
 */
export function setChannelValues(
  color: Color,
  channels: ReadonlyArray<{ channel: ColorChannel, value: number }>,
): Color {
  if (channels.length === 0)
    return color
  const space = getChannelColorSpace(channels.map(c => c.channel), color.space)
  const next = { ...convertToSpace(color, space) } as unknown as Record<string, number>
  for (const { channel, value } of channels) {
    const { min, max } = getChannelRange(channel)
    const clamped = Math.max(min, Math.min(max, value))
    if (channel === 'alpha')
      next.alpha = clamped / 100
    else
      next[CHANNEL_KEYS[space][channel]!] = clamped
  }
  return next as unknown as Color
}
