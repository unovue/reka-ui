<script lang="ts">
export interface HoverCardTriggerProps extends PopperAnchorProps {}
</script>

<script setup lang="ts">
import type { PopperAnchorProps } from '@/Popper'
import { onScopeDispose } from 'vue'
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

function handleLeave() {
  setTimeout(() => {
    if (!rootContext.isPointerInTransitRef.value && !rootContext.open.value) {
      rootContext.onClose()
    }
  }, 0)
}

function handleTouch(event: PointerEvent) {
  if (!rootContext.enableTouch.value || event.pointerType !== 'touch')
    return

  if (rootContext.open.value)
    rootContext.onDismiss()
  else
    rootContext.onOpenChange(true)
}

let isPointerDownByTouch = false
let resetTimer = 0

function handlePointerDown(event: PointerEvent) {
  // A touch tap focuses the trigger, and that focus would otherwise open the
  // card even when `enableTouch` is disabled. Flag the touch so the `focus`
  // that immediately follows can be ignored (touch is driven by `handleTouch`).
  isPointerDownByTouch = event.pointerType === 'touch'
  clearTimeout(resetTimer)
  resetTimer = window.setTimeout(() => {
    isPointerDownByTouch = false
  }, 0)
}

function handleFocus() {
  if (isPointerDownByTouch)
    return

  rootContext.onOpen()
}

onScopeDispose(() => clearTimeout(resetTimer))
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
      :data-state="rootContext.open.value ? 'open' : 'closed'"
      data-grace-area-trigger
      @pointerenter="excludeTouch(rootContext.onOpen)($event)"
      @pointerleave="excludeTouch(handleLeave)($event)"
      @pointerdown="handlePointerDown"
      @pointerup="handleTouch"
      @focus="handleFocus"
      @blur="rootContext.onClose()"
    >
      <slot />
    </Primitive>
  </PopperAnchor>
</template>
