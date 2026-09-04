import type { MaybeRefOrGetter, Ref } from 'vue'
import type { OutsideSubscriber } from './layerStack'
import { isClient } from '@vueuse/shared'
import { nextTick, toValue, watchEffect } from 'vue'
import { containsComposed, handleAndDispatchCustomEvent } from '@/shared'
import { layerElements, registerOutsideSubscriber } from './layerStack'

export type PointerDownOutsideEvent = CustomEvent<{
  originalEvent: PointerEvent
}>
export type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>

export const DISMISSABLE_LAYER_NAME = 'DismissableLayer'
export const POINTER_DOWN_OUTSIDE = 'dismissableLayer.pointerDownOutside'
export const FOCUS_OUTSIDE = 'dismissableLayer.focusOutside'

/**
 * Whether `targetElement` counts as "inside" `layerElement`: within its own
 * subtree, or within a layer stacked ABOVE it. Stack order comes from the
 * manager's `layers` registry (see `layerElements`) rather than a document-wide
 * `querySelectorAll`, so layers rendered inside shadow roots order like
 * light-DOM ones; containment is composed for the same reason.
 */
export function isLayerExist(
  layerElement: HTMLElement,
  targetElement: HTMLElement,
  // Optional pre-computed `layerElements()` snapshot. The manager builds ONE per
  // pointerdown event and passes it here so N subscribers share it (the
  // synchronous pointer path — see layerStack). Omitted (focus path / direct
  // callers) → the live registry is read.
  snapshot?: Element[],
) {
  if (!(targetElement instanceof Element))
    return false

  const mainLayer = (layerElement.dataset.dismissableLayer === ''
    ? layerElement
    : layerElement.querySelector('[data-dismissable-layer]')) ?? layerElement

  // Inside the layer's own subtree (a target in a nested shadow tree counts).
  if (containsComposed(mainLayer, targetElement))
    return true

  // Otherwise the target must sit inside a layer stacked above this one.
  const nodeList = snapshot ?? layerElements()
  const mainIndex = nodeList.indexOf(mainLayer)

  // An unregistered `mainLayer` (e.g. an Editable, which only subscribes and
  // never registers a `StackLayer`) has no stack index, so fall back to the
  // document-order rule the `querySelectorAll` snapshot used to encode: a layer
  // that FOLLOWS it in the document counts as above it. This keeps an Editable
  // inside a Dialog ending its edit on a click elsewhere in that Dialog.
  if (mainIndex === -1) {
    const domTargetLayer = targetElement.closest('[data-dismissable-layer]')
    return !!domTargetLayer
      && !!(mainLayer.compareDocumentPosition(domTargetLayer) & Node.DOCUMENT_POSITION_FOLLOWING)
  }

  const targetLayer = closestStackLayer(targetElement, nodeList)
  return !!targetLayer && mainIndex < nodeList.indexOf(targetLayer)
}

/** Nearest composed ancestor of `node` (inclusive) that is one of `nodeList`. */
function closestStackLayer(node: Node, nodeList: Element[]): Element | null {
  const members = new Set<Node>(nodeList)
  let current: Node | null = node
  while (current) {
    if (members.has(current))
      return current as Element
    // Cross a shadow boundary: a shadow root has no parent, but a host.
    current = current.parentNode ?? (current as ShadowRoot).host ?? null
  }
  return null
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
  const subscriber: OutsideSubscriber = {
    armed: false, // set true a macrotask after registration by the manager
    isPointerInside: false,
    isFocusInside: false,
    // Ported from the previous `handlePointerDown` body, branch-for-branch.
    handlePointerDown: (event, ctx) => {
      // Arming guard MUST be first — before any flag write. During the arming
      // window the whole body is skipped, so `isPointerInside` (set by the
      // capture handler) survives until the next post-arming event.
      if (!subscriber.armed)
        return

      const target = ctx.target as HTMLElement | null
      if (!element?.value || !target)
        return

      if (isLayerExist(element.value, target, ctx.nodeList)) {
        // A touch `pointerdown` outside defers the dispatch to the next `click`,
        // which never comes when the tap becomes a scroll/drag. Drop the stale
        // deferral here so the next tap inside this layer (or a layer above it)
        // cannot trigger it (mirrors Radix's inside-tree branch,
        // radix-ui/primitives#2171).
        ctx.cancelTouch(subscriber)
        subscriber.isPointerInside = false
        return
      }

      if (!subscriber.isPointerInside) {
        const eventDetail = { originalEvent: event }

        function handleAndDispatchPointerDownOutsideEvent() {
          handleAndDispatchCustomEvent(
            POINTER_DOWN_OUTSIDE,
            onPointerDownOutside,
            eventDetail,
            target,
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
         * `deferTouch` replaces the previous pending dispatch (= the "continuously
         * remove the previous listener" behavior) via the manager's shared click listener.
         */
        if (event.pointerType === 'touch')
          ctx.deferTouch(subscriber, handleAndDispatchPointerDownOutsideEvent)
        else
          handleAndDispatchPointerDownOutsideEvent()
      }
      else {
        // Cancel a pending deferred dispatch when the outside click was canceled.
        // See: https://github.com/radix-ui/primitives/issues/2171
        ctx.cancelTouch(subscriber)
      }
      subscriber.isPointerInside = false
    },
  }

  watchEffect((cleanupFn) => {
    if (!isClient || !toValue(enabled))
      return
    cleanupFn(registerOutsideSubscriber(subscriber))
  })

  return {
    onPointerDownCapture: () => {
      if (!toValue(enabled))
        return
      subscriber.isPointerInside = true
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
  const subscriber: OutsideSubscriber = {
    // Focus has NO arming today (the `focusin` listener attaches synchronously),
    // so a focus subscriber is always "armed" and must never gate on it.
    armed: true,
    isPointerInside: false,
    isFocusInside: false,
    // Ported from the previous `handleFocus` body. Keeps the double `nextTick`
    // so focus-driven DOM updates settle before the gate reads. Uses the
    // composed `ctx.target` (captured synchronously by the manager) but a FRESH
    // `isLayerExist` registry read AFTER the awaits — the stack may have
    // changed, and a stale snapshot would diverge from today's behavior.
    handleFocus: async (event, ctx) => {
      if (!element?.value)
        return

      await nextTick()
      await nextTick()
      const target = ctx.target as HTMLElement | null
      if (!element.value || !target || isLayerExist(element.value, target))
        return

      if (!subscriber.isFocusInside) {
        const eventDetail = { originalEvent: event }
        handleAndDispatchCustomEvent(
          FOCUS_OUTSIDE,
          onFocusOutside,
          eventDetail,
          target,
        )
      }
    },
  }

  watchEffect((cleanupFn) => {
    if (!isClient || !toValue(enabled))
      return
    cleanupFn(registerOutsideSubscriber(subscriber))
  })

  return {
    onFocusCapture: () => {
      if (!toValue(enabled))
        return

      subscriber.isFocusInside = true
    },
    onBlurCapture: () => {
      if (!toValue(enabled))
        return

      subscriber.isFocusInside = false
    },
  }
}
