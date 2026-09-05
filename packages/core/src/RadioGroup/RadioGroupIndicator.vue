<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface RadioGroupIndicatorProps extends PrimitiveProps {
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
import { injectRadioGroupItemContext } from './RadioGroupItem.vue'
import { getRadioGroupIndicatorSurface } from './useRadioGroup'

withDefaults(defineProps<RadioGroupIndicatorProps>(), {
  as: 'span',
})

const { forwardRef } = useForwardExpose()
const itemContext = injectRadioGroupItemContext()
// Same derivation as a standalone consumer — one source for `data-state` / `data-disabled`.
const indicator = getRadioGroupIndicatorSurface(itemContext)
</script>

<template>
  <Presence
    :present="forceMount || itemContext.checked.value"
  >
    <Primitive
      :ref="forwardRef"
      v-bind="indicator.attrs.value"
      :as-child="asChild"
      :as="as"
      v-bind="$attrs"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
