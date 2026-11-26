<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SelectLabelProps extends PrimitiveProps {
  for?: string
}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { claimReferencedId, useForwardElement } from '@/shared'
import { injectSelectGroupContext } from './SelectGroup.vue'

const props = withDefaults(defineProps<SelectLabelProps>(), {
  as: 'div',
})

const groupContext = injectSelectGroupContext({ id: '' })
// A consumer `id` (or one on the asChild child) is the id the group's `aria-labelledby` references.
claimReferencedId(groupContext, 'id')

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(props.as, props.asChild)"
    :id="groupContext.id || undefined"
    :ref="forwardRef"
    :for="props.for"
  >
    <slot />
  </component>
</template>
