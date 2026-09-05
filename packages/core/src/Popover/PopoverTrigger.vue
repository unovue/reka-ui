<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { useForwardExpose } from '@/shared'

export interface PopoverTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { onMounted } from 'vue'
import { PopperAnchor } from '@/Popper'
import { Primitive } from '@/Primitive'
import { injectPopoverRootContext } from './PopoverRoot.vue'
import { getPopoverTriggerSurface } from './usePopover'

const props = withDefaults(defineProps<PopoverTriggerProps>(), {
  as: 'button',
})

const rootContext = injectPopoverRootContext()

const { forwardRef, currentElement: triggerElement } = useForwardExpose()

// id/aria/data-state + the toggling `onClick` all come from the shared surface
// builder (single source with `usePopover()`); the PopperAnchor wrapper (skipped
// when a `PopoverAnchor` is present), the element registration and the
// tag-dependent `type` stay in the SFC. Listener order is unchanged: `$attrs`
// fall through the as-child wrapper and `Slot` merges them BEFORE the inner
// element's own props, so a consumer `@click` still runs before the surface's
// `onClick`.
const trigger = getPopoverTriggerSurface(rootContext)

onMounted(() => {
  rootContext.triggerElement.value = triggerElement.value
})
</script>

<template>
  <component
    :is="rootContext.hasCustomAnchor.value ? Primitive : PopperAnchor"
    as-child
  >
    <Primitive
      :ref="forwardRef"
      :as="as"
      :as-child="props.asChild"
      v-bind="trigger.attrs.value"
      :type="as === 'button' ? 'button' : undefined"
    >
      <slot />
    </Primitive>
  </component>
</template>
