<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { selectionState, useForwardElement } from '@/shared'

export interface ListboxItemIndicatorProps extends PrimitiveProps {
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
import { injectListboxItemContext } from './ListboxItem.vue'

withDefaults(defineProps<ListboxItemIndicatorProps>(), {
  as: 'span',
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const itemContext = injectListboxItemContext()

// An indicator that is not shown mounts no `Presence` (as `SelectItemIndicator`).
// Once shown, it stays mounted until its exit has finished, and one shown
// after this indicator mounted enters with `data-starting-style`, as it did
// while `Presence` was always mounted.
const instance = getCurrentInstance()!
const lingering = shallowRef(false)
function onPresenceComplete(present: boolean) {
  if (!present)
    lingering.value = false
}
</script>

<template>
  <Presence
    v-if="forceMount || itemContext.isSelected.value || lingering"
    :present="forceMount || itemContext.isSelected.value"
    :appear="instance.isMounted"
    @vue:mounted="lingering = true"
    @complete="onPresenceComplete"
  >
    <Primitive
      :ref="forwardRef"
      aria-hidden="true"
      :data-state="selectionState(itemContext.isSelected.value)"
      :as="as"
      :as-child="asChild"
    >
      <slot />
    </Primitive>
  </Presence>
</template>
