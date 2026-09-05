<script lang="ts">
export interface HoverCardTriggerProps extends PopperAnchorProps {}
</script>

<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { PopperAnchor } from '@/Popper'
import { Primitive } from '@/Primitive'
import { disclosureState, useForwardExpose } from '@/shared'
import { injectHoverCardRootContext } from './HoverCardRoot.vue'
import { excludeTouch } from './utils'

withDefaults(defineProps<HoverCardTriggerProps>(), {
  as: 'a',
})

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectHoverCardRootContext()
rootContext.triggerElement = currentElement

function handlePointerEnter(event: PointerEvent) {
  rootContext.onOpen('trigger-hover', event)
}

// While open, leaving the trigger is handled by the grace area (see
// HoverCardContentImpl): this only cancels a pending delayed open.
function handleLeave(event: PointerEvent) {
  setTimeout(() => {
    if (!rootContext.isPointerInTransitRef.value && !rootContext.open.value) {
      rootContext.onClose('trigger-leave', event)
    }
  }, 0)
}

function handleTouch(event: PointerEvent) {
  if (!rootContext.enableTouch.value || event.pointerType !== 'touch')
    return

  if (rootContext.open.value)
    rootContext.onDismiss('trigger-press', event)
  else
    rootContext.onOpenChange(true, 'trigger-press', event)
}
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
      :data-state="disclosureState(rootContext.open.value)"
      data-grace-area-trigger
      @pointerenter="excludeTouch(handlePointerEnter)($event)"
      @pointerleave="excludeTouch(handleLeave)($event)"
      @pointerup="handleTouch"
      @focus="rootContext.onOpen('trigger-focus', $event)"
      @blur="rootContext.onClose('trigger-blur', $event)"
    >
      <slot />
    </Primitive>
  </PopperAnchor>
</template>
