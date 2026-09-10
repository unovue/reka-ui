import type { MaybeRefOrGetter } from 'vue'
import type { Color } from '@/shared/color'
import { computed, toValue } from 'vue'
import { createPartSurface } from '@/shared'
import { colorToString, getColorContrast, getColorName, normalizeColor } from '@/shared/color'

export interface UseColorSwatchProps {
  color?: MaybeRefOrGetter<string | Color | undefined>
  label?: MaybeRefOrGetter<string | undefined>
}
export type ColorSwatchState = { colorContrast: string | undefined, noColor: boolean }
export type UseColorSwatchReturn = ReturnType<typeof useColorSwatch>

/**
 * Headless color swatch styling and accessible description.
 * @experimental
 * @lifecycle pure
 */
export function useColorSwatch(props: UseColorSwatchProps = {}) {
  const color = computed(() => toValue(props.color))
  const customLabel = computed(() => toValue(props.label))
  const colorString = computed(() => {
    if (!color.value)
      return ''
    if (typeof color.value === 'string') {
      return color.value
    }
    return colorToString(color.value, 'hex')
  })

  const colorObj = computed(() => {
    if (!color.value)
      return null
    try {
      return normalizeColor(color.value)
    }
    catch {
      return null
    }
  })

  const alpha = computed(() => colorObj.value?.alpha ?? 0)
  const isNoColor = computed(() => !color.value || alpha.value <= 0)

  const label = computed(() => {
    if (customLabel.value)
      return customLabel.value

    // Match React Aria: transparent colors get "transparent" label
    if (!colorObj.value || colorObj.value.alpha === 0)
      return 'transparent'

    try {
      return getColorName(colorString.value)
    }
    catch {
      return colorString.value || 'transparent'
    }
  })

  const colorContrast = computed(() => {
    if (!colorString.value)
      return undefined
    try {
      return getColorContrast(colorString.value)
    }
    catch {
      if (import.meta.env.DEV) {
        console.warn(`WARNING: Unable to resolve contrast color for "${colorString.value}".
             Please check that the color provided is a valid hex color.`)
      }
      return undefined
    }
  })
  const root = createPartSurface<ColorSwatchState>(() => ({
    'role': 'img',
    'aria-label': label.value,
    'aria-roledescription': 'color swatch',
    'style': {
      '--reka-color-swatch-color': colorString.value,
      '--reka-color-swatch-alpha': String(alpha.value),
    },
  }), () => ({ colorContrast: colorContrast.value, noColor: isNoColor.value }))
  return { colorString, color: colorObj, alpha, isNoColor, label, colorContrast, root }
}
