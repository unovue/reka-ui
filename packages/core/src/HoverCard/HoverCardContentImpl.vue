<script lang="ts">
import type { DismissableLayerDismissDetails, DismissableLayerEmits } from '@/DismissableLayer'
import type { PopperContentProps } from '@/Popper'
import { syncRef } from '@vueuse/shared'
import { disclosureState, useForwardExpose, useGraceArea } from '@/shared'

export type HoverCardContentImplEmits = DismissableLayerEmits
export interface HoverCardContentImplProps extends PopperContentProps {}
</script>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { nextTick, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { DismissableLayer } from '@/DismissableLayer'
import { PopperContent } from '@/Popper'
import { useForwardProps } from '..'
import { injectHoverCardRootContext } from './HoverCardRoot.vue'
import { getTabbableNodes } from './utils'

const props = defineProps<HoverCardContentImplProps>()
const emits = defineEmits<HoverCardContentImplEmits>()
const forwarded = useForwardProps(props)

const { forwardRef, currentElement: contentElement } = useForwardExpose()
const rootContext = injectHoverCardRootContext()
const { isPointerInTransit, onPointerExit } = useGraceArea(rootContext.triggerElement, contentElement)

syncRef(rootContext.isPointerInTransitRef, isPointerInTransit, { direction: 'rtl' })

// Leaving the grace area is the one pointer path that closes an open card (the
// trigger's own `pointerleave` only cancels a pending open), so the reason is
// decided here by whichever element the pointer left last.
let lastPointerLeave: { reason: 'trigger-leave' | 'content-leave', event: PointerEvent } | undefined
watchEffect((cleanupFn) => {
  const trigger = rootContext.triggerElement.value
  const content = contentElement.value
  if (!trigger || !content)
    return
  const handleTriggerLeave = (event: PointerEvent) => {
    lastPointerLeave = { reason: 'trigger-leave', event }
  }
  const handleContentLeave = (event: PointerEvent) => {
    lastPointerLeave = { reason: 'content-leave', event }
  }
  trigger.addEventListener('pointerleave', handleTriggerLeave)
  content.addEventListener('pointerleave', handleContentLeave)
  cleanupFn(() => {
    trigger.removeEventListener('pointerleave', handleTriggerLeave)
    content.removeEventListener('pointerleave', handleContentLeave)
  })
})

onPointerExit(() => {
  rootContext.onClose(lastPointerLeave?.reason ?? 'content-leave', lastPointerLeave?.event)
})

function handleDismiss({ reason, event }: DismissableLayerDismissDetails) {
  // `focusOutside` is prevented below, so the layer never dismisses for it;
  // the guard keeps `HoverCardOpenChangeReason` honest without a cast.
  if (reason === 'focus-outside')
    return
  rootContext.onDismiss(reason, event)
}

const containSelection = ref(false)

let originalBodyUserSelect: string
watchEffect((cleanupFn) => {
  if (containSelection.value) {
    const body = document.body

    // Safari requires prefix
    originalBodyUserSelect = body.style.userSelect || body.style.webkitUserSelect

    body.style.userSelect = 'none'
    body.style.webkitUserSelect = 'none'

    cleanupFn(() => {
      body.style.userSelect = originalBodyUserSelect
      body.style.webkitUserSelect = originalBodyUserSelect
    })
  }
})

function handlePointerUp() {
  containSelection.value = false
  rootContext.isPointerDownOnContentRef.value = false

  // Delay a frame to ensure we always access the latest selection
  nextTick(() => {
    const hasSelection = document.getSelection()?.toString() !== ''
    if (hasSelection)
      rootContext.hasSelectionRef.value = true
  })
}
onMounted(() => {
  if (contentElement.value) {
    document.addEventListener('pointerup', handlePointerUp)

    const tabbables = getTabbableNodes(contentElement.value)
    tabbables.forEach(tabbable => tabbable.setAttribute('tabindex', '-1'))
  }

  useEventListener(window, 'scroll', (event: Event) => {
    const target = event.target as HTMLElement
    if (target?.contains(rootContext.triggerElement.value!))
      rootContext.onDismiss()
  }, { capture: true })
})

onUnmounted(() => {
  document.removeEventListener('pointerup', handlePointerUp)
  rootContext.hasSelectionRef.value = false
  rootContext.isPointerDownOnContentRef.value = false
})
</script>

<template>
  <DismissableLayer
    as-child
    :disable-outside-pointer-events="false"
    @escape-key-down="emits('escapeKeyDown', $event)"
    @pointer-down-outside="emits('pointerDownOutside', $event)"
    @focus-outside.prevent="emits('focusOutside', $event)"
    @dismiss="handleDismiss"
  >
    <PopperContent
      v-bind="{ ...forwarded, ...$attrs }"
      :ref="forwardRef"
      :data-state="disclosureState(rootContext.open.value)"
      :style="{
        'userSelect': containSelection ? 'text' : undefined,
        // Safari requires prefix
        'WebkitUserSelect': containSelection ? 'text' : undefined,
        // re-namespace exposed content custom properties
        '--reka-hover-card-content-transform-origin': 'var(--reka-popper-transform-origin)',
        '--reka-hover-card-content-available-width': 'var(--reka-popper-available-width)',
        '--reka-hover-card-content-available-height': 'var(--reka-popper-available-height)',
        '--reka-hover-card-trigger-width': 'var(--reka-popper-anchor-width)',
        '--reka-hover-card-trigger-height': 'var(--reka-popper-anchor-height)',
      }"
      @pointerdown="(event: PointerEvent) => {
        // Contain selection to current layer
        if ((event.currentTarget as HTMLElement).contains(event.target as HTMLElement)) {
          containSelection = true
        }
        rootContext.hasSelectionRef.value = false;
        rootContext.isPointerDownOnContentRef.value = true;
      }"
    >
      <slot />
    </PopperContent>
  </DismissableLayer>
</template>
