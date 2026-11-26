<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { Color } from '@/shared/color'

export interface ColorSwatchProps extends PrimitiveProps {
  /**
   * The color to display in the swatch as a hex string or Color object.
   * Example: `#16a372`, `#ff5733`, or `{ space: 'hsl', h: 120, s: 100, l: 50, alpha: 1 }`.
   */
  color?: string | Color
  /**
   * Optional accessible label for the color. If omitted, the color name will be derived from the color value.
   */
  label?: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { useTranslations } from '@/shared'
import { colorToString, getColorContrast, getColorName, normalizeColor } from '@/shared/color'

const props = withDefaults(defineProps<ColorSwatchProps>(), { as: 'div', color: '' })

const t = useTranslations()

const colorString = computed(() => {
  if (!props.color)
    return ''
  if (typeof props.color === 'string') {
    return props.color
  }
  return colorToString(props.color, 'hex')
})

const colorObj = computed(() => {
  if (!props.color)
    return null
  try {
    return normalizeColor(props.color)
  }
  catch {
    return null
  }
})

const alpha = computed(() => colorObj.value?.alpha ?? 0)
const isNoColor = computed(() => !props.color || alpha.value <= 0)

const label = computed(() => {
  if (props.label)
    return props.label

  // Match React Aria: transparent colors get "transparent" label
  if (!colorObj.value || colorObj.value.alpha === 0)
    return t('colorSwatchTransparent')

  try {
    return getColorName(colorString.value)
  }
  catch {
    return colorString.value || t('colorSwatchTransparent')
  }
})

const colorContrast = computed(() => {
  try {
    return getColorContrast(colorString.value)
  }
  catch {
    // Only for a color that can't be read at all: no color, `transparent` and non-hex formats are valid input.
    if (process.env.NODE_ENV !== 'production' && colorString.value && colorString.value !== 'transparent' && !colorObj.value) {
      console.warn(`WARNING: Unable to resolve contrast color for "${colorString.value}".
           Please check that the color provided is a valid hex color.`)
    }
    return undefined
  }
})
</script>

<template>
  <Primitive
    role="img"
    :aria-label="label"
    :aria-roledescription="t('colorSwatchRoleDescription')"
    :as-child="asChild"
    :as="as"
    :data-color-contrast="colorContrast"
    :data-no-color="isNoColor ? '' : undefined"
    :style="{
      '--reka-color-swatch-color': colorString,
      '--reka-color-swatch-alpha': String(alpha),
    }"
  >
    <slot
      :color="colorString"
      :alpha="alpha"
    />
  </Primitive>
</template>
