import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { PopoverOpenChangeReason, PopoverRootContext } from './PopoverRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import { computed, ref, toValue } from 'vue'
import { createPartSurface, disclosureState, useControllableState } from '@/shared'

// =============================================================================
// Headless composable for the Popover (overlay) family — issue #2723.
//
// Follows the overlay contract validated on Menu: the root renders NO attrs
// (`PopoverRoot` is `<PopperRoot><slot/></PopperRoot>`), so `usePopover()`
// returns state + the context object the SFC provides, and the surfaces begin
// at Trigger / Close / Content. Unlike Menu's per-item factories, every Popover
// part derives purely from the root context, so the builders are idempotent
// `get<Part>Surface(context)` derivations — the SFCs (which inject the context)
// and `usePopover()` share ONE derivation each. Positioning (`PopperAnchor` /
// `PopperContent`), `Presence`, `FocusScope`, `DismissableLayer`, the portal and
// the modal side-effects (`useHideOthers` / `useBodyScrollLock`) stay wrappers.
// =============================================================================

export type PopoverTriggerState = { state: DisclosureState }
export type PopoverContentState = { state: DisclosureState }

/** Standalone `usePopover()` calls without a `baseId` draw `reka-popover-<n>` from here. */
let popoverCount = 0

/**
 * The trigger surface, derived purely from the root context — the single
 * derivation shared by `usePopover().trigger` and `PopoverTrigger.vue`.
 * The tag-dependent `type` binding stays in the SFC.
 */
export function getPopoverTriggerSurface(context: PopoverRootContext): PartSurface<PopoverTriggerState> {
  return createPartSurface<PopoverTriggerState>(
    () => ({
      'id': context.triggerId,
      'aria-haspopup': 'dialog',
      'aria-expanded': context.open.value,
      'aria-controls': context.contentId,
      'onClick': (event: MouseEvent) => context.onOpenToggle('trigger-press', event),
    }),
    () => ({ state: disclosureState(context.open.value) }),
  )
}

/**
 * The close-button surface, derived purely from the root context — shared by
 * `usePopover().close` and `PopoverClose.vue`. Renders no semantic state.
 */
export function getPopoverCloseSurface(context: PopoverRootContext): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(
    () => ({
      onClick: (event: MouseEvent) => context.onOpenChange(false, 'close-press', event),
    }),
    () => ({}),
  )
}

/**
 * The `role="dialog"` content surface, derived purely from the root context —
 * shared by `usePopover().content` and `PopoverContentImpl.vue`. Only the
 * id/role/aria bindings live here; the `PopperContent` positioning props, the
 * `--reka-popover-*` CSS variables and the FocusScope/DismissableLayer wrappers
 * stay in the SFC.
 */
export function getPopoverContentSurface(context: PopoverRootContext): PartSurface<PopoverContentState> {
  return createPartSurface<PopoverContentState>(
    () => ({
      'id': context.contentId,
      'role': 'dialog',
      'aria-labelledby': context.triggerId,
    }),
    () => ({ state: disclosureState(context.open.value) }),
  )
}

export interface UsePopoverProps {
  /**
   * Controlled open state. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  open?: MaybeRefOrGetter<boolean | undefined>
  /** Initial open state when uncontrolled. @defaultValue `false` */
  defaultOpen?: boolean
  /**
   * When `true`, interaction with outside elements is disabled and only the
   * popover content is visible to screen readers. @defaultValue `false`
   */
  modal?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Base id the trigger/content ids derive from (`<baseId>-trigger`,
   * `<baseId>-content`). Defaults to `reka-popover-<n>` from a per-call counter,
   * which is NOT stable across server and client: SSR consumers must pass a
   * stable `baseId` (the SFC hands its `useId(undefined, 'reka-popover')`).
   */
  baseId?: string
  /** Component `emit`; receives `beforeUpdate:open` then `update:open`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: boolean, details: ChangeEventDetails<PopoverOpenChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: boolean, details: ChangeEventDetails<PopoverOpenChangeReason>) => void
}

export interface UsePopoverReturn {
  open: ComputedRef<boolean>
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenChange: (value: boolean, reason?: PopoverOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenToggle: (reason?: PopoverOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Details of the last change attempt; initially `{ reason: 'none' }`. */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<PopoverOpenChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** `id` / `aria-haspopup` / `aria-expanded` / `aria-controls` + the toggling `onClick`. */
  trigger: PartSurface<PopoverTriggerState>
  /** The closing `onClick`; renders no `data-*`. The tag-dependent `type` stays in the SFC. */
  close: PartSurface<Record<string, never>>
  /** `id` / `role="dialog"` / `aria-labelledby`. */
  content: PartSurface<PopoverContentState>
  /** The `PopoverRootContext` value — the SFC provides this verbatim. */
  context: PopoverRootContext
}

/**
 * Headless Popover logic. The `.vue` shells compose this; a standalone consumer
 * gets the open model, ids and the trigger/close/content aria + handlers, but
 * must still wrap the content in `Presence`, `FocusScope`, `DismissableLayer`
 * and `PopperContent` (and the trigger in `PopperAnchor`) — those are component
 * families a pure composable cannot absorb (see the #2723 recipe's "Overlay
 * families"). Dismissal reasons (`escape-key`, `outside-press`, `focus-outside`)
 * therefore arrive through `onOpenChange(false, reason, event)` from whatever
 * layer the consumer composes.
 *
 * SSR-safe (no `document`/`window` at call scope) and callable outside `setup()`
 * (computed-only — the trigger element registration stays in the SFC).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function usePopover(props: UsePopoverProps = {}): UsePopoverReturn {
  const baseId = props.baseId ?? `reka-popover-${++popoverCount}`

  const { state: open, setState, lastChangeDetails, isControlled } = useControllableState<boolean, PopoverOpenChangeReason>({
    prop: props.open,
    defaultValue: props.defaultOpen ?? false,
    name: 'open',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const modal = computed<boolean>(() => toValue(props.modal) ?? false)
  const triggerElement = ref<HTMLElement>()
  const hasCustomAnchor = ref(false)

  // Every write to `open` — trigger, close button, dismiss, slot `close` — goes
  // through one `setState`, so `beforeUpdate:open` can cancel any of them and
  // `update:open` always carries the reason (#2828).
  function onOpenChange(value: boolean, reason?: PopoverOpenChangeReason | BaseChangeReason, event?: Event): boolean {
    return setState(value, reason, event)
  }
  function onOpenToggle(reason?: PopoverOpenChangeReason | BaseChangeReason, event?: Event): boolean {
    return setState(!open.value, reason, event)
  }

  const context: PopoverRootContext = {
    triggerElement,
    triggerId: `${baseId}-trigger`,
    contentId: `${baseId}-content`,
    open,
    modal: modal as Ref<boolean>,
    onOpenChange,
    onOpenToggle,
    hasCustomAnchor,
  }

  return {
    open,
    onOpenChange,
    onOpenToggle,
    lastChangeDetails,
    isControlled,
    trigger: getPopoverTriggerSurface(context),
    close: getPopoverCloseSurface(context),
    content: getPopoverContentSurface(context),
    context,
  }
}
