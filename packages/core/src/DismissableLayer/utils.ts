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

/**
 * Finds the closest ancestor matching selector, stopping at shadow DOM boundaries.
 * @param element the starting element
 * @param selector the selector to match
 * @returns the closest matching ancestor or null if none found
 */
function closestWithinBoundaries(
  element: HTMLElement,
  selector: string,
): HTMLElement | null {
  let current: Node | null = element

  while (current) {
    if (current instanceof HTMLElement) {
      const el: HTMLElement = current

      if (el.matches && el.matches(selector)) {
        return el
      }
    }

    const up: Node | null = current.parentNode
    if (!up)
      break
    if (up instanceof ShadowRoot)
      break
    current = up
  }

  return null
}

/**
 * Shadow DOM aware helper to query all elements with selector
 * @param root the root element or document to start the search from
 * @param selector the selector to match
 * @returns an array of matching elements
 */
function querySelectorAllCrossingBoundaries(
  root: Document | DocumentFragment | Element,
  selector: string,
): HTMLElement[] {
  const results: HTMLElement[] = []

  function traverse(node: Node): void {
    if (node instanceof HTMLElement) {
      const el: HTMLElement = node

      if (el.matches && el.matches(selector)) {
        results.push(el)
      }
      if (el.shadowRoot) {
        traverse(el.shadowRoot)
      }
    }
    const children = node.childNodes
    if (children) {
      for (let i = 0; i < children.length; i++)
        traverse(children[i])
    }
  }
  traverse(root)
  return results
}

function isLayerExist(layerElement: HTMLElement, targetElement: HTMLElement) {
  const targetLayer = closestWithinBoundaries(
    targetElement,
    '[data-dismissable-layer]',
  )

  const mainLayer
    = layerElement.dataset.dismissableLayer === ''
      ? layerElement
      : (() => {
          const nested = layerElement.querySelector('[data-dismissable-layer]')
          return nested instanceof HTMLElement ? nested : layerElement
        })()

  if (!targetLayer) {
    // Search for all layers across contexts (document + shadow roots)
    // Always start from the main document to get a complete view.
    const mainDocument = layerElement.ownerDocument
    const allLayersEverywhere = querySelectorAllCrossingBoundaries(
      mainDocument,
      '[data-dismissable-layer]',
    )
    const topmostLayer = allLayersEverywhere[allLayersEverywhere.length - 1]
    const isTopmostLayer = mainLayer === topmostLayer
    // Only the topmost layer should handle outside clicks
    if (isTopmostLayer) {
      return false
    }
    else {
      return true // Treat as inside to prevent lower layer dismissal
    }
  }

  // If target layer is the same as main layer, target is inside
  if (mainLayer === targetLayer) {
    return true
  }

  // For shadow DOM, we need to search in the appropriate root
  const layerRoot = layerElement.getRootNode()
  const targetRoot = targetElement.getRootNode()

  // If they're in different roots, we need to search more broadly
  let searchRoot: Document | DocumentFragment | Element
  if (layerRoot === targetRoot) {
    // Same root, search within that root
    if (layerRoot instanceof Document) {
      searchRoot = layerRoot
    }
    else if (layerRoot instanceof ShadowRoot) {
      searchRoot = layerRoot
    }
    else if (layerRoot instanceof DocumentFragment) {
      searchRoot = layerRoot
    }
    else {
      searchRoot = layerElement.ownerDocument
    }
  }
  else {
    // Different roots - layers in different DOM contexts should not interfere with each other
    // Return false immediately to respect DOM boundaries (e.g., main document vs shadow DOM)
    return false
  }

  const nodeList = querySelectorAllCrossingBoundaries(
    searchRoot,
    '[data-dismissable-layer]',
  )

  // Check layer hierarchy - if main layer comes before target layer in DOM order,
  // it means target layer is "above" main layer (higher z-index typically)
  const mainLayerIndex = nodeList.indexOf(mainLayer)
  const targetLayerIndex = nodeList.indexOf(targetLayer)

  if (
    mainLayerIndex >= 0
    && targetLayerIndex >= 0
    && mainLayerIndex < targetLayerIndex
  ) {
    return true
  }

  return false
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
  // Get the appropriate document context, considering shadow DOM
  const getOwnerDocument = (): Document => {
    if (!element?.value)
      return globalThis?.document

    const rootNode = element.value.getRootNode()
    if (rootNode instanceof Document) {
      return rootNode
    }
    // In shadow DOM, we still want to listen on the main document for events
    return element.value.ownerDocument ?? globalThis?.document
  }

  const ownerDocument = getOwnerDocument()

  const isPointerInsideDOMTree = ref(false)
  const handleClickRef = ref(() => {})

  watchEffect((cleanupFn) => {
    if (!isClient || !toValue(enabled))
      return
    const handlePointerDown = async (event: PointerEvent) => {
      const composedPath = event.composedPath()
      const first = composedPath[0]
      const target
        = first instanceof HTMLElement
          ? first
          : event.target instanceof HTMLElement
            ? event.target
            : undefined

      if (!element?.value || !target)
        return

      const layerExists = isLayerExist(element.value, target)

      if (layerExists) {
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
      if (!toValue(enabled))
        return
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
  // Get the appropriate document context, considering shadow DOM
  const getOwnerDocument = (): Document => {
    if (!element?.value)
      return globalThis?.document

    const rootNode = element.value.getRootNode()
    if (rootNode instanceof Document) {
      return rootNode
    }
    // In shadow DOM, we still want to listen on the main document for events
    return element.value.ownerDocument ?? globalThis?.document
  }

  const ownerDocument = getOwnerDocument()

  const isFocusInsideDOMTree = ref(false)
  watchEffect((cleanupFn) => {
    if (!isClient || !toValue(enabled))
      return
    const handleFocus = async (event: FocusEvent) => {
      if (!element?.value)
        return

      await nextTick()
      await nextTick()

      // Use composedPath for focus events too
      const composedPath = event.composedPath()
      const first = composedPath[0]
      const target
        = first instanceof HTMLElement
          ? first
          : event.target instanceof HTMLElement
            ? event.target
            : undefined

      if (!element.value || !target || isLayerExist(element.value, target))
        return

      if (event.target && !isFocusInsideDOMTree.value) {
        const eventDetail = { originalEvent: event }
        handleAndDispatchCustomEvent(
          FOCUS_OUTSIDE,
          onFocusOutside,
          eventDetail,
        )
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
