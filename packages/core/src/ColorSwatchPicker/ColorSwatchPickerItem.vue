<script lang="ts">
import type { Ref } from 'vue'
import type { ColorSwatchPickerValue } from './useColorSwatchPicker'
import type { ListboxItemEmits, ListboxItemProps } from '@/Listbox'
import { createContext, useForwardPropsEmits } from '@/shared'

export interface ColorSwatchPickerItemProps extends ListboxItemProps<ColorSwatchPickerValue> {
  /**
   * The color of the swatch, as a color string or a `Color` object.
   * Example: `#16a372` or `{ space: 'hsl', h: 158, s: 76, l: 36, alpha: 1 }`.
   * Values are compared structurally, so `#ff0000` and the equivalent `Color` select the same item.
   */
  value: ColorSwatchPickerValue
}

export type ColorSwatchPickerItemEmits = ListboxItemEmits

export interface ColorSwatchPickerItemContext {
  color: Ref<ColorSwatchPickerValue>
}

export const [injectColorSwatchPickerItemContext, provideColorSwatchPickerItemContext]
  = createContext<ColorSwatchPickerItemContext>('ColorSwatchPickerItem', 'ColorSwatchPickerItemContext')
</script>

<script setup lang="ts">
import { mergeProps, toRefs } from 'vue'
import { ListboxItem } from '@/Listbox'
import { getColorSwatchPickerItemSurface } from './useColorSwatchPicker'

const props = defineProps<ColorSwatchPickerItemProps>()

const emits = defineEmits<ColorSwatchPickerItemEmits>()

defineSlots<{
  default?: (props: {
    /** Whether the item is currently selected */
    selected: boolean
  }) => any
}>()

const { value } = toRefs(props)

const forwarded = useForwardPropsEmits(props, emits)

const item = getColorSwatchPickerItemSurface(value)

provideColorSwatchPickerItemContext({
  color: value,
})
</script>

<template>
  <ListboxItem
    v-slot="slotProps"
    v-bind="mergeProps(forwarded, item.attrs.value)"
    :value="value"
  >
    <slot v-bind="slotProps" />
  </ListboxItem>
</template>
