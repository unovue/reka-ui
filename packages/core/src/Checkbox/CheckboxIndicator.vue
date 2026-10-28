<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface CheckboxIndicatorProps extends PrimitiveProps {
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
import { injectCheckboxRootContext } from './CheckboxRoot.vue'
import { getCheckboxIndicatorSurface } from './useCheckbox'
import { isIndeterminate } from './utils'

withDefaults(defineProps<CheckboxIndicatorProps>(), {
  as: 'span',
})
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const rootContext = injectCheckboxRootContext()
// Same derivation as `useCheckbox().indicator` — one source for `data-state` / `data-disabled`.
const indicator = getCheckboxIndicatorSurface(rootContext)

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
    v-if="forceMount || isIndeterminate(rootContext.state.value) || rootContext.state.value === true || lingering"
    :present="forceMount || isIndeterminate(rootContext.state.value) || rootContext.state.value === true"
    :appear="instance.isMounted"
    @vue:mounted="lingering = true"
    @complete="onPresenceComplete"
  >
    <Primitive
      :ref="forwardRef"
      :style="{ pointerEvents: 'none' }"
      :as-child="asChild"
      :as="as"
      v-bind="mergeProps(indicator.attrs.value, $attrs)"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
