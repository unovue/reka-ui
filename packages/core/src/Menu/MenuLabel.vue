<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { injectMenuGroupContext } from './MenuGroup.vue'

export interface MenuLabelProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose, useReferencedId } from '@/shared'

const props = withDefaults(defineProps<MenuLabelProps>(), {
  as: 'div',
})

const groupContext = injectMenuGroupContext({ id: '' })
const { forwardRef, currentElement } = useForwardExpose()
useReferencedId(groupContext, 'id', currentElement)
</script>

<template>
  <Primitive
    v-bind="props"
    :id="groupContext.id || undefined"
    :ref="forwardRef"
  >
    <slot />
  </Primitive>
</template>
