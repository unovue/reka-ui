<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ComboboxLabelProps extends PrimitiveProps {
  for?: string
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
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
  <component
    :is="renderAs(as, asChild)"
    v-bind="{ for: props.for }"
    :id="groupContext.labelId"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
