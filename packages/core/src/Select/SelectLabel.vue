<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'

export interface SelectLabelProps extends PrimitiveProps {
  for?: string
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose, useReferencedId } from '@/shared'
import { injectSelectGroupContext } from './SelectGroup.vue'

const props = withDefaults(defineProps<SelectLabelProps>(), {
  as: 'div',
})

const groupContext = injectSelectGroupContext({ id: '' })
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
