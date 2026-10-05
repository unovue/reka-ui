<script lang="ts">
import type { ColorSwatchProps } from '@/ColorSwatch/ColorSwatch.vue'

export interface ColorSwatchPickerItemSwatchProps extends Omit<ColorSwatchProps, 'color'> { }
</script>

<script setup lang="ts">
import { mergeProps } from 'vue'
import { ColorSwatch } from '@/ColorSwatch'
import { injectColorSwatchPickerItemContext } from './ColorSwatchPickerItem.vue'
import { getColorSwatchPickerItemSwatchSurface } from './useColorSwatchPicker'

const props = defineProps<ColorSwatchPickerItemSwatchProps>()

const colorSwatchPickerItemContext = injectColorSwatchPickerItemContext()
const part = getColorSwatchPickerItemSwatchSurface(colorSwatchPickerItemContext)
</script>

<template>
  <ColorSwatch
    v-bind="mergeProps(props, part.attrs.value)"
  />
</template>
