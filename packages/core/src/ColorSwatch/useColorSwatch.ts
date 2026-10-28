import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { PartSurface } from '@/shared'
import type { Color } from '@/shared/color'
import { computed, toValue } from 'vue'
import { createPartSurface, fieldRef } from '@/shared'
import { colorToString, getColorContrast, getColorName, normalizeColor } from '@/shared/color'

export interface UseColorSwatchProps {
  color?: MaybeRefOrGetter<string | Color | undefined>
  label?: MaybeRefOrGetter<string | undefined>
}
export type ColorSwatchState = { colorContrast: string | undefined, noColor: boolean }
export interface UseColorSwatchReturn {
  readonly colorString: ComputedRef<string>
  readonly color: ComputedRef<Readonly<Color> | null>
  readonly alpha: ComputedRef<number>
  readonly isNoColor: ComputedRef<boolean>
  readonly label: ComputedRef<string>
  readonly colorContrast: ComputedRef<string | undefined>
  readonly root: PartSurface<ColorSwatchState>
}

interface ColorSwatchInfo {
  colorString: string
  color: Readonly<Color> | null
  alpha: number
  isNoColor: boolean
  label: string
  colorContrast: string | undefined
}

function deriveColorSwatch(color: string | Color | undefined, customLabel: string | undefined): ColorSwatchInfo {
  const colorString = !color ? '' : typeof color === 'string' ? color : colorToString(color, 'hex')

  let colorObj: Readonly<Color> | null = null
  if (color) {
    try {
      colorObj = normalizeColor(color)
    }
    catch {}
  }

  const alpha = colorObj?.alpha ?? 0

  let label: string
  if (customLabel) {
    label = customLabel
  }
  // Match React Aria: transparent colors get "transparent" label
  else if (!colorObj || colorObj.alpha === 0) {
    label = 'transparent'
  }
  else {
    try {
      label = getColorName(colorString)
    }
    catch {
      label = colorString || 'transparent'
    }
  }

  let colorContrast: string | undefined
  if (colorString) {
    try {
      colorContrast = getColorContrast(colorString)
    }
    catch {
      if (import.meta.env.DEV) {
        console.warn(`WARNING: Unable to resolve contrast color for "${colorString}".
             Please check that the color provided is a valid hex color.`)
      }
    }
  }

  return { colorString, color: colorObj, alpha, isNoColor: !color || alpha <= 0, label, colorContrast }
}

/**
 * Headless color swatch styling and accessible description.
 *
 * Everything is derived in ONE computed (the swatch re-derives all of it on a
 * color change anyway); each returned ref reads its field of that object.
 * @experimental
 * @lifecycle pure
 */
export function useColorSwatch(props: UseColorSwatchProps = {}): UseColorSwatchReturn {
  const info = computed(() => deriveColorSwatch(toValue(props.color), toValue(props.label)))
  const root = createPartSurface<ColorSwatchState>(() => {
    const { label, colorString, alpha } = info.value
    return {
      'role': 'img',
      'aria-label': label,
      'aria-roledescription': 'color swatch',
      'style': {
        '--reka-color-swatch-color': colorString,
        '--reka-color-swatch-alpha': String(alpha),
      },
    }
  }, () => ({ colorContrast: info.value.colorContrast, noColor: info.value.isNoColor }))
  return {
    colorString: fieldRef(info, 'colorString'),
    color: fieldRef(info, 'color'),
    alpha: fieldRef(info, 'alpha'),
    isNoColor: fieldRef(info, 'isNoColor'),
    label: fieldRef(info, 'label'),
    colorContrast: fieldRef(info, 'colorContrast'),
    root,
  }
}
