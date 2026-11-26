<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ListboxGroupLabelProps extends PrimitiveProps {
  for?: string
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { claimReferencedId, useForwardElement } from '@/shared'
import { injectListboxGroupContext } from './ListboxGroup.vue'

const props = withDefaults(defineProps<ListboxGroupLabelProps>(), {
  as: 'div',
})

const groupContext = injectListboxGroupContext({ id: '' })
// A consumer `id` (or one on the asChild child) is the id the group's `aria-labelledby` references.
claimReferencedId(groupContext, 'id')

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    v-bind="{ for: props.for }"
    :id="groupContext.id"
    :ref="forwardRef"
  >
    <slot />
  </component>
</template>
