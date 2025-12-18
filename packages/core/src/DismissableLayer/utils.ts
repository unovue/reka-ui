import type { MaybeRefOrGetter, Ref } from 'vue'
import { isClient } from '@vueuse/shared'
import { nextTick, ref, toValue, watchEffect } from 'vue'
import { debugLog, elSummary, getActiveElement, handleAndDispatchCustomEvent, rootKind } from '@/shared'

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
  debugLog('dl', 'isLayerExist:start', {
    layer: elSummary(layerElement),
    target: elSummary(targetElement),
    layerRoot: rootKind(layerElement.getRootNode()),
    targetRoot: rootKind(targetElement.getRootNode()),
  })
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
    // No layer under the target in the event's composed path.
    // Determine if this layer is the topmost within its own root
    // (Document or ShadowRoot). Only the topmost layer should handle
    // the outside interaction; lower layers should ignore it and wait
    // for subsequent interactions.
    const layerRoot = layerElement.getRootNode()
    let nodeList: HTMLElement[] = []
    if (
      layerRoot instanceof Document
      || layerRoot instanceof ShadowRoot
      || layerRoot instanceof DocumentFragment
    ) {
      nodeList = Array.from(
        (layerRoot as Document | ShadowRoot | DocumentFragment).querySelectorAll?.(
          '[data-dismissable-layer]',
        ) ?? [],
      ) as HTMLElement[]
    }
    else {
      nodeList = Array.from(
        layerElement.ownerDocument.querySelectorAll('[data-dismissable-layer]'),
      ) as HTMLElement[]
    }

    const topmostLayer = nodeList[nodeList.length - 1]
    const isTopmostLayer = mainLayer === topmostLayer
    debugLog('dl', 'isLayerExist:no-target-layer', {
      layersInRoot: nodeList.map(elSummary),
      main: elSummary(mainLayer),
      topmost: elSummary(topmostLayer),
      isTopmostLayer,
      decision: isTopmostLayer ? 'outside(false)' : 'inside(true)',
    })
    // When this layer is not the topmost, treat as inside (return true)
    // so a higher layer handles the outside event. If it is the topmost,
    // treat as outside (false).
    return !isTopmostLayer
  }

  // If target layer is the same as main layer, target is inside
  if (mainLayer === targetLayer) {
    debugLog('dl', 'isLayerExist:target-is-main (inside)', {
      main: elSummary(mainLayer),
      targetLayer: elSummary(targetLayer),
    })
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
    debugLog('dl', 'isLayerExist:different-roots (treat as outside for this layer)', {
      layerRoot: rootKind(layerRoot),
      targetRoot: rootKind(targetRoot),
    })
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

  const inside = (
    mainLayerIndex >= 0
    && targetLayerIndex >= 0
    && mainLayerIndex < targetLayerIndex
  )
  debugLog('dl', 'isLayerExist:indices', {
    mainIndex: mainLayerIndex,
    targetIndex: targetLayerIndex,
    inside,
  })
  return inside
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

      // Fast path: if the click is within this layer's subtree, it's not outside.
      // Using contains is robust with Teleport and ShadowRoot when within the same root.
      if ((element.value as HTMLElement).contains(target)) {
        debugLog('dl', 'pointerdown:inside-fast-path', {
          layer: elSummary(element.value),
          target: elSummary(target),
          root: rootKind(element.value.getRootNode()),
        })
        isPointerInsideDOMTree.value = false
        return
      }

      const layerExists = isLayerExist(element.value, target)
      debugLog('dl', 'pointerdown:layer-exist-check', {
        layer: elSummary(element.value),
        target: elSummary(target),
        layerExists,
      })

      if (layerExists) {
        isPointerInsideDOMTree.value = false
        return
      }

      if (event.target && !isPointerInsideDOMTree.value) {
        const eventDetail = { originalEvent: event }

        function handleAndDispatchPointerDownOutsideEvent() {
          debugLog('dl', 'pointerdown:DISPATCH outside', {
            pointerType: event.pointerType,
            target: elSummary(target),
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
        debugLog('dl', 'pointerdown:remove pending click listener (canceled)')
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
  const getEventRoot = (): Document | (ShadowRoot | DocumentFragment) => {
    const el = element?.value
    const root = el?.getRootNode()
    // Prefer ShadowRoot; also treat shadow-like DocumentFragment with `host`
    if (root instanceof Document)
      return root
    if ((typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot) || (root instanceof DocumentFragment && (root as any).host))
      return root as ShadowRoot | DocumentFragment
    return (globalThis?.document as Document)
  }

  const isFocusInsideDOMTree = ref(false)
  const ignoreFocusOutsideUntil = ref(0)
  watchEffect((cleanupFn) => {
    if (!isClient || !toValue(enabled))
      return
    const handleFocus = async (event: FocusEvent) => {
      if (!element?.value)
        return

      await nextTick()
      await nextTick()

      // Use composedPath for focus events too
      const composedPath = event.composedPath?.()
      const first = composedPath && composedPath.length > 0 ? composedPath[0] : undefined
      const target
        = first instanceof HTMLElement
          ? first
          : event.target instanceof HTMLElement
            ? event.target
            : undefined

      if (!element.value || !target)
        return

      // Fast path: if focus moved within this layer's subtree, it's not outside.
      if (element.value.contains(target)) {
        debugLog('focus', 'focusin:inside-fast-path', {
          layer: elSummary(element.value),
          target: elSummary(target),
          root: rootKind(element.value.getRootNode()),
        })
        return
      }

      // Additional guard 1: if a pointerdown just occurred inside this layer,
      // ignore the immediate subsequent focusout (common when clicking non-focusable areas).
      if (Date.now() < ignoreFocusOutsideUntil.value) {
        debugLog('focus', 'focusin:ignore due to recent pointerdown inside', {
          layer: elSummary(element.value),
          target: elSummary(target),
        })
        return
      }

      // Additional guard 2: if the currently active element is still inside this layer,
      // do not treat as outside. This avoids false positives when focus events retarget
      // across shadow boundaries (e.g., host gets focus but deepest active remains inside).
      const active = getActiveElement()
      if (active && active instanceof HTMLElement && element.value.contains(active)) {
        debugLog('focus', 'focusin:active-element-inside-guard', {
          layer: elSummary(element.value),
          active: elSummary(active),
        })
        return
      }

      if (isLayerExist(element.value, target)) {
        debugLog('focus', 'focusin:layer-exist (treat as inside)', {
          layer: elSummary(element.value),
          target: elSummary(target),
        })
        return
      }

      if (event.target && !isFocusInsideDOMTree.value) {
        const eventDetail = { originalEvent: event }
        debugLog('focus', 'focusin:DISPATCH outside', {
          layer: elSummary(element.value),
          target: elSummary(target),
        })
        handleAndDispatchCustomEvent(
          FOCUS_OUTSIDE,
          onFocusOutside,
          eventDetail,
        )
      }
    }

    const root = getEventRoot()
    const listener: EventListener = ev => handleFocus(ev as FocusEvent)
    root.addEventListener('focusin', listener)

    // Track pointerdown inside to suppress focus outside dispatch shortly after
    const pointerListener: EventListener = (ev) => {
      const e = ev as PointerEvent
      const path = e.composedPath?.()
      const first = path && path.length > 0 ? path[0] : undefined
      const tgt
        = first instanceof HTMLElement
          ? first
          : e.target instanceof HTMLElement
            ? e.target
            : undefined
      if (!element?.value || !tgt)
        return
      if (element.value.contains(tgt)) {
        ignoreFocusOutsideUntil.value = Date.now() + 250
        debugLog('focus', 'pointerdown:mark to ignore focusout window', {
          layer: elSummary(element.value),
          target: elSummary(tgt),
          until: ignoreFocusOutsideUntil.value,
        })
      }
    }
    root.addEventListener('pointerdown', pointerListener, { capture: true })

    cleanupFn(() => {
      const r = getEventRoot()
      r.removeEventListener('focusin', listener)
      r.removeEventListener('pointerdown', pointerListener, { capture: true } as any)
    })
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
