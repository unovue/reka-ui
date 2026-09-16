<script lang="ts">
import type { Ref } from 'vue'
import type { ListboxItemEmits, ListboxItemProps } from '@/Listbox'
import { createContext, useForwardPropsEmits } from '@/shared'

export interface ColorSwatchPickerItemProps extends ListboxItemProps {
/**
 * The color to display in the swatch as a hex string.
 * Example: `#16a372` or `#ff5733`.
 */
  value: string
}

export type ColorSwatchPickerItemEmits = ListboxItemEmits

export interface ColorSwatchPickerItemContext {
  color: Ref<string>
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

const { value } = toRefs(props)

const forwarded = useForwardPropsEmits(props, emits)

const item = getColorSwatchPickerItemSurface(value)

provideColorSwatchPickerItemContext({
  color: value,
})
</script>

<template>
  <ListboxItem
    v-bind="mergeProps(forwarded, item.attrs.value)"
    :value="value"
  >
    <slot />
  </ListboxItem>
</template>
