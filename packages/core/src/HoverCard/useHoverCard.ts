import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { HoverCardOpenChangeReason, HoverCardRootContext } from './HoverCardRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import { computed, ref, toValue } from 'vue'
import { createPartSurface, disclosureState, useControllableState } from '@/shared'
import { excludeTouch } from './utils'

// =============================================================================
// Headless composable for the HoverCard (overlay) family — issue #2723.
//
// Follows the overlay contract validated on Menu and applied to Dialog/Popover:
// the root renders NO attrs (`HoverCardRoot` is `<PopperRoot><slot/></PopperRoot>`),
// so `useHoverCard()` returns state + the context object the SFC provides, and
// the surfaces begin at Trigger / Content. Both parts derive purely from the
// root context, so the builders are idempotent `get<Part>Surface(context)`
// derivations — the SFCs (which inject the context) and `useHoverCard()` share
// ONE derivation each. What differs from Popover is the model: every open and
// close is DEFERRED by `openDelay` / `closeDelay`, so the timers — not the
// handlers — are what finally call `setState`, carrying the reason and event
// of the interaction that started them (#2828).
//
// Positioning (`PopperAnchor` / `PopperContent`), `Presence`, the portal, the
// grace area (`useGraceArea`), text-selection containment, the tabbable
// neutralisation, the scroll dismissal and `DismissableLayer` stay wrappers /
// mount-bound code in the SFCs.
// =============================================================================

/** Semantic state of the trigger part; `state` → `data-state="open|closed"`. */
export type HoverCardTriggerState = { state: DisclosureState }
/** Semantic state of the content part; `state` → `data-state="open|closed"`. */
export type HoverCardContentState = { state: DisclosureState }

/**
 * Deferred half of the trigger's `pointerleave`: runs a tick later so the
 * grace area (`HoverCardContentImpl`) has had its own `pointerleave` first.
 * While open, leaving the trigger is the grace area's business — this only
 * cancels a pending delayed open (`onClose` clears the open timer; the
 * scheduled `setState(false)` is a no-op on an already-closed card).
 */
function cancelPendingOpenOnLeave(context: HoverCardRootContext, event: PointerEvent) {
  if (!context.isPointerInTransitRef.value && !context.open.value)
    context.onClose('trigger-leave', event)
}

/**
 * The trigger surface, derived purely from the root context — the single
 * derivation shared by `useHoverCard().trigger` and `HoverCardTrigger.vue`.
 *
 * `data-grace-area-trigger` lives in `props`, not `state`: it is a functional
 * selector (`useGraceArea` reads `closest('[data-grace-area-trigger]')` to end
 * one card's grace area when the pointer reaches another card's trigger), not
 * semantic state — the recipe's one exemption from the no-`data-*` rule.
 * `pointerenter` / `pointerleave` ignore touch pointers (`excludeTouch`);
 * `pointerup` is the touch toggle behind `enableTouch`.
 */
export function getHoverCardTriggerSurface(context: HoverCardRootContext): PartSurface<HoverCardTriggerState> {
  return createPartSurface<HoverCardTriggerState>(
    () => ({
      'data-grace-area-trigger': '',
      'onPointerenter': excludeTouch((event: PointerEvent) => context.onOpen('trigger-hover', event)),
      'onPointerleave': excludeTouch((event: PointerEvent) => {
        setTimeout(cancelPendingOpenOnLeave, 0, context, event)
      }),
      'onPointerup': (event: PointerEvent) => {
        if (!context.enableTouch.value || event.pointerType !== 'touch')
          return

        if (context.open.value)
          context.onDismiss('trigger-press', event)
        else
          context.onOpenChange(true, 'trigger-press', event)
      },
      'onFocus': (event: FocusEvent) => context.onOpen('trigger-focus', event),
      'onBlur': (event: FocusEvent) => context.onClose('trigger-blur', event),
    }),
    () => ({ state: disclosureState(context.open.value) }),
  )
}

/**
 * The content surface, derived purely from the root context — shared by
 * `useHoverCard().content` and `HoverCardContentImpl.vue`. State only
 * (`data-state`): the hover card has no ids or roles, and the grace area,
 * selection containment, `--reka-hover-card-*` CSS variables and
 * `DismissableLayer` wrapper stay in the SFC.
 */
export function getHoverCardContentSurface(context: HoverCardRootContext): PartSurface<HoverCardContentState> {
  return createPartSurface<HoverCardContentState>(
    () => ({}),
    () => ({ state: disclosureState(context.open.value) }),
  )
}

export interface UseHoverCardProps {
  /**
   * Controlled open state. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  open?: MaybeRefOrGetter<boolean | undefined>
  /** Initial open state when uncontrolled. @defaultValue `false` */
  defaultOpen?: boolean
  /** Delay (ms) from hover/focus of the trigger until the card opens. @defaultValue `700` */
  openDelay?: MaybeRefOrGetter<number | undefined>
  /** Delay (ms) from leaving the trigger or content until the card closes. @defaultValue `300` */
  closeDelay?: MaybeRefOrGetter<number | undefined>
  /**
   * When `true`, a touch tap on the trigger toggles the card. By default touch
   * pointers are ignored to match pointer-hover semantics. @defaultValue `false`
   */
  enableTouch?: MaybeRefOrGetter<boolean | undefined>
  /** Component `emit`; receives `beforeUpdate:open` then `update:open`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: boolean, details: ChangeEventDetails<HoverCardOpenChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: boolean, details: ChangeEventDetails<HoverCardOpenChangeReason>) => void
}

export interface UseHoverCardReturn {
  open: ComputedRef<boolean>
  /** Sets `open` immediately. Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenChange: (value: boolean, reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /**
   * Cancels a pending close and opens after `openDelay`. The change is deferred,
   * so its outcome is only known when the timer fires; `reason`/`event` travel
   * with it into `beforeUpdate:open` / `update:open`.
   */
  onOpen: (reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event) => void
  /**
   * Cancels a pending open and closes after `closeDelay`, unless text is being
   * selected (`hasSelectionRef`) or the pointer is down on the content
   * (`isPointerDownOnContentRef`). Deferred like `onOpen`.
   */
  onClose: (reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event) => void
  /** Cancels a pending open and closes immediately. Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onDismiss: (reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Details of the last change attempt; initially `{ reason: 'none' }`. */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<HoverCardOpenChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** `data-grace-area-trigger` + the hover/leave/touch/focus/blur listeners. */
  trigger: PartSurface<HoverCardTriggerState>
  /** State only (`data-state`). */
  content: PartSurface<HoverCardContentState>
  /** The `HoverCardRootContext` value — the SFC provides this verbatim. */
  context: HoverCardRootContext
}

/**
 * Headless HoverCard logic. The `.vue` shells compose this; a standalone
 * consumer gets the delayed open/close model (with `beforeUpdate`/`update`
 * details), the trigger listeners and `data-state`, but must still wrap the
 * content in `Presence`, `DismissableLayer` and `PopperContent` (and the
 * trigger in `PopperAnchor`) and compose `useGraceArea` for the pointer-transit
 * grace — those are component families / mount-bound behaviours a pure
 * composable cannot absorb (see the #2723 recipe's "Overlay families").
 * Dismissal reasons (`escape-key`, `outside-press`) therefore arrive through
 * `onDismiss(reason, event)` from whatever layer the consumer composes.
 *
 * SSR-safe: no `document`/`window` at call scope — the `window.setTimeout`
 * calls only run inside `onOpen` / `onClose`, i.e. from browser events. No
 * lifecycle hooks, so it is callable outside `setup()`; pending timers are
 * cancelled by the next `onOpen` / `onClose` / `onDismiss`, not on unmount —
 * a stray timer only reaches `setState`, which the consumer can veto.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useHoverCard(props: UseHoverCardProps = {}): UseHoverCardReturn {
  // Every write to `open` — the delayed hover/focus timers, the touch toggle
  // and dismiss — goes through one `setState`, so `beforeUpdate:open` can
  // cancel any of them and `update:open` always carries the reason (#2828).
  // The timers capture the reason and event of the interaction that started
  // them: `setTimeout(setState, delay, value, reason, event)` (no closure —
  // `e18e/prefer-timer-args`).
  const { state: open, setState, lastChangeDetails, isControlled } = useControllableState<boolean, HoverCardOpenChangeReason>({
    prop: props.open,
    defaultValue: props.defaultOpen ?? false,
    name: 'open',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const openDelay = computed<number>(() => toValue(props.openDelay) ?? 700)
  const closeDelay = computed<number>(() => toValue(props.closeDelay) ?? 300)
  const enableTouch = computed<boolean>(() => toValue(props.enableTouch) ?? false)

  let openTimer = 0
  let closeTimer = 0
  const hasSelectionRef = ref(false)
  const isPointerDownOnContentRef = ref(false)
  const isPointerInTransitRef = ref(false)
  const triggerElement = ref<HTMLElement>()

  function onOpenChange(value: boolean, reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event): boolean {
    return setState(value, reason, event)
  }

  function onOpen(reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event) {
    clearTimeout(closeTimer)
    openTimer = window.setTimeout(setState, openDelay.value, true, reason, event)
  }

  function onClose(reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event) {
    clearTimeout(openTimer)
    if (!hasSelectionRef.value && !isPointerDownOnContentRef.value)
      closeTimer = window.setTimeout(setState, closeDelay.value, false, reason, event)
  }

  function onDismiss(reason?: HoverCardOpenChangeReason | BaseChangeReason, event?: Event): boolean {
    clearTimeout(openTimer)
    return setState(false, reason, event)
  }

  const context: HoverCardRootContext = {
    open,
    onOpenChange,
    onOpen,
    onClose,
    onDismiss,
    hasSelectionRef,
    isPointerDownOnContentRef,
    isPointerInTransitRef,
    triggerElement,
    enableTouch: enableTouch as Ref<boolean>,
  }

  return {
    open,
    onOpenChange,
    onOpen,
    onClose,
    onDismiss,
    lastChangeDetails,
    isControlled,
    trigger: getHoverCardTriggerSurface(context),
    content: getHoverCardContentSurface(context),
    context,
  }
}
