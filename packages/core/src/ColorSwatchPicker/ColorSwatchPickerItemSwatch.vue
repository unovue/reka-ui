<script lang="ts">
import type { ColorSwatchProps } from '@/ColorSwatch/ColorSwatch.vue'

export interface ColorSwatchPickerItemSwatchProps extends Omit<ColorSwatchProps, 'color'> { }
</script>

<script setup lang="ts">
import { ColorSwatch } from '@/ColorSwatch'
import { useForwardElement } from '@/shared'
import { injectColorSwatchPickerItemContext } from './ColorSwatchPickerItem.vue'

const props = defineProps<ColorSwatchPickerItemSwatchProps>()

// The item's color, bound directly: the swatch surface (`getColorSwatchPickerItemSwatchSurface`)
// is exactly `{ color }` with no state, so building one per swatch only cost allocations.
const colorSwatchPickerItemContext = injectColorSwatchPickerItemContext()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <ColorSwatch
    v-slot="slotProps"
    :ref="forwardRef"
    v-bind="props"
    :color="colorSwatchPickerItemContext.color.value"
  >
    <!-- Forwarded, so `asChild` has a child to render as. -->
    <slot v-bind="slotProps" />
  </ColorSwatch>
</template>
