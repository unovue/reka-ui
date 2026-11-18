<script lang="ts">
export interface HoverCardTriggerProps extends PopperAnchorProps {}
</script>

<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { onBeforeUnmount } from 'vue'
import { PopperAnchor } from '@/Popper'
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectHoverCardRootContext } from './HoverCardRoot.vue'
import { excludeTouch } from './utils'

withDefaults(defineProps<HoverCardTriggerProps>(), {
  as: 'a',
})

const { forwardRef, currentElement } = useForwardExpose()
const rootContext = injectHoverCardRootContext()
rootContext.triggerElement = currentElement

let leaveTimer = 0
const openRequester = {}

function handleLeave() {
  clearTimeout(leaveTimer)
  leaveTimer = window.setTimeout(() => {
    leaveTimer = 0
    if (!rootContext.isPointerInTransitRef.value && !rootContext.open.value) {
      rootContext.onClose()
    }
  }, 0)
}

onBeforeUnmount(() => {
  clearTimeout(leaveTimer)
  leaveTimer = 0
  // Withdraw only this trigger's own pending open; never write `open`
  rootContext.onCancelOpen(openRequester)
})

function handleTouch(event: PointerEvent) {
  if (!rootContext.enableTouch.value || event.pointerType !== 'touch')
    return

  if (rootContext.open.value)
    rootContext.onDismiss()
  else
    rootContext.onOpenChange(true)
}
</script>

<template>
  <PopperAnchor
    scope="hover-card"
    as-child
    :reference="reference"
  >
    <Primitive
      :ref="forwardRef"
      :as-child="asChild"
      :as="as"
      :type="$attrs.type ?? (as === 'button' ? 'button' : undefined)"
      :data-state="rootContext.open.value ? 'open' : 'closed'"
      data-grace-area-trigger
      @pointerenter="excludeTouch(() => rootContext.onOpen(openRequester))($event)"
      @pointerleave="excludeTouch(handleLeave)($event)"
      @pointerup="handleTouch"
      @focus="rootContext.onOpen(openRequester)"
      @blur="rootContext.onClose()"
    >
      <slot />
    </Primitive>
  </PopperAnchor>
</template>
