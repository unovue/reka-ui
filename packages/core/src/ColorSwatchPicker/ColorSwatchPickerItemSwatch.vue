<script lang="ts">
import type { ColorSwatchProps } from '@/ColorSwatch/ColorSwatch.vue'

export interface ColorSwatchPickerItemSwatchProps extends Omit<ColorSwatchProps, 'color'> { }
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { ColorSwatch } from '@/ColorSwatch'
import { useForwardElement } from '@/shared'
import { injectColorSwatchPickerItemContext } from './ColorSwatchPickerItem.vue'
import { getColorSwatchPickerItemSwatchSurface } from './useColorSwatchPicker'

const props = defineProps<ColorSwatchPickerItemSwatchProps>()

const colorSwatchPickerItemContext = injectColorSwatchPickerItemContext()
const part = getColorSwatchPickerItemSwatchSurface(colorSwatchPickerItemContext)

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <ColorSwatch
    v-slot="slotProps"
    :ref="forwardRef"
    v-bind="mergeProps(props, part.attrs.value)"
  >
    <!-- Forwarded, so `asChild` has a child to render as. -->
    <slot v-bind="slotProps" />
  </ColorSwatch>
</template>
