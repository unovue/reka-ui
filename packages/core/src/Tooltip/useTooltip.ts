import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { TooltipContext, TooltipOpenChangeReason } from './TooltipRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import { useTimeoutFn } from '@vueuse/core'
import { computed, ref, toValue, watch } from 'vue'
import { createPartSurface, disclosureState, useControllableState } from '@/shared'

// =============================================================================
// Headless composable for the Tooltip (overlay) family — issue #2723.
//
// Follows the overlay contract validated on Menu: the root renders NO attrs
// (`TooltipRoot` is `<PopperRoot><slot/></PopperRoot>`), so `useTooltip()`
// returns state + the context object the SFC provides, and the surfaces begin
// at Trigger / Content. The content and label surfaces are pure
// `get<Part>Surface(context)` derivations (idempotent, shared by the SFCs and
// `useTooltip()`); the trigger is a context-scoped FACTORY
// (`createTooltipTriggerSurface`) because it owns per-instance pointer state —
// the Menu axiom that pure builders don't survive overlays.
//
// The provider coupling stays in the shell: `TooltipRoot.vue` resolves the
// `TooltipProvider` fallbacks (delay, skip-delay, grace-area transit, …) into
// getters and hands them in, and keeps the `watch(open)` that notifies the
// provider and dispatches `TOOLTIP_OPEN`. `PopperAnchor` / `PopperContent`,
// `Presence`, `DismissableLayer`, the portal, the grace area
// (`TooltipContentHoverable`) and the scroll / `TOOLTIP_OPEN` listeners stay
// wrappers.
// =============================================================================

/**
 * Semantic state of the trigger part; `state` → `data-state="open|closed"`,
 * `delayed` → `data-delayed=""` only while `true` (#2823: the disclosure axis
 * and the "delayed" qualifier are two attributes, not one value).
 */
export type TooltipTriggerState = { state: DisclosureState, delayed: boolean }
/** Semantic state of the content part; same two axes as the trigger. */
export type TooltipContentState = { state: DisclosureState, delayed: boolean }

/** Standalone `useTooltip()` calls without a `baseId` draw `reka-tooltip-<n>` from here. */
let tooltipCount = 0

/**
 * The trigger surface: `aria-describedby` (the content id, only while open),
 * the `data-grace-area-trigger` selector `useGraceArea` scopes its
 * `closest()` lookup with (a functional selector, not semantic state — hence
 * in `props`), and the pointer / focus / click listeners that drive the open
 * model — none of them while `disabled`.
 *
 * A context-SCOPED FACTORY (recipe: "Overlay families"): it owns the
 * per-instance `isPointerDown` / `hasPointerMoveOpened` refs, so call it
 * EXACTLY ONCE per trigger instance — `useTooltip()` does for its own
 * `trigger`, `TooltipTrigger.vue` does for the rendered one. `get<...>` is
 * reserved for the pure builders.
 *
 * Handler bodies are ported verbatim from the pre-#2723 `TooltipTrigger.vue`:
 * touch pointers never open (the tooltip has no touch affordance), a
 * `pointermove` opens once until the pointer leaves and never while the
 * provider's grace area reports the pointer in transit, focus is ignored
 * while the pointer is down (a click's focus is not a keyboard focus) and,
 * with `ignoreNonKeyboardFocus`, unless the trigger matches `:focus-visible`;
 * `pointerdown` / `click` close unless `disableClosingTrigger`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure — no hooks; the `pointerup` listener is attached to
 * `document` only from inside `onPointerdown`, never at call scope.
 */
export function createTooltipTriggerSurface(context: TooltipContext): PartSurface<TooltipTriggerState> {
  const isPointerDown = ref(false)
  const hasPointerMoveOpened = ref(false)

  function resetPointerDown() {
    isPointerDown.value = false
  }

  function handlePointerUp() {
    setTimeout(resetPointerDown, 1)
  }

  function handlePointerDown(event: PointerEvent) {
    if (context.open.value && !context.disableClosingTrigger.value) {
      context.onClose('trigger-press', event)
    }
    isPointerDown.value = true
    document.addEventListener('pointerup', handlePointerUp, { once: true })
  }

  function handlePointerMove(event: PointerEvent) {
    if (event.pointerType === 'touch')
      return
    if (
      !hasPointerMoveOpened.value && !context.isPointerInTransit.value
    ) {
      context.onTriggerEnter(event)
      hasPointerMoveOpened.value = true
    }
  }

  function handlePointerLeave(event: PointerEvent) {
    context.onTriggerLeave(event)
    hasPointerMoveOpened.value = false
  }

  function handleFocus(event: FocusEvent) {
    if (isPointerDown.value)
      return

    if (context.ignoreNonKeyboardFocus.value && !(event.target as HTMLElement).matches?.(':focus-visible'))
      return

    context.onOpen('trigger-focus', event)
  }

  function handleBlur(event: FocusEvent) {
    context.onClose('trigger-blur', event)
  }

  function handleClick(event: MouseEvent) {
    if (!context.disableClosingTrigger.value)
      context.onClose('trigger-press', event)
  }

  return createPartSurface<TooltipTriggerState>(
    () => ({
      'aria-describedby': context.open.value ? context.contentId : undefined,
      'data-grace-area-trigger': '',
      // A disabled tooltip renders NO listeners (not inert ones), exactly like
      // the pre-#2723 `v-on="tooltipListeners"` with its `{}` branch.
      ...(context.disabled.value
        ? {}
        : {
            onClick: handleClick,
            onFocus: handleFocus,
            onPointermove: handlePointerMove,
            onPointerleave: handlePointerLeave,
            onPointerdown: handlePointerDown,
            onBlur: handleBlur,
          }),
    }),
    () => ({ state: context.stateAttribute.value, delayed: context.isDelayed.value }),
  )
}

/**
 * The content surface, derived purely from the root context — shared by
 * `useTooltip().content` and `TooltipContentImpl.vue`. State only
 * (`data-state` + `data-delayed`): the `PopperContent` positioning props, the
 * `--reka-tooltip-*` CSS variables, the `DismissableLayer` wrapper and the
 * scroll / `TOOLTIP_OPEN` listeners stay in the SFC.
 */
export function getTooltipContentSurface(
  context: Pick<TooltipContext, 'stateAttribute' | 'isDelayed'>,
): PartSurface<TooltipContentState> {
  return createPartSurface<TooltipContentState>(
    () => ({}),
    () => ({ state: context.stateAttribute.value, delayed: context.isDelayed.value }),
  )
}

/**
 * The a11y label surface: the `role="tooltip"` element carrying the id the
 * trigger's `aria-describedby` points at. `TooltipContentImpl.vue` binds it on
 * its `VisuallyHidden` label; a standalone consumer binds it on whatever
 * element holds the accessible text. Renders no `data-*`.
 */
export function getTooltipLabelSurface(
  context: Pick<TooltipContext, 'contentId'>,
): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(
    () => ({ id: context.contentId, role: 'tooltip' }),
    () => ({}),
  )
}

export interface UseTooltipProps {
  /**
   * Controlled open state. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  open?: MaybeRefOrGetter<boolean | undefined>
  /** Initial open state when uncontrolled. @defaultValue `false` */
  defaultOpen?: boolean
  /**
   * The delay before a pointer hover opens the tooltip. The SFC resolves it to
   * the root prop or the `TooltipProvider` value. @defaultValue `700`
   */
  delayDuration?: MaybeRefOrGetter<number | undefined>
  /**
   * Whether a hover open waits for `delayDuration`. `TooltipProvider` flips it
   * to `false` for `skipDelayDuration` after a tooltip closes, so moving
   * between adjacent triggers opens instantly (and without `data-delayed`).
   * @defaultValue `true`
   */
  isOpenDelayed?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Whether the pointer is travelling through the grace area between a
   * trigger and its hoverable content (`useGraceArea`, published on the
   * provider by `TooltipContentHoverable`). The trigger's `pointermove` does
   * not open while it is `true`. @defaultValue `false`
   */
  isPointerInTransit?: MaybeRefOrGetter<boolean | undefined>
  /**
   * When `true`, leaving the trigger closes the tooltip instead of letting the
   * pointer travel onto the content. @defaultValue `false`
   */
  disableHoverableContent?: MaybeRefOrGetter<boolean | undefined>
  /** When `true`, pressing the trigger does not close the tooltip. @defaultValue `false` */
  disableClosingTrigger?: MaybeRefOrGetter<boolean | undefined>
  /** When `true`, the trigger surface renders no listeners. @defaultValue `false` */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /**
   * When `true`, focus opens the tooltip only if the trigger matches
   * `:focus-visible` (keyboard focus). @defaultValue `false`
   */
  ignoreNonKeyboardFocus?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Base id the content id derives from (`<baseId>-content`). Defaults to
   * `reka-tooltip-<n>` from a per-call counter, which is NOT stable across
   * server and client: SSR consumers must pass a stable `baseId` (the SFC
   * hands its `useId(undefined, 'reka-tooltip')`).
   */
  baseId?: string
  /** Component `emit`; receives `beforeUpdate:open` then `update:open`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: boolean, details: ChangeEventDetails<TooltipOpenChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: boolean, details: ChangeEventDetails<TooltipOpenChangeReason>) => void
}

export interface UseTooltipReturn {
  open: ComputedRef<boolean>
  /** `true` only while open AND that open came from the delay timer; rendered as `data-delayed`. */
  isDelayed: ComputedRef<boolean>
  /** Opens instantly (cancelling a pending delayed open). Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpen: (reason?: TooltipOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Closes and cancels a pending delayed open. Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onClose: (reason?: TooltipOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Pointer entered the trigger: opens with reason `trigger-hover`, delayed unless `isOpenDelayed` is `false`. */
  onTriggerEnter: (event?: PointerEvent) => void
  /** Pointer left the trigger: closes with reason `trigger-leave` when hoverable content is disabled, else only cancels a pending delayed open. */
  onTriggerLeave: (event?: PointerEvent) => void
  /** Details of the last change attempt; initially `{ reason: 'none' }`. */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<TooltipOpenChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** `aria-describedby` + `data-grace-area-trigger` + the pointer/focus/click listeners; `data-state` / `data-delayed`. */
  trigger: PartSurface<TooltipTriggerState>
  /** State only: `data-state` / `data-delayed`. */
  content: PartSurface<TooltipContentState>
  /** `id` / `role="tooltip"` for the accessible label; renders no `data-*`. */
  label: PartSurface<Record<string, never>>
  /** The `TooltipContext` value — the SFC provides this verbatim. */
  context: TooltipContext
}

/**
 * Headless Tooltip logic. The `.vue` shells compose this; a standalone consumer
 * gets the open model (with `beforeUpdate`/`update` details and reasons), the
 * delayed-open timer, the content id and the trigger/content/label surfaces,
 * but must still wrap the content in `Presence`, `DismissableLayer` and
 * `PopperContent` (and the trigger in `PopperAnchor`) — those are component
 * families a pure composable cannot absorb (see the #2723 recipe's "Overlay
 * families"). Dismissal reasons (`escape-key`, `outside-press`) therefore
 * arrive through `onClose(reason, event)` from whatever layer the consumer
 * composes, and the `TooltipProvider` coordination (skip-delay, closing the
 * previous tooltip, the grace-area transit flag) is opt-in through the
 * `isOpenDelayed` / `isPointerInTransit` getters.
 *
 * SSR-safe: no `document`/`window` at call scope (`document` is touched only
 * inside the trigger's `pointerdown` handler).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — no lifecycle hooks, so it does run outside `setup()`, but
 * it creates a `watch` (the `data-delayed` reset) and a `useTimeoutFn` timer
 * that are only disposed when called inside a component or an `effectScope`.
 */
export function useTooltip(props: UseTooltipProps = {}): UseTooltipReturn {
  const baseId = props.baseId ?? `reka-tooltip-${++tooltipCount}`

  // Every write to `open` — hover timer, focus/blur, press, grace-area exit,
  // dismiss — goes through one `setState`, so `beforeUpdate:open` can cancel any
  // of them and `update:open` always carries the reason (#2828).
  const { state: open, setState, lastChangeDetails, isControlled } = useControllableState<boolean, TooltipOpenChangeReason>({
    prop: props.open,
    defaultValue: props.defaultOpen ?? false,
    name: 'open',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })

  const delayDuration = computed<number>(() => toValue(props.delayDuration) ?? 700)
  const isOpenDelayed = computed<boolean>(() => toValue(props.isOpenDelayed) ?? true)
  const isPointerInTransit = computed<boolean>(() => toValue(props.isPointerInTransit) ?? false)
  const disableHoverableContent = computed<boolean>(() => toValue(props.disableHoverableContent) ?? false)
  const disableClosingTrigger = computed<boolean>(() => toValue(props.disableClosingTrigger) ?? false)
  const disabled = computed<boolean>(() => toValue(props.disabled) ?? false)
  const ignoreNonKeyboardFocus = computed<boolean>(() => toValue(props.ignoreNonKeyboardFocus) ?? false)

  const wasOpenDelayedRef = ref(false)
  const trigger = ref<HTMLElement>()

  const stateAttribute = computed<DisclosureState>(() => disclosureState(open.value))
  const isDelayed = computed<boolean>(() => open.value && wasOpenDelayedRef.value)

  // A closed tooltip keeps no "delayed" history: a later parent-driven or
  // imperative open must not render `data-delayed`. A cancelled close never
  // flips `open`, so the flag survives it. `flush: 'sync'` because a pre-flush
  // watcher coalesces an open and a close that land in the same tick (the delay
  // timer firing, then a synchronous ref-driven close) into "no change" and
  // never resets the flag.
  watch(open, (isOpen) => {
    if (!isOpen)
      wasOpenDelayedRef.value = false
  }, { flush: 'sync' })

  // The `pointermove` that armed the delay timer, handed to `update:open` when it fires.
  let delayedOpenEvent: PointerEvent | undefined

  const { start: startTimer, stop: clearTimer } = useTimeoutFn(() => {
    const event = delayedOpenEvent
    delayedOpenEvent = undefined
    // Flag before the write so `isDelayed` is right on the same tick `open` flips;
    // roll it back when the open was cancelled (or was a no-op).
    wasOpenDelayedRef.value = true
    if (!setState(true, 'trigger-hover', event))
      wasOpenDelayedRef.value = false
  }, delayDuration, { immediate: false })

  function handleOpen(reason?: TooltipOpenChangeReason | BaseChangeReason, event?: Event): boolean {
    clearTimer()
    wasOpenDelayedRef.value = false
    return setState(true, reason, event)
  }
  function handleClose(reason?: TooltipOpenChangeReason | BaseChangeReason, event?: Event): boolean {
    // Cancel a pending delayed open first; a cancelled close then simply stays open.
    clearTimer()
    return setState(false, reason, event)
  }
  function handleDelayedOpen(event?: PointerEvent) {
    delayedOpenEvent = event
    startTimer()
  }
  function onTriggerEnter(event?: PointerEvent) {
    if (isOpenDelayed.value)
      handleDelayedOpen(event)
    else handleOpen('trigger-hover', event)
  }
  function onTriggerLeave(event?: PointerEvent) {
    if (disableHoverableContent.value) {
      handleClose('trigger-leave', event)
    }
    else {
      // Clear the timer in case the pointer leaves the trigger before the tooltip is opened.
      clearTimer()
    }
  }

  const context: TooltipContext = {
    contentId: `${baseId}-content`,
    open,
    stateAttribute,
    isDelayed,
    isPointerInTransit,
    trigger,
    onTriggerChange(el) {
      trigger.value = el
    },
    onTriggerEnter,
    onTriggerLeave,
    onOpen: handleOpen,
    onClose: handleClose,
    disableHoverableContent,
    disableClosingTrigger,
    disabled,
    ignoreNonKeyboardFocus,
  }

  return {
    open,
    isDelayed,
    onOpen: handleOpen,
    onClose: handleClose,
    onTriggerEnter,
    onTriggerLeave,
    lastChangeDetails,
    isControlled,
    trigger: createTooltipTriggerSurface(context),
    content: getTooltipContentSurface(context),
    label: getTooltipLabelSurface(context),
    context,
  }
}
