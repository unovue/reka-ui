<script lang="ts">
import type { HoverCardContentImplEmits, HoverCardContentImplProps } from './HoverCardContentImpl.vue'

export type HoverCardContentEmits = HoverCardContentImplEmits

export interface HoverCardContentProps extends HoverCardContentImplProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { Presence } from '@/Presence'
import { useForwardElement, useForwardPropsEmits } from '@/shared'
import HoverCardContentImpl from './HoverCardContentImpl.vue'
import { injectHoverCardRootContext } from './HoverCardRoot.vue'
import { excludeTouch } from './utils'

const props = defineProps<HoverCardContentProps>()
const emits = defineEmits<HoverCardContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)
const { forwardRef, expose } = useForwardElement()
defineExpose(expose)

const rootContext = injectHoverCardRootContext()

// Re-entering the content cancels a pending close; with `forceMount` it also
// opens a closed card after `openDelay`.
function handlePointerEnter(event: PointerEvent) {
  rootContext.onOpen('content-hover', event)
}
</script>

<template>
  <Presence
    :present="rootContext.open.value"
    :force-mount="forceMount"
    @complete="rootContext.notifyOpenComplete"
  >
    <HoverCardContentImpl
      v-bind="forwarded"
      :ref="forwardRef"
      @pointerenter="excludeTouch(handlePointerEnter)($event)"
    >
      <slot />
    </HoverCardContentImpl>
  </Presence>
</template>
