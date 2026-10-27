<script lang="ts">
import type { ColorSwatchPickerChangeReason, ColorSwatchPickerValue } from './useColorSwatchPicker'
import type { ListboxRootEmits, ListboxRootProps } from '@/Listbox'
import type { ChangeEventDetails } from '@/shared'
import { useForwardPropsEmits } from '@/shared'

export interface ColorSwatchPickerRootProps extends Omit<ListboxRootProps<ColorSwatchPickerValue>, 'by' | 'modelValue' | 'defaultValue'> {
  /** The selected color, or colors with `multiple`, as color strings or `Color` objects (uncontrolled). Compared structurally with the item values. */
  defaultValue?: ColorSwatchPickerValue | ColorSwatchPickerValue[]
  /** The selected color, or colors with `multiple`, as color strings or `Color` objects (controlled). Compared structurally with the item values. */
  modelValue?: ColorSwatchPickerValue | ColorSwatchPickerValue[]
}

export type ColorSwatchPickerRootEmits = Omit<ListboxRootEmits, 'update:modelValue' | 'beforeUpdate:modelValue'> & {
  /** Event handler called before the color value changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [value: ColorSwatchPickerValue | ColorSwatchPickerValue[] | undefined, details: ChangeEventDetails<ColorSwatchPickerChangeReason>]
  /** Event handler called when the color value changes, with the value of the selected item (or items) as declared. */
  'update:modelValue': [value: ColorSwatchPickerValue | ColorSwatchPickerValue[] | undefined, details: ChangeEventDetails<ColorSwatchPickerChangeReason>]
}
</script>

<script setup lang="ts">
import { computed, mergeProps } from 'vue'
import { ListboxContent, ListboxRoot } from '@/Listbox'
import { useColorSwatchPicker } from './useColorSwatchPicker'

const props = withDefaults(defineProps<ColorSwatchPickerRootProps>(), {
  as: 'div',
  defaultValue: undefined,
  dir: 'ltr',
  disabled: false,
  loop: false,
  orientation: 'horizontal',
})

const emits = defineEmits<ColorSwatchPickerRootEmits>()

const { listboxProps } = useColorSwatchPicker({
  modelValue: () => props.modelValue,
  defaultValue: () => props.defaultValue,
  multiple: () => props.multiple,
  disabled: () => props.disabled,
  selectionBehavior: () => props.selectionBehavior,
  emit: emits,
})

// The model has one update channel so cancellation cannot be bypassed by forwarding.
const forwardedProps = useForwardPropsEmits(props, emits)
const forwarded = computed(() => {
  const { modelValue, defaultValue, 'onUpdate:modelValue': update, 'onBeforeUpdate:modelValue': beforeUpdate, ...rest } = forwardedProps.value
  return rest
})
</script>

<template>
  <ListboxRoot
    v-bind="mergeProps(forwarded, listboxProps)"
    as-child
  >
    <ListboxContent
      :as-child="asChild"
      :as="as"
    >
      <slot :model-value="listboxProps.modelValue" />
    </ListboxContent>
  </ListboxRoot>
</template>
