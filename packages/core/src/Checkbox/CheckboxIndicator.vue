<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface CheckboxIndicatorProps extends PrimitiveProps {
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
import { injectCheckboxRootContext } from './CheckboxRoot.vue'
import { getCheckboxIndicatorSurface } from './useCheckbox'
import { isIndeterminate } from './utils'

withDefaults(defineProps<CheckboxIndicatorProps>(), {
  as: 'span',
})
const { forwardRef } = useForwardExpose()

const rootContext = injectCheckboxRootContext()
// Same derivation as `useCheckbox().indicator` — one source for `data-state` / `data-disabled`.
const indicator = getCheckboxIndicatorSurface(rootContext)
</script>

<template>
  <Presence
    :present="forceMount || isIndeterminate(rootContext.state.value) || rootContext.state.value === true"
  >
    <Primitive
      :ref="forwardRef"
      v-bind="indicator.attrs.value"
      :style="{ pointerEvents: 'none' }"
      :as-child="asChild"
      :as="as"
      v-bind="$attrs"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
