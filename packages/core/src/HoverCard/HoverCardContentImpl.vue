<script lang="ts">
import type { DismissableLayerDismissDetails, DismissableLayerEmits, FocusOutsideEvent, PointerDownOutsideEvent } from '@/DismissableLayer'
import type { PopperContentProps } from '@/Popper'
import { syncRef } from '@vueuse/shared'
import { useAncestorScroll, useForwardElement, useForwardProps, useGraceArea } from '@/shared'

export type HoverCardContentImplEmits = DismissableLayerEmits
export interface HoverCardContentImplProps extends PopperContentProps {}
</script>

<script setup lang="ts">
import { computed, getCurrentInstance, mergeProps, nextTick, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { DISMISSABLE_LAYER_WRAPPER, dismissableLayerOptions, useDismissableLayer } from '@/DismissableLayer/useDismissableLayer'
import { PopperContent } from '@/Popper'
import { splitWrapperAttrs } from '@/shared/splitWrapperAttrs'
import { injectHoverCardRootContext } from './HoverCardRoot.vue'
import { getHoverCardContentSurface } from './useHoverCard'
import { getTabbableNodes } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<HoverCardContentImplProps>()
const emits = defineEmits<HoverCardContentImplEmits>()
const forwarded = useForwardProps(props)

const { forwardRef, currentElement: contentElement, expose } = useForwardElement()
defineExpose(expose)
const rootContext = injectHoverCardRootContext()
const { isPointerInTransit, onPointerExit } = useGraceArea(rootContext.triggerElement, contentElement)

// `data-state` comes from the shared surface builder (single source with
// `useHoverCard()`); the grace area, selection containment, tabbable
// neutralisation, scroll dismissal, the dismissable layer (which hands the
// dismiss reason + event to `onDismiss`), PopperContent and the
// `--reka-hover-card-*` CSS variables stay in the SFC.
const content = getHoverCardContentSurface(rootContext)

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

// The content was `<DismissableLayer as-child>` around `PopperContent`; the
// layer is a composable on its element now. `layerWrapper` is what the layer
// received: its bindings with the content's attrs fallen through over them.
// So consumer attrs named after its props and events still configure it,
// and never render. (`$attrs` read through the instance proxy tracks.)
const instance = getCurrentInstance()!
const layerWrapper = computed(() => splitWrapperAttrs(mergeProps({
  asChild: true,
  disableOutsidePointerEvents: false,
  onEscapeKeyDown: (event: KeyboardEvent) => emits('escapeKeyDown', event),
  onPointerDownOutside: (event: PointerDownOutsideEvent) => emits('pointerDownOutside', event),
  onFocusOutside: (event: FocusOutsideEvent) => {
    event.preventDefault()
    emits('focusOutside', event)
  },
  onDismiss: handleDismiss,
}, instance.proxy!.$attrs), DISMISSABLE_LAYER_WRAPPER))
const layer = useDismissableLayer(dismissableLayerOptions(contentElement, () => layerWrapper.value))

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
})

// Dismiss when the trigger is scrolled (also inside a shadow root)
useAncestorScroll(rootContext.triggerElement, () => rootContext.onDismiss())

onUnmounted(() => {
  document.removeEventListener('pointerup', handlePointerUp)
  rootContext.hasSelectionRef.value = false
  rootContext.isPointerDownOnContentRef.value = false
})
</script>

<template>
  <PopperContent
    v-bind="mergeProps(mergeProps(layer.attrs(), layerWrapper.rest), mergeProps(forwarded, $attrs, content.attrs.value))"
    :ref="forwardRef"
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
</template>
