<script lang="ts">
import type { FocusOutsideEvent, PointerDownOutsideEvent } from './utils'

import type { PrimitiveProps } from '@/Primitive'
import { computed, nextTick, reactive, watchEffect } from 'vue'
import { useForwardExpose } from '@/shared'

export interface DismissableLayerProps extends PrimitiveProps {
  /**
   * When `true`, hover/focus/click interactions will be disabled on elements outside
   * the `DismissableLayer`. Users will need to click twice on outside elements to
   * interact with them: once to close the `DismissableLayer`, and again to trigger the element.
   */
  disableOutsidePointerEvents?: boolean
}

export type DismissableLayerEmits = {
  /**
   * Event handler called when the escape key is down.
   * Can be prevented.
   */
  escapeKeyDown: [event: KeyboardEvent]
  /**
   * Event handler called when a `pointerdown` event happens outside of the `DismissableLayer`.
   * Can be prevented.
   */
  pointerDownOutside: [event: PointerDownOutsideEvent]
  /**
   * Event handler called when the focus moves outside of the `DismissableLayer`.
   * Can be prevented.
   */
  focusOutside: [event: FocusOutsideEvent]
  /**
   * Event handler called when an interaction happens outside the `DismissableLayer`.
   * Specifically, when a `pointerdown` event happens outside or focus moves outside of it.
   * Can be prevented.
   */
  interactOutside: [event: PointerDownOutsideEvent | FocusOutsideEvent]
}

export type DismissableLayerPrivateEmits = DismissableLayerEmits & {
  /**
   * Handler called when the `DismissableLayer` should be dismissed
   */
  dismiss: []
}

export const context = reactive({
  layersRoot: new Set<HTMLElement>(),
  layersWithOutsidePointerEventsDisabled: new Set<HTMLElement>(),
  branches: new Set<HTMLElement>(),
})
</script>

<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { Primitive } from '@/Primitive'
import { useFocusOutside, usePointerDownOutside } from './utils'

const props = withDefaults(defineProps<DismissableLayerProps>(), {
  disableOutsidePointerEvents: false,
})

const emits = defineEmits<DismissableLayerPrivateEmits>()

const { forwardRef, currentElement: layerElement } = useForwardExpose()
const ownerDocument = computed(
  () => layerElement.value?.ownerDocument ?? globalThis.document,
)

const layers = computed(() => context.layersRoot)

const index = computed(() => {
  return layerElement.value
    ? Array.from(layers.value).indexOf(layerElement.value)
    : -1
})

const isBodyPointerEventsDisabled = computed(() => {
  return context.layersWithOutsidePointerEventsDisabled.size > 0
})

const isPointerEventsEnabled = computed(() => {
  const localLayers = Array.from(layers.value)
  const [highestLayerWithOutsidePointerEventsDisabled] = [
    ...context.layersWithOutsidePointerEventsDisabled,
  ].slice(-1)
  const highestLayerWithOutsidePointerEventsDisabledIndex = localLayers.indexOf(
    highestLayerWithOutsidePointerEventsDisabled,
  )

  return index.value >= highestLayerWithOutsidePointerEventsDisabledIndex
})

// Helper function to check if target is within a branch, shadow DOM aware
function isBranchElement(branch: HTMLElement, target: HTMLElement): boolean {
  // Enhanced shadow DOM aware check: walk up the tree including through shadow boundaries
  let currentTarget: Node | null = target

  while (currentTarget) {
    if (currentTarget === branch) {
      return true
    }

    // Standard contains check for performance on non-shadow DOM cases
    if (
      currentTarget.nodeType === Node.ELEMENT_NODE
      && branch.contains(currentTarget as HTMLElement)
    ) {
      return true
    }

    // Move up the DOM tree, crossing shadow boundaries
    if (currentTarget.parentNode) {
      currentTarget = currentTarget.parentNode
    }
    // If we're at a shadow root, move to the host element
    else if ((currentTarget as ShadowRoot).host) {
      currentTarget = (currentTarget as ShadowRoot).host
    }
    // Handle document fragments with host (alternate shadow root representation)
    else if ((currentTarget as any).host) {
      currentTarget = (currentTarget as any).host
    }
    // If we're at document or null, stop traversal
    else {
      break
    }
  }

  return false
}

const pointerDownOutside = usePointerDownOutside(async (event) => {
  const isPointerDownOnBranch = [...context.branches].some(branch =>
    branch ? isBranchElement(branch, event.target as HTMLElement) : false,
  )

  if (!isPointerEventsEnabled.value || isPointerDownOnBranch)
    return
  emits('pointerDownOutside', event)
  emits('interactOutside', event)
  await nextTick()
  if (!event.defaultPrevented)
    emits('dismiss')
}, layerElement)

const focusOutside = useFocusOutside((event) => {
  const isFocusInBranch = [...context.branches].some(branch =>
    branch ? isBranchElement(branch, event.target as HTMLElement) : false,
  )

  if (isFocusInBranch)
    return
  emits('focusOutside', event)
  emits('interactOutside', event)
  if (!event.defaultPrevented)
    emits('dismiss')
}, layerElement)

onKeyStroke('Escape', (event) => {
  const isHighestLayer = index.value === layers.value.size - 1
  if (!isHighestLayer)
    return
  emits('escapeKeyDown', event)
  if (!event.defaultPrevented)
    emits('dismiss')
})

let originalBodyPointerEvents: string
watchEffect((cleanupFn) => {
  if (!layerElement.value)
    return
  if (props.disableOutsidePointerEvents) {
    if (context.layersWithOutsidePointerEventsDisabled.size === 0) {
      originalBodyPointerEvents = ownerDocument.value.body.style.pointerEvents
      // Enhanced shadow DOM handling: only modify body if we're in the main document
      const rootNode = layerElement.value.getRootNode()
      const isInMainDocument = rootNode === ownerDocument.value

      if (isInMainDocument) {
        ownerDocument.value.body.style.pointerEvents = 'none'
      }
    }
    context.layersWithOutsidePointerEventsDisabled.add(layerElement.value)
  }
  layers.value.add(layerElement.value)

  cleanupFn(() => {
    if (
      props.disableOutsidePointerEvents
      && context.layersWithOutsidePointerEventsDisabled.size === 1
    ) {
      const rootNode = layerElement.value?.getRootNode()
      const isInMainDocument = rootNode === ownerDocument.value

      if (isInMainDocument) {
        ownerDocument.value.body.style.pointerEvents
          = originalBodyPointerEvents
      }
    }
  })
})

watchEffect((cleanupFn) => {
  cleanupFn(() => {
    if (!layerElement.value)
      return
    layers.value.delete(layerElement.value)
    context.layersWithOutsidePointerEventsDisabled.delete(layerElement.value)
  })
})
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
    data-dismissable-layer
    :style="{
      pointerEvents: isBodyPointerEventsDisabled
        ? isPointerEventsEnabled
          ? 'auto'
          : 'none'
        : undefined,
    }"
    @focus.capture="focusOutside.onFocusCapture"
    @blur.capture="focusOutside.onBlurCapture"
    @pointerdown.capture="pointerDownOutside.onPointerDownCapture"
  >
    <slot />
  </Primitive>
</template>
