<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface ListboxItemIndicatorProps extends PrimitiveProps {
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
import { injectListboxItemContext } from './ListboxItem.vue'

withDefaults(defineProps<ListboxItemIndicatorProps>(), {
  as: 'span',
})

const { forwardRef } = useForwardExpose()
const itemContext = injectListboxItemContext()
</script>

<template>
  <Presence :present="forceMount || itemContext.isSelected.value">
    <Primitive
      :ref="forwardRef"
      aria-hidden="true"
      :data-state="itemContext.isSelected.value ? 'checked' : 'unchecked'"
      :as="as"
      :as-child="asChild"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
