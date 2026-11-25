<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface ListboxGroupLabelProps extends PrimitiveProps {
  for?: string
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose, useReferencedId } from '@/shared'
import { injectListboxGroupContext } from './ListboxGroup.vue'

const props = withDefaults(defineProps<ListboxGroupLabelProps>(), {
  as: 'div',
})

const groupContext = injectListboxGroupContext({ id: '' })
const { forwardRef, currentElement } = useForwardExpose()
useReferencedId(groupContext, 'id', currentElement)
</script>

<template>
  <Primitive
    v-bind="props"
    :id="groupContext.id"
    :ref="forwardRef"
  >
    <slot />
  </Primitive>
</template>
