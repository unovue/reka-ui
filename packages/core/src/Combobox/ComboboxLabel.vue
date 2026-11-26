<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ComboboxLabelProps extends PrimitiveProps {
  for?: string
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { claimReferencedId, useForwardElement, useId } from '@/shared'
import { injectComboboxGroupContext } from './ComboboxGroup.vue'

const props = withDefaults(defineProps<ComboboxLabelProps>(), {
  as: 'div',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const groupContext = injectComboboxGroupContext({ id: '', labelId: '' })

groupContext.labelId ||= useId(undefined, 'reka-combobox-group-label')
// A consumer `id` (or one on the asChild child) is the id the group's `aria-labelledby` references.
claimReferencedId(groupContext, 'labelId')
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
