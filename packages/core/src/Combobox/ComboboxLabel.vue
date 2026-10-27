<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ComboboxLabelProps extends PrimitiveProps {
  for?: string
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardElement, useId } from '@/shared'
import { injectComboboxGroupContext } from './ComboboxGroup.vue'

const props = withDefaults(defineProps<ComboboxLabelProps>(), {
  as: 'div',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const groupContext = injectComboboxGroupContext({ id: '', labelId: '' })

groupContext.labelId ||= useId(undefined, 'reka-combobox-group-label')
</script>

<template>
  <Primitive
    v-bind="props"
    :id="groupContext.labelId"
    :ref="forwardRef"
  >
    <slot />
  </Primitive>
</template>
