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

// Shadow DOM aware helper to find closest element with selector
function closestCrossingBoundaries(
  element: HTMLElement,
  selector: string,
): HTMLElement | null {
  let current: Node | null = element

  while (current) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as HTMLElement

      if (el.matches && el.matches(selector)) {
        return el
      }
    }

    // Move to parent, crossing shadow boundaries
    let next: Node | null = null

    if (current.parentNode) {
      next = current.parentNode
    }
    else if ((current as any).host) {
      // Handle shadow root cases - check for host property
      next = (current as any).host
    }
    else {
      break
    }

    current = next
  }

  return null
}

// DOM boundary respecting version - doesn't cross shadow boundaries
function closestWithinBoundaries(
  element: HTMLElement,
  selector: string,
): HTMLElement | null {
  let current: Node | null = element

  while (current) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const el = current as HTMLElement

      if (el.matches && el.matches(selector)) {
        return el
      }
    }

    // Move to parent, but stop at shadow boundaries
    if (current.parentNode && current.parentNode.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      current = current.parentNode
    }
    else if (current.parentNode && current.parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      // At shadow root boundary - continue within shadow root
      current = current.parentNode
    }
    else {
      break
    }
  }

  return null
}

// Shadow DOM aware helper to query all elements with selector
function querySelectorAllCrossingBoundaries(
  root: Document | DocumentFragment | Element,
  selector: string,
): HTMLElement[] {
  const results: HTMLElement[] = []

  function traverse(node: Node, depth: number = 0) {
    const indent = '  '.repeat(depth)

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement

      if (el.matches && el.matches(selector)) {
        results.push(el)
      }

      // Check shadow root
      if (el.shadowRoot) {
        traverse(el.shadowRoot, depth + 1)
      }
    }

    // Traverse children
    try {
      node.childNodes.forEach(child => traverse(child, depth + 1))
    }
    catch (error) {
      console.error(
        `[querySelectorAllCrossingBoundaries] ${indent}Error traversing children:`,
        error,
      )
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
      : (layerElement.querySelector('[data-dismissable-layer]') as HTMLElement)

  console.debug('[isLayerExist] === LAYER ANALYSIS START === v5')
  console.debug('[isLayerExist] Layer Element:', layerElement)
  console.debug('[isLayerExist] Target Element:', targetElement)
  console.debug('[isLayerExist] Main Layer:', mainLayer)
  console.debug('[isLayerExist] Target Layer:', targetLayer)
  console.debug('[isLayerExist] Layer Element ID/Class:', {
    id: layerElement.id,
    className: layerElement.className,
    dataset: layerElement.dataset,
  })

  // If no target layer found, check if we should handle this outside click
  if (!targetLayer) {
    console.debug('[isLayerExist] 🔍 NO TARGET LAYER - Processing outside click')

    // IMPROVED: Search for ALL layers across all contexts (main document + shadow roots)
    // Always search from the main document to get complete layer hierarchy
    const mainDocument = layerElement.ownerDocument
    const allLayersEverywhere = querySelectorAllCrossingBoundaries(
      mainDocument,
      '[data-dismissable-layer]',
    )

    console.debug('[isLayerExist] 📋 ALL LAYERS FOUND (COMPREHENSIVE):', allLayersEverywhere.length)
    allLayersEverywhere.forEach((layer, index) => {
      const layerRoot = layer.getRootNode()
      console.debug(`[isLayerExist] Layer ${index}:`, {
        element: layer,
        id: layer.id,
        className: layer.className,
        isMainLayer: layer === mainLayer,
        root: layerRoot === mainDocument ? 'main-document' : 'shadow-root',
        dataset: layer.dataset,
      })
    })

    const mainLayerIndex = allLayersEverywhere.indexOf(mainLayer)
    const topmostLayer = allLayersEverywhere[allLayersEverywhere.length - 1]
    const isTopmostLayer = mainLayer === topmostLayer

    console.debug('[isLayerExist] 🎯 COMPREHENSIVE HIERARCHY ANALYSIS:', {
      mainLayerIndex,
      topmostLayerIndex: allLayersEverywhere.length - 1,
      isTopmostLayer,
      topmostLayer: {
        element: topmostLayer,
        id: topmostLayer?.id,
        className: topmostLayer?.className,
        root: topmostLayer?.getRootNode() === mainDocument ? 'main-document' : 'shadow-root',
      },
      mainLayer: {
        element: mainLayer,
        id: mainLayer?.id,
        className: mainLayer?.className,
        root: mainLayer?.getRootNode() === mainDocument ? 'main-document' : 'shadow-root',
      },
    })

    // Only the topmost layer should handle outside clicks
    if (isTopmostLayer) {
      console.debug('[isLayerExist] ✅ TOPMOST LAYER - Will handle outside click (dismiss)')
      return false
    }
    else {
      console.debug('[isLayerExist] ❌ NOT TOPMOST - Will ignore outside click (pretend inside)')
      return true // Pretend it's inside to prevent dismissal
    }
  }

  // If target layer is the same as main layer, target is inside
  if (mainLayer === targetLayer) {
    console.debug('[isLayerExist] ✅ TARGET IS SAME AS MAIN LAYER - Click is inside - v5')
    return true
  }

  console.debug('[isLayerExist] 🔍 CHECKING LAYER HIERARCHY')

  // For shadow DOM, we need to search in the appropriate root
  const layerRoot = layerElement.getRootNode()
  const targetRoot = targetElement.getRootNode()

  console.debug('[isLayerExist] Root analysis:', {
    layerRoot,
    targetRoot,
    sameRoot: layerRoot === targetRoot,
  })

  // If they're in different roots, we need to search more broadly
  let searchRoot: Document | DocumentFragment | Element
  if (layerRoot === targetRoot) {
    // Same root, search within that root
    searchRoot
      = layerRoot.nodeType === Node.DOCUMENT_NODE
        ? (layerRoot as Document)
        : (layerRoot as DocumentFragment)
    console.debug('[isLayerExist] Using same root for search:', searchRoot)
  }
  else {
    // Different roots - layers in different DOM contexts should not interfere with each other
    // Return false immediately to respect DOM boundaries (e.g., main document vs shadow DOM)
    console.debug('[isLayerExist] Different roots - rejecting cross-boundary comparison:', { layerRoot, targetRoot })
    console.debug('[isLayerExist] === LAYER ANALYSIS END ===')
    return false
  }

  const nodeList = querySelectorAllCrossingBoundaries(
    searchRoot,
    '[data-dismissable-layer]',
  )

  console.debug('[isLayerExist] 📋 HIERARCHY CHECK - All layers in search root:')
  nodeList.forEach((layer, index) => {
    console.debug(`[isLayerExist] Hierarchy Layer ${index}:`, {
      element: layer,
      id: layer.id,
      className: layer.className,
      isMainLayer: layer === mainLayer,
      isTargetLayer: layer === targetLayer,
    })
  })

  // Check layer hierarchy - if main layer comes before target layer in DOM order,
  // it means target layer is "above" main layer (higher z-index typically)
  const mainLayerIndex = nodeList.indexOf(mainLayer)
  const targetLayerIndex = nodeList.indexOf(targetLayer)

  console.debug('[isLayerExist] 🎯 HIERARCHY INDICES:', {
    mainLayerIndex,
    targetLayerIndex,
    mainLayerBeforeTarget: mainLayerIndex < targetLayerIndex,
    bothFound: mainLayerIndex >= 0 && targetLayerIndex >= 0,
  })

  if (
    mainLayerIndex >= 0
    && targetLayerIndex >= 0
    && mainLayerIndex < targetLayerIndex
  ) {
    console.debug('[isLayerExist] ✅ TARGET LAYER IS ABOVE MAIN LAYER - Click is inside')
    return true
  }

  console.debug('[isLayerExist] ❌ TARGET IS OUTSIDE OR INVALID HIERARCHY')
  console.debug('[isLayerExist] === LAYER ANALYSIS END ===')
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
    if (rootNode.nodeType === Node.DOCUMENT_NODE) {
      return rootNode as Document
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
      console.debug('[handlePointerDown] 🎯 === POINTER DOWN EVENT START === v5')

      // Use composedPath to get the real target in shadow DOM scenarios
      const composedPath = event.composedPath()
      const realTarget = composedPath[0] as HTMLElement | undefined
      const target = realTarget || (event.target as HTMLElement | undefined)

      console.debug('[handlePointerDown] Event details:', {
        originalTarget: event.target,
        realTarget,
        finalTarget: target,
        composedPathLength: composedPath.length,
        layerElement: element?.value,
        layerElementId: element?.value?.id,
        layerElementClass: element?.value?.className,
      })

      if (!element?.value || !target)
        return

      const layerExists = isLayerExist(element.value, target)
      console.debug('[handlePointerDown] Layer exists result:', layerExists)

      if (layerExists) {
        console.debug('[handlePointerDown] ✅ Click is inside layer - no dismissal')
        isPointerInsideDOMTree.value = false
        return
      }

      console.debug('[handlePointerDown] ❌ Click is outside layer - will attempt dismissal')

      if (event.target && !isPointerInsideDOMTree.value) {
        const eventDetail = { originalEvent: event }

        function handleAndDispatchPointerDownOutsideEvent() {
          console.debug('[handlePointerDown] 🚀 DISPATCHING outside event for layer:', {
            layerElement: element?.value,
            layerElementId: element?.value?.id,
            layerElementClass: element?.value?.className,
          })
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
          console.debug('[handlePointerDown] Touch device - deferring to click event')
          ownerDocument.removeEventListener('click', handleClickRef.value)
          handleClickRef.value = handleAndDispatchPointerDownOutsideEvent
          ownerDocument.addEventListener('click', handleClickRef.value, {
            once: true,
          })
        }
        else {
          console.debug('[handlePointerDown] Non-touch device - immediate dispatch')
          handleAndDispatchPointerDownOutsideEvent()
        }
      }
      else {
        // We need to remove the event listener in case the outside click has been canceled.
        // See: https://github.com/radix-ui/primitives/issues/2171
        console.debug('[handlePointerDown] 🛑 Click was inside DOM tree - cleaning up click listener')
        ownerDocument.removeEventListener('click', handleClickRef.value)
      }
      isPointerInsideDOMTree.value = false
      console.debug('[handlePointerDown] === POINTER DOWN EVENT END ===')
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
    if (rootNode.nodeType === Node.DOCUMENT_NODE) {
      return rootNode as Document
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
      const realTarget = composedPath[0] as HTMLElement | undefined
      const target = realTarget || (event.target as HTMLElement | undefined)

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

// Export shadow DOM helper functions for external use if needed
export { closestCrossingBoundaries, querySelectorAllCrossingBoundaries }
