import type { MaybeRefOrGetter, Ref } from 'vue'
import type { OutsideSubscriber } from './layerStack'
import { isClient } from '@vueuse/shared'
import { nextTick, toValue, watchEffect } from 'vue'
import { containsComposed, getActiveElement, handleAndDispatchCustomEvent } from '@/shared'
import { attachDocument, layerElements, registerOutsideSubscriber } from './layerStack'

export type PointerDownOutsideEvent = CustomEvent<{
  originalEvent: PointerEvent
}>
export type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>

export const DISMISSABLE_LAYER_NAME = 'DismissableLayer'
export const POINTER_DOWN_OUTSIDE = 'dismissableLayer.pointerDownOutside'
export const FOCUS_OUTSIDE = 'dismissableLayer.focusOutside'

function isElement(node: unknown): node is Element {
  if (typeof node !== 'object' || node === null)
    return false
  // Compare against the node's own window too, so elements from another
  // realm (e.g. a layer rendered inside an iframe) are recognized
  const ownerWindow = (node as Node).ownerDocument?.defaultView
  return (typeof Element !== 'undefined' && node instanceof Element)
    || (!!ownerWindow && node instanceof ownerWindow.Element)
}

/**
 * The manager's shared listeners live on the top-level document. A layer
 * rendered inside an iframe attaches its own document for as long as it
 * listens; a no-op for the top-level document. Tracks `element`, since the
 * layer is usually not mounted yet when the composable runs.
 */
function useOwnerDocumentListeners(element: Readonly<Ref<HTMLElement | null | undefined>> | undefined, enabled: MaybeRefOrGetter<boolean>) {
  watchEffect((cleanupFn) => {
    if (!isClient || !toValue(enabled))
      return
    const ownerDocument = element?.value?.ownerDocument
    if (ownerDocument)
      cleanupFn(attachDocument(ownerDocument))
  })
}

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
  if (!isElement(targetElement))
    return false

  // Anything inside the layer's own root element is inside the layer. The root
  // can differ from the `[data-dismissable-layer]` element when the layer is
  // rendered `asChild` into a component whose root is not the element that
  // receives its attrs (e.g. `PopperContent`'s wrapper `div`). `FocusScope`
  // resolves the same root as its container and may focus it as a fallback
  // when the content has no tabbable children; that focus must not read as
  // focus-outside and dismiss the layer it belongs to (#2803).
  if (containsComposed(layerElement, targetElement))
    return true

  const mainLayer = (layerElement.dataset.dismissableLayer === ''
    ? layerElement
    : layerElement.querySelector('[data-dismissable-layer]')) ?? layerElement

  // Inside the layer's own subtree (a target in a nested shadow tree counts).
  if (containsComposed(mainLayer, targetElement))
    return true

  // Otherwise the target must sit inside a layer stacked above this one.
  const nodeList = snapshot ?? layerElements()
  const mainIndex = nodeList.indexOf(mainLayer)

  // Another Editable is a sibling, not a layer above this one: focusing or
  // pressing it ends this one's edit (#3047). Unless it sits in a layer (a
  // Dialog, a Popover) that this Editable is not in, which is above it.
  const domTargetLayer = targetElement.closest('[data-dismissable-layer]')
  if (mainLayer.hasAttribute('data-editable-root') && domTargetLayer?.hasAttribute('data-editable-root')) {
    const isInAnotherLayer = nodeList.some(layer => containsComposed(layer, targetElement) && !containsComposed(layer, mainLayer))
    if (!isInAnotherLayer)
      return false
  }

  // An unregistered `mainLayer` (e.g. an Editable, which only subscribes and
  // never registers a `StackLayer`) has no stack index, so fall back to the
  // document-order rule the `querySelectorAll` snapshot used to encode: a layer
  // that FOLLOWS it in the document counts as above it. This keeps an Editable
  // inside a Dialog ending its edit on a click elsewhere in that Dialog.
  if (mainIndex === -1) {
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
  element?: Readonly<Ref<HTMLElement | null | undefined>>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  /**
   * Work held back while a touch press outside is in flight, i.e. between its
   * `pointerdown` and the `click` its `pointerDownOutside` is deferred to. The
   * listeners that end the press live only while one is pending.
   */
  let isTouchPressPending = false
  let heldUntilTouchPressEnds: Array<() => void> = []
  let removePressEndListeners = () => {}

  function endTouchPress() {
    if (!isTouchPressPending)
      return
    isTouchPressPending = false
    removePressEndListeners()
    const held = heldUntilTouchPressEnds
    heldUntilTouchPressEnds = []
    held.forEach(run => run())
  }

  function dropTouchPress() {
    isTouchPressPending = false
    heldUntilTouchPressEnds = []
    removePressEndListeners()
  }

  function startTouchPress(ownerDocument: Document) {
    removePressEndListeners()
    isTouchPressPending = true
    let timerId: number | undefined
    // A press that turns into a scroll or a long press is cancelled instead of
    // clicked, and a press can end without its `click` reaching the document
    // (its propagation stopped): whatever it held back runs then, the latter in
    // the next task so that the deferred `pointerDownOutside` still runs first.
    // The next press ends it too, before anything handles that press.
    const handleClickCapture = () => {
      window.clearTimeout(timerId)
      timerId = window.setTimeout(endTouchPress)
    }
    const handleEnd = () => endTouchPress()
    ownerDocument.addEventListener('click', handleClickCapture, true)
    ownerDocument.addEventListener('pointercancel', handleEnd, true)
    ownerDocument.addEventListener('pointerdown', handleEnd, true)
    removePressEndListeners = () => {
      window.clearTimeout(timerId)
      ownerDocument.removeEventListener('click', handleClickCapture, true)
      ownerDocument.removeEventListener('pointercancel', handleEnd, true)
      ownerDocument.removeEventListener('pointerdown', handleEnd, true)
      removePressEndListeners = () => {}
    }
  }

  /**
   * Runs `callback` once the touch press outside in flight has ended (right away
   * when there is none), after its deferred `pointerDownOutside`.
   *
   * iOS WebKit fires a tap's compatibility mouse events in a later task than its
   * pointer events, and its `mousedown` focuses the tapped button's focusable
   * ancestor. That focus move belongs to the press, so it must not be handled
   * before the press is: with a mouse, `pointerDownOutside` comes first, and a
   * trigger in a focusable container relies on that to close its own layer (#3360).
   */
  function runAfterTouchPress(callback: () => void) {
    if (isTouchPressPending)
      heldUntilTouchPressEnds.push(callback)
    else
      callback()
  }

  const subscriber: OutsideSubscriber = {
    armed: false, // set true a macrotask after registration by the manager
    isPointerInside: false,
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
        if (event.pointerType === 'touch') {
          // Added during this `pointerdown`'s bubble phase, so only a later press ends it.
          startTouchPress(target.ownerDocument ?? globalThis.document)
          ctx.deferTouch(subscriber, () => {
            handleAndDispatchPointerDownOutsideEvent()
            endTouchPress()
          })
        }
        else {
          handleAndDispatchPointerDownOutsideEvent()
        }
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
    const unregister = registerOutsideSubscriber(subscriber)
    cleanupFn(() => {
      unregister()
      // The layer is gone or no longer listening: drop what the press held back.
      dropTouchPress()
    })
  })
  useOwnerDocumentListeners(element, enabled)

  return {
    onPointerDownCapture: () => {
      if (!toValue(enabled))
        return
      subscriber.isPointerInside = true
    },
    runAfterTouchPress,
  }
}

/**
 * Whether focus is inside `element`. It takes both: the active element can't see into
 * a closed shadow root, so a layer rendered in one reads as outside, and `:focus-within`
 * follows the flat tree through those, but doesn't match while an iframe inside
 * `element` holds focus, where the active element is that iframe.
 */
function isFocusWithin(element: HTMLElement) {
  return containsComposed(element, getActiveElement(element)) || element.matches(':focus-within')
}

/**
 * Listens for when focus happens outside a DOM subtree.
 */
export function useFocusOutside(
  onFocusOutside?: (event: FocusOutsideEvent) => void,
  element?: Readonly<Ref<HTMLElement | null | undefined>>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const subscriber: OutsideSubscriber = {
    // Focus has NO arming today (the `focusin` listener attaches synchronously),
    // so a focus subscriber is always "armed" and must never gate on it.
    armed: true,
    isPointerInside: false,
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

      // Focus may have come back inside during the ticks above (a focus trap's
      // recall). Read it from the document: a flag kept by focus and blur capture
      // listeners on the element goes stale, because Vue skips an invoker attached
      // in the millisecond of the event's first invoker.
      if (!isFocusWithin(element.value)) {
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
  useOwnerDocumentListeners(element, enabled)
}

let pressedTrigger: Element | undefined
let endTrackedPress = () => {}

/**
 * Records a primary-button press on a trigger, from its `pointerdown` until the
 * task after its `click` (or `pointercancel`, or the next press). WebKit does not
 * focus a pressed button but its focusable ancestor, so a layer uses this to tell
 * that focus move apart from focus moving on its own (#3360).
 */
export function trackTriggerPress(event: PointerEvent) {
  endTrackedPress()
  const trigger = event.currentTarget as Element | null
  if (!isClient || !trigger || event.button !== 0)
    return
  const ownerDocument = trigger.ownerDocument
  let timerId: number | undefined
  // Kept until the next task, so a focus move handled during the `click` (e.g. one
  // a layer held back until it) still counts as part of the press.
  function handleEnd() {
    removeListeners()
    timerId = window.setTimeout(release)
  }
  function removeListeners() {
    ownerDocument.removeEventListener('click', handleEnd, true)
    ownerDocument.removeEventListener('pointercancel', handleEnd, true)
    ownerDocument.removeEventListener('pointerdown', release, true)
  }
  function release() {
    window.clearTimeout(timerId)
    removeListeners()
    if (pressedTrigger === trigger)
      pressedTrigger = undefined
    endTrackedPress = () => {}
  }
  ownerDocument.addEventListener('click', handleEnd, true)
  ownerDocument.addEventListener('pointercancel', handleEnd, true)
  // Added while this `pointerdown` is past the document, so only a later press ends it.
  ownerDocument.addEventListener('pointerdown', release, true)
  pressedTrigger = trigger
  endTrackedPress = release
}

/** Whether a press tracked by `trackTriggerPress` on `trigger` is in flight. */
export function isTriggerPressInFlight(trigger: Element | undefined | null) {
  return !!trigger && pressedTrigger === trigger
}
