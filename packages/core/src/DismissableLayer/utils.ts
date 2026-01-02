import type { MaybeRefOrGetter, Ref } from 'vue'
import { isClient } from '@vueuse/shared'
import { nextTick, ref, toValue, watchEffect } from 'vue'
import { handleAndDispatchCustomEvent } from '@/shared'

export type PointerDownOutsideEvent = CustomEvent<{
  originalEvent: PointerEvent
}>
export type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>

export const DISMISSABLE_LAYER_NAME = 'DismissableLayer'
export const CONTEXT_UPDATE = 'dismissableLayer.update'
export const POINTER_DOWN_OUTSIDE = 'dismissableLayer.pointerDownOutside'
export const FOCUS_OUTSIDE = 'dismissableLayer.focusOutside'

function findClosestDismissableLayer(element: HTMLElement, selector: string): HTMLElement | null {
  return element.closest(selector)
}

/**
 * Find all dismissable layers in the current context
 */
function getAllDismissableLayers(startElement: HTMLElement): HTMLElement[] {
  const rootNode = startElement.getRootNode()

  if (rootNode instanceof Document || rootNode instanceof ShadowRoot) {
    return Array.from(rootNode.querySelectorAll('[data-dismissable-layer]')) as HTMLElement[]
  }

  return []
}

/**
 * Check if target element is within the dismissable layer hierarchy
 */
function isTargetWithinLayer(layerElement: HTMLElement, targetElement: HTMLElement): boolean {
  if (!layerElement || !targetElement) {
    return false
  }

  const targetLayer = findClosestDismissableLayer(targetElement, '[data-dismissable-layer]')
  if (!targetLayer) {
    return false
  }

  const currentLayer = layerElement.dataset.dismissableLayer === ''
    ? layerElement
    : layerElement.querySelector('[data-dismissable-layer]') as HTMLElement

  if (!currentLayer) {
    return false
  }

  // Same layer or target is in a nested layer
  if (targetLayer === currentLayer) {
    return true
  }

  // Check layer hierarchy - nested layers should not dismiss parent layers
  const allLayers = getAllDismissableLayers(layerElement)
  const currentIndex = allLayers.indexOf(currentLayer)
  const targetIndex = allLayers.indexOf(targetLayer)

  return currentIndex < targetIndex
}

/**
 * Listens for `pointerdown` outside a DOM subtree. We use `pointerdown` rather than `pointerup`
 * to mimic layer dismissing behaviour present in OS.
 * Returns props to pass to the node we want to check for outside events.
 */
export function usePointerDownOutside(
  onPointerDownOutside?: (event: PointerDownOutsideEvent) => void,
  element?: Ref<HTMLElement | undefined>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const ownerDocument: Document
    = element?.value?.ownerDocument ?? globalThis?.document

  const isPointerInsideDOMTree = ref(false)
  const handleClickRef = ref(() => {})

  watchEffect((cleanupFn) => {
    if (!isClient || !toValue(enabled))
      return
    const handlePointerDown = async (event: PointerEvent) => {
      const composedPath = event.composedPath()
      const target = (composedPath[0] || event.target) as HTMLElement

      if (!element?.value || !target) {
        return
      }

      if (isTargetWithinLayer(element.value, target)) {
        isPointerInsideDOMTree.value = false
        return
      }

      if (event.target && !isPointerInsideDOMTree.value) {
        const eventDetail = { originalEvent: event }

        function handleAndDispatchPointerDownOutsideEvent() {
          handleAndDispatchCustomEvent(
            POINTER_DOWN_OUTSIDE,
            onPointerDownOutside,
            eventDetail,
          )
        }

        /**
         * On touch devices, we need to wait for a click event because browsers implement
         * a ~350ms delay between the time the user stops touching the display and when the
         * browser executes events. We need to ensure we don't reactivate pointer-events within
         * this timeframe otherwise the browser may execute events that should have been prevented.
         *
         * Additionally, this also lets us deal automatically with cancellations when a click event
         * isn't raised because the page was considered scrolled/drag-scrolled, long-pressed, etc.
         *
         * This is why we also continuously remove the previous listener, because we cannot be
         * certain that it was raised, and therefore cleaned-up.
         */
        if (event.pointerType === 'touch') {
          ownerDocument.removeEventListener('click', handleClickRef.value)
          handleClickRef.value = handleAndDispatchPointerDownOutsideEvent
          ownerDocument.addEventListener('click', handleClickRef.value, {
            once: true,
          })
        }
        else {
          handleAndDispatchPointerDownOutsideEvent()
        }
      }
      else {
        // We need to remove the event listener in case the outside click has been canceled.
        // See: https://github.com/radix-ui/primitives/issues/2171
        ownerDocument.removeEventListener('click', handleClickRef.value)
      }
      isPointerInsideDOMTree.value = false
    }
    /**
     * if this hook executes in a component that mounts via a `pointerdown` event, the event
     * would bubble up to the document and trigger a `pointerDownOutside` event. We avoid
     * this by delaying the event listener registration on the document.
     * This is how the DOM works, ie:
     * ```
     * button.addEventListener('pointerdown', () => {
     *   console.log('I will log');
     *   document.addEventListener('pointerdown', () => {
     *     console.log('I will also log');
     *   })
     * });
     */
    const timerId = window.setTimeout(() => {
      ownerDocument.addEventListener('pointerdown', handlePointerDown)
    }, 0)

    cleanupFn(() => {
      window.clearTimeout(timerId)
      ownerDocument.removeEventListener('pointerdown', handlePointerDown)
      ownerDocument.removeEventListener('click', handleClickRef.value)
    })
  })

  return {
    onPointerDownCapture: () => {
      if (!toValue(enabled)) {
        return
      }
      isPointerInsideDOMTree.value = true
    },
  }
}

/**
 * Listens for when focus happens outside a DOM subtree.
 * Returns props to pass to the root (node) of the subtree we want to check.
 */
export function useFocusOutside(
  onFocusOutside?: (event: FocusOutsideEvent) => void,
  element?: Ref<HTMLElement | undefined>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const ownerDocument: Document
    = element?.value?.ownerDocument ?? globalThis?.document

  const isFocusInsideDOMTree = ref(false)
  watchEffect((cleanupFn) => {
    if (!isClient || !toValue(enabled))
      return
    const handleFocus = async (event: FocusEvent) => {
      if (!element?.value)
        return

      await nextTick()

      const composedPath = event.composedPath()
      const target = (composedPath[0] || event.target) as HTMLElement

      // Skip shadow root containers as they're not meaningful focus targets
      if (!target || target.id === 'shadow-root-container') {
        return
      }

      if (!isTargetWithinLayer(element.value, target) && !isFocusInsideDOMTree.value) {
        const eventDetail = { originalEvent: event }
        handleAndDispatchCustomEvent(FOCUS_OUTSIDE, onFocusOutside, eventDetail)
      }
    }

    ownerDocument.addEventListener('focusin', handleFocus)

    cleanupFn(() => ownerDocument.removeEventListener('focusin', handleFocus))
  })

  return {
    onFocusCapture: () => {
      if (!toValue(enabled))
        return

      isFocusInsideDOMTree.value = true
    },
    onBlurCapture: () => {
      if (!toValue(enabled))
        return

      isFocusInsideDOMTree.value = false
    },
  }
}

export function dispatchUpdate() {
  const event = new CustomEvent(CONTEXT_UPDATE)
  document.dispatchEvent(event)
}
