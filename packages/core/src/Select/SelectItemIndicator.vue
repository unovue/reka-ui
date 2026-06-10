<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface SelectItemIndicatorProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { Presence } from '@/Presence'
import { Primitive } from '@/Primitive'
import { injectSelectItemContext } from './SelectItem.vue'

const props = withDefaults(defineProps<SelectItemIndicatorProps>(), {
  as: 'span',
})

const { forwardRef } = useForwardExpose()
const itemContext = injectSelectItemContext()
</script>

<template>
  <Presence :present="forceMount || itemContext.isSelected.value">
    <Primitive
      :ref="forwardRef"
      aria-hidden="true"
      v-bind="props"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
