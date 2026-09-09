<script lang="ts">
import type { ColorSwatchPickerChangeReason } from './useColorSwatchPicker'
import type { ListboxRootEmits, ListboxRootProps } from '@/Listbox'
import type { ChangeEventDetails } from '@/shared'
import type { AcceptableValue } from '@/shared/types'
import { useForwardPropsEmits } from '@/shared'

export interface ColorSwatchPickerRootProps extends Omit<ListboxRootProps, 'by'> {
  defaultValue?: string | string[]
  modelValue?: string | string[]
}

export type ColorSwatchPickerRootEmits = Omit<ListboxRootEmits, 'update:modelValue'> & {
  'beforeUpdate:modelValue': [value: string | string[] | undefined, details: ChangeEventDetails<ColorSwatchPickerChangeReason>]
  'update:modelValue': [value: AcceptableValue, details: ChangeEventDetails<ColorSwatchPickerChangeReason>]
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

const { modelValue, root } = useColorSwatchPicker({
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
    v-bind="mergeProps(forwarded, root.attrs.value)"
    as-child
  >
    <ListboxContent
      :as-child="asChild"
      :as="as"
    >
      <slot :model-value="modelValue" />
    </ListboxContent>
  </ListboxRoot>
</template>
