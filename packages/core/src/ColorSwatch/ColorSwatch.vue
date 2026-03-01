<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ColorSwatchProps extends PrimitiveProps {
  /**
   * The color to display in the swatch as a hex string.
   * Example: `#16a372` or `#ff5733`.
   */
  color?: string
  /**
   * Optional accessible label for the color. If omitted, the color name will be derived from the color value.
   */
  label?: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { getColorContrast, getColorName } from '@/shared/color'

const props = withDefaults(defineProps<ColorSwatchProps>(), { as: 'div', color: '' })

const label = computed(() => {
  if (props.label)
    return props.label

  try {
    return `${getColorName(props.color)}`
  }
  catch {
    if (import.meta.env.DEV) {
      console.warn(`WARNING: Unable to resolve color "${props.color}" to a name.
           Please check that the color provided is a valid hex color or provide a label.`)
    }
    return props.color || undefined
  }
})

const colorContrast = computed(() => {
  try {
    return getColorContrast(props.color)
  }
  catch {
    if (import.meta.env.DEV) {
      console.warn(`WARNING: Unable to resolve contrast color for "${props.color}".
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
    aria-roledescription="color swatch"
    :as-child="asChild"
    :as="as"
    :data-color-contrast="colorContrast"
    :style="{
      '--reka-color-swatch-color': color,
    }"
  >
    <slot :color="color" />
  </Primitive>
</template>
