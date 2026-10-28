<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardElement } from '@/shared'

export interface SelectItemIndicatorProps extends PrimitiveProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { getCurrentInstance, shallowRef } from 'vue'
import { Presence } from '@/Presence'
import { Primitive } from '@/Primitive'
import { injectSelectItemContext } from './SelectItem.vue'
import { useSelectItemIndicator } from './useSelect'

withDefaults(defineProps<SelectItemIndicatorProps>(), {
  as: 'span',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const itemContext = injectSelectItemContext()
const { indicator, present } = useSelectItemIndicator(itemContext)

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
    v-if="forceMount || present || lingering"
    :present="forceMount || present"
    :appear="instance.isMounted"
    @vue:mounted="lingering = true"
    @complete="onPresenceComplete"
  >
    <Primitive
      :ref="forwardRef"
      v-bind="indicator.attrs.value"
      :as="as"
      :as-child="asChild"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
