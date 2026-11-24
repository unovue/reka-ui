import type { MaybeRefOrGetter, Ref } from 'vue'
import { isClient } from '@vueuse/shared'
import { nextTick, ref, toValue, watchEffect } from 'vue'
import { handleAndDispatchCustomEvent } from '@/shared'
import { context } from './context'

export type PointerDownOutsideEvent = CustomEvent<{
  originalEvent: PointerEvent
}>
export type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>

export const DISMISSABLE_LAYER_NAME = 'DismissableLayer'
export const CONTEXT_UPDATE = 'dismissableLayer.update'
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

export function isLayerExist(layerElement: HTMLElement, targetElement: HTMLElement) {
  if (!isElement(targetElement))
    return false

  // Anything inside the layer's own root element is inside the layer. The root
  // can differ from the `[data-dismissable-layer]` element when the layer is
  // rendered `asChild` into a component whose root is not the element that
  // receives its attrs (e.g. `PopperContent`'s wrapper `div`). `FocusScope`
  // resolves the same root as its container and may focus it as a fallback
  // when the content has no tabbable children; that focus must not read as
  // focus-outside and dismiss the layer it belongs to (#2803).
  if (layerElement.contains(targetElement))
    return true

  const targetLayer = targetElement.closest(
    '[data-dismissable-layer]',
  )

  const mainLayer = layerElement.dataset.dismissableLayer === ''
    ? layerElement
    : layerElement.querySelector(
      '[data-dismissable-layer]',
    ) as HTMLElement

  if (mainLayer?.hasAttribute('data-editable-root') && targetLayer?.hasAttribute('data-editable-root')) {
    const isInAnotherLayer = [...context.layersRoot].some(layer => layer.contains(targetElement) && !layer.contains(layerElement))

    if (!isInAnotherLayer)
      return false
  }

  const nodeList = Array.from(
    layerElement.ownerDocument.querySelectorAll('[data-dismissable-layer]'),
  )

  if (targetLayer && (mainLayer === targetLayer || nodeList.indexOf(mainLayer) < nodeList.indexOf(targetLayer))) {
    return true
  }
  else {
    return false
  }
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
  isPointerEventsEnabled: () => boolean = () => true,
) {
  const isPointerInsideDOMTree = ref(false)
  const handleClickRef = ref(() => {})
  const pointerEventsEnabled = new WeakMap<PointerEvent, boolean>()

  /**
   * Work held back while a touch press outside is in flight, i.e. between its
   * `pointerdown` and the `click` its `pointerDownOutside` is deferred to.
   */
  let isTouchPressPending = false
  let heldUntilTouchPressEnds: Array<() => void> = []
  let removeStoppedClickListener = () => {}

  function endTouchPress() {
    isTouchPressPending = false
    removeStoppedClickListener()
    const held = heldUntilTouchPressEnds
    heldUntilTouchPressEnds = []
    held.forEach(run => run())
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

  watchEffect((cleanupFn) => {
    if (!isClient || !toValue(enabled))
      return
    // Resolved inside the effect so it tracks `element`: the layer is usually
    // not mounted yet when this composable runs, and listening on the global
    // `document` would miss events from a layer rendered inside an iframe.
    const ownerDocument = element?.value?.ownerDocument ?? globalThis.document
    // A press that turns into a scroll or a long press is cancelled instead of
    // clicked: whatever it held back runs then.
    const handlePointerCancel = () => endTouchPress()
    const handlePointerDownCapture = (event: PointerEvent) => {
      // Whatever a previous press still held back runs before a new press starts,
      // even if that press ended without a `click` or `pointercancel` reaching us.
      if (isTouchPressPending)
        endTouchPress()
      // Opening another layer in a target handler must not change eligibility
      // for the same event when it reaches the document's bubble listener.
      pointerEventsEnabled.set(event, isPointerEventsEnabled())
    }
    const handlePointerDown = async (event: PointerEvent) => {
      const target = event.target as HTMLElement | undefined

      if (!element?.value || !target)
        return

      if (!(pointerEventsEnabled.get(event) ?? isPointerEventsEnabled())) {
        ownerDocument.removeEventListener('click', handleClickRef.value)
        isPointerInsideDOMTree.value = false
        return
      }

      if (isLayerExist(element.value, target)) {
        // A touch `pointerdown` outside arms a one-shot `click` listener that
        // never fires when the tap becomes a scroll/drag. Drop it here so the
        // next tap inside a layer cannot trigger the stale dismissal (mirrors
        // Radix's inside-tree branch, radix-ui/primitives#2171).
        ownerDocument.removeEventListener('click', handleClickRef.value)
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
          handleClickRef.value = () => {
            handleAndDispatchPointerDownOutsideEvent()
            endTouchPress()
          }
          ownerDocument.addEventListener('click', handleClickRef.value, {
            once: true,
          })
          isTouchPressPending = true
          // A `click` whose propagation is stopped before it reaches the document
          // still ends the press, in the next task so the listener above, when it
          // does run, keeps handling `pointerDownOutside` first.
          removeStoppedClickListener()
          let timerId: number | undefined
          const handleClickCapture = () => {
            timerId = window.setTimeout(endTouchPress)
          }
          ownerDocument.addEventListener('click', handleClickCapture, true)
          removeStoppedClickListener = () => {
            window.clearTimeout(timerId)
            ownerDocument.removeEventListener('click', handleClickCapture, true)
            removeStoppedClickListener = () => {}
          }
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
      ownerDocument.addEventListener('pointerdown', handlePointerDownCapture, true)
      ownerDocument.addEventListener('pointerdown', handlePointerDown)
      ownerDocument.addEventListener('pointercancel', handlePointerCancel, true)
    }, 0)

    cleanupFn(() => {
      window.clearTimeout(timerId)
      ownerDocument.removeEventListener('pointerdown', handlePointerDownCapture, true)
      ownerDocument.removeEventListener('pointerdown', handlePointerDown)
      ownerDocument.removeEventListener('pointercancel', handlePointerCancel, true)
      ownerDocument.removeEventListener('click', handleClickRef.value)
      // The layer is gone or no longer listening: drop what the press held back.
      isTouchPressPending = false
      heldUntilTouchPressEnds = []
      removeStoppedClickListener()
    })
  })

  return {
    onPointerDownCapture: () => {
      if (!toValue(enabled))
        return
      isPointerInsideDOMTree.value = true
    },
    runAfterTouchPress,
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
  const isFocusInsideDOMTree = ref(false)
  watchEffect((cleanupFn) => {
    if (!isClient || !toValue(enabled))
      return
    // See `usePointerDownOutside`: resolved inside the effect to track `element`.
    const ownerDocument = element?.value?.ownerDocument ?? globalThis.document
    const handleFocus = async (event: FocusEvent) => {
      if (!element?.value)
        return

      await nextTick()
      await nextTick()
      const target = event.target as HTMLElement | undefined
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

export function dispatchUpdate() {
  const event = new CustomEvent(CONTEXT_UPDATE)
  document.dispatchEvent(event)
}
