<script lang="ts">
export interface HoverCardTriggerProps extends PopperAnchorProps {}
</script>

<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { PopperAnchor } from '@/Popper'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectHoverCardRootContext } from './HoverCardRoot.vue'
import { getHoverCardTriggerSurface } from './useHoverCard'

withDefaults(defineProps<HoverCardTriggerProps>(), {
  as: 'a',
})

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectHoverCardRootContext()
rootContext.triggerElement = currentElement

// `data-state`, the `data-grace-area-trigger` selector and the hover / leave /
// touch / focus / blur listeners all come from the shared surface builder
// (single source with `useHoverCard()`); the PopperAnchor wrapper and the
// element registration above stay in the SFC. Listener order is unchanged:
// `$attrs` fall through the as-child wrapper and `Slot` merges them BEFORE the
// inner element's own props, so a consumer `@pointerenter` still runs before
// the surface's.
const trigger = getHoverCardTriggerSurface(rootContext)
</script>

<template>
  <PopperAnchor
    as-child
    :reference="reference"
  >
    <Primitive
      :ref="forwardRef"
      :as-child="asChild"
      :as="as"
      v-bind="trigger.attrs.value"
    >
      <slot />
    </Primitive>
  </PopperAnchor>
</template>
