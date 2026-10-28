<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface RadioGroupIndicatorProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { getCurrentInstance, mergeProps, shallowRef } from 'vue'
import { Presence } from '@/Presence'
import { Primitive } from '@/Primitive'
import { injectRadioGroupItemContext } from './RadioGroupItem.vue'
import { getRadioGroupIndicatorSurface } from './useRadioGroup'

withDefaults(defineProps<RadioGroupIndicatorProps>(), {
  as: 'span',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const itemContext = injectRadioGroupItemContext()
// Same derivation as a standalone consumer — one source for `data-state` / `data-disabled`.
const indicator = getRadioGroupIndicatorSurface(itemContext)

// An indicator that is not shown mounts no `Presence` (Base UI's
// `SelectItemIndicator` returns `null`). Once shown, it stays mounted until its
// exit has finished, and one shown after this indicator mounted enters with
// `data-starting-style`, as it did while `Presence` was always mounted.
const instance = getCurrentInstance()!
const lingering = shallowRef(false)
function onPresenceComplete(present: boolean) {
  if (!present)
    lingering.value = false
}
</script>

<template>
  <Presence
    v-if="forceMount || itemContext.checked.value || lingering"
    :present="forceMount || itemContext.checked.value"
    :appear="instance.isMounted"
    @vue:mounted="lingering = true"
    @complete="onPresenceComplete"
  >
    <Primitive
      :ref="forwardRef"
      :as-child="asChild"
      :as="as"
      v-bind="mergeProps(indicator.attrs.value, $attrs)"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
