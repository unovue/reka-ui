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
import { Primitive } from '@/Primitive'
import { useColorSwatch } from './useColorSwatch'

const props = withDefaults(defineProps<ColorSwatchProps>(), { as: 'div', color: '' })

const { root, colorString, alpha } = useColorSwatch({
  color: () => props.color,
  label: () => props.label,
})
</script>

<template>
  <Primitive
    :as-child="asChild"
    :as="as"
    v-bind="root.attrs.value"
  >
    <slot
      :color="colorString"
      :alpha="alpha"
    />
  </Primitive>
</template>
