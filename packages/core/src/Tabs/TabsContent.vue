<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { StringOrNumber } from '@/shared/types'
import { useForwardElement } from '@/shared'

export interface TabsContentProps extends PrimitiveProps {
  /** A unique value that associates the content with a trigger. */
  value: StringOrNumber
  /**
   * Id of the element, which the trigger with the same `value` points its
   * `aria-controls` at. Defaults to one derived from the Root's id and `value`.
   */
  id?: string
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Presence } from '@/Presence'
import { Primitive } from '@/Primitive'
import { injectTabsRootContext } from './TabsRoot.vue'
import { getTabsContentSurface } from './useTabs'
import { useTabsPartId } from './utils'

const props = defineProps<TabsContentProps>()

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectTabsRootContext()
useTabsPartId(rootContext.customContentIds, () => props.value, () => props.id)

// id/role/aria-labelledby/tabindex + data-state/data-orientation from the shared
// surface builder (selection is read from its `state`, not re-derived); the
// Presence wrapper, the registration lifecycle, `hidden`, and the
// mount-animation `style` stay in the SFC.
const surface = getTabsContentSurface(rootContext, () => props.value)

const isMountAnimationPreventedRef = ref(surface.state.value.state === 'checked')

onMounted(() => {
  rootContext.registerContent(props.value)
  requestAnimationFrame(() => {
    isMountAnimationPreventedRef.value = false
  })
})

onBeforeUnmount(() => {
  rootContext.unregisterContent(props.value)
})
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="forceMount || surface.state.value.state === 'checked'"
    force-mount
  >
    <Primitive
      :ref="forwardRef"
      :as="as"
      :as-child="asChild"
      :hidden="!present"
      v-bind="surface.attrs.value"
      :style="{
        animationDuration: isMountAnimationPreventedRef ? '0s' : undefined,
      }"
    >
      <slot v-if="rootContext.unmountOnHide.value ? present : true" />
    </Primitive>
  </Presence>
</template>
