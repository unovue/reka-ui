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
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Presence } from '@/Presence'
import { renderAs } from '@/Primitive/renderAs'
import { onNextFrame } from '@/shared/timeout'
import { injectTabsRootContext } from './TabsRoot.vue'
import { getTabsContentSurface } from './useTabs'
import { useTabsPartId } from './utils'

const props = defineProps<TabsContentProps>()

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectTabsRootContext()
useTabsPartId(rootContext.customContentIds, () => props.value, () => props.id)

// id/role/aria-labelledby/tabindex + data-state/data-orientation from the shared
// surface builder (selection is read from its `state`, not re-derived); the
// Presence wrapper (an inactive panel leaves the DOM, element and all, as in
// Base UI, unless `unmountOnHide` is off: #2476), the registration, `hidden`,
// and the mount-animation `style` stay in the SFC.
const surface = getTabsContentSurface(rootContext, () => props.value)

// No mount animation either while the root has yet to select its first tab
// (`undefined`): the automatic selection lands before the next frame.
const isMountAnimationPreventedRef = ref(surface.state.value.state === 'checked' || rootContext.modelValue.value === undefined)

onMounted(() => {
  onNextFrame(() => {
    isMountAnimationPreventedRef.value = false
  })
})

// Base UI: the trigger's `aria-controls` names the panel only while the panel
// element is in the DOM, which with `unmountOnHide` is only while it is shown.
// A `value` change moves the registration to the new value.
watch([currentElement, () => props.value], ([element, value], [, previous]) => {
  rootContext.unregisterContent(previous)
  if (element)
    rootContext.registerContent(value)
})

onBeforeUnmount(() => {
  rootContext.unregisterContent(props.value)
})
</script>

<template>
  <Presence
    v-slot="{ present }"
    :present="forceMount || surface.state.value.state === 'checked'"
    :force-mount="!rootContext.unmountOnHide.value"
  >
    <component
      :is="renderAs(as, asChild)"
      :ref="forwardRef"
      :hidden="!present"
      v-bind="{ ...surface.attrs.value, id: props.id || surface.attrs.value.id }"
      :style="{
        animationDuration: isMountAnimationPreventedRef ? '0s' : undefined,
      }"
    >
      <slot />
    </component>
  </Presence>
</template>
