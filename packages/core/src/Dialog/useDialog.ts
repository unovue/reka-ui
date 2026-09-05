import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { DialogOpenChangeReason, DialogRootContext } from './DialogRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import { computed, ref, toValue } from 'vue'
import { createPartSurface, disclosureState, useControllableState } from '@/shared'

// =============================================================================
// Headless composable for the Dialog (overlay) family — issue #2723.
//
// Overlay-root contract (validated on Menu): the root renders no attrs, so
// `useDialog()` returns `{ state, methods, context }` plus the per-part surfaces
// that begin at Trigger/Content. Every part surface is a PURE derivation from
// the root context (`get<Part>Surface(context)`), shared by the part SFCs (which
// inject the context) and by `useDialog()` itself — one derivation, two callers.
//
// What a pure composable cannot absorb stays in the SFCs: `Presence` (mount/
// unmount + `unmountOnHide`), `FocusScope`/`DismissableLayer` (trap + dismiss),
// `useHideOthers`/`useBodyScrollLock`, the Teleport portal, and the tag-dependent
// `type` binding.
// =============================================================================

/** Semantic state of the trigger part; `state` → `data-state="open|closed"`. */
export type DialogTriggerState = { state: DisclosureState }
/** Semantic state of the content part; `state` → `data-state="open|closed"`. */
export type DialogContentState = { state: DisclosureState }
/** Semantic state of the overlay part; `state` → `data-state="open|closed"`. */
export type DialogOverlayState = { state: DisclosureState }

/** Standalone `useDialog()` calls without a `baseId` draw `reka-dialog-<n>` from here. */
let dialogCount = 0

/**
 * The trigger surface (`aria-haspopup`/`aria-expanded`/`aria-controls` +
 * `onClick` → `onOpenToggle('trigger-press')`), derived purely from the context.
 * The `type` binding is tag-dependent and stays in the SFC.
 */
export function getDialogTriggerSurface(
  context: Pick<DialogRootContext, 'open' | 'contentId' | 'onOpenToggle'>,
): PartSurface<DialogTriggerState> {
  return createPartSurface<DialogTriggerState>(
    () => ({
      'aria-haspopup': 'dialog',
      'aria-expanded': context.open.value || false,
      'aria-controls': context.open.value ? context.contentId : undefined,
      'onClick': (event: MouseEvent) => context.onOpenToggle('trigger-press', event),
    }),
    () => ({ state: disclosureState(context.open.value) }),
  )
}

/** The close surface: `onClick` → `onOpenChange(false, 'close-press')`; renders no `data-*`. */
export function getDialogCloseSurface(
  context: Pick<DialogRootContext, 'onOpenChange'>,
): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(
    () => ({
      onClick: (event: MouseEvent) => context.onOpenChange(false, 'close-press', event),
    }),
    () => ({}),
  )
}

/**
 * The content surface (`id`/`role="dialog"`/`aria-labelledby`/`aria-describedby`
 * + `data-state`), derived purely from the context. The FocusScope/
 * DismissableLayer wrappers, the `@dismiss` forwarding and the a11y warnings
 * stay in `DialogContentImpl`.
 */
export function getDialogContentSurface(
  context: Pick<DialogRootContext, 'open' | 'contentId' | 'titleId' | 'descriptionId'>,
): PartSurface<DialogContentState> {
  return createPartSurface<DialogContentState>(
    () => ({
      'id': context.contentId,
      'role': 'dialog',
      'aria-describedby': context.descriptionId,
      'aria-labelledby': context.titleId,
    }),
    () => ({ state: disclosureState(context.open.value) }),
  )
}

/** The overlay surface: state only (`data-state`); scroll-lock + pointerdown guard stay in the SFC. */
export function getDialogOverlaySurface(
  context: Pick<DialogRootContext, 'open'>,
): PartSurface<DialogOverlayState> {
  return createPartSurface<DialogOverlayState>(
    () => ({}),
    () => ({ state: disclosureState(context.open.value) }),
  )
}

/** The title surface: the `id` the content's `aria-labelledby` points at. */
export function getDialogTitleSurface(
  context: Pick<DialogRootContext, 'titleId'>,
): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(
    () => ({ id: context.titleId }),
    () => ({}),
  )
}

/** The description surface: the `id` the content's `aria-describedby` points at. */
export function getDialogDescriptionSurface(
  context: Pick<DialogRootContext, 'descriptionId'>,
): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(
    () => ({ id: context.descriptionId }),
    () => ({}),
  )
}

export interface UseDialogProps {
  /**
   * Controlled open state. A getter/ref resolving to `undefined` is uncontrolled;
   * a writable `Ref` (with no `emit`/`onUpdate`) is written back ("ref-owned").
   */
  open?: MaybeRefOrGetter<boolean | undefined>
  /** Initial open state when uncontrolled. @defaultValue `false` */
  defaultOpen?: boolean
  /**
   * The modality of the dialog. When `true`, interaction with outside elements
   * is disabled and only dialog content is visible to screen readers.
   * @defaultValue `true`
   */
  modal?: MaybeRefOrGetter<boolean | undefined>
  /**
   * When `false`, the content is hidden with CSS instead of unmounted on close.
   * @defaultValue `true`
   */
  unmountOnHide?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Base id the content/title/description ids derive from (`<baseId>-content`,
   * `<baseId>-title`, `<baseId>-description`). Defaults to `reka-dialog-<n>`
   * from a per-call counter, which is NOT stable across server and client: SSR
   * consumers must pass a stable `baseId` (the SFC hands its
   * `useId(undefined, 'reka-dialog')`).
   */
  baseId?: string
  /** Component `emit`; receives `beforeUpdate:open` then `update:open`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: boolean, details: ChangeEventDetails<DialogOpenChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: boolean, details: ChangeEventDetails<DialogOpenChangeReason>) => void
}

export interface UseDialogReturn {
  open: ComputedRef<boolean>
  modal: ComputedRef<boolean>
  unmountOnHide: ComputedRef<boolean>
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenChange: (value: boolean, reason?: DialogOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenToggle: (reason?: DialogOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  openModal: (reason?: DialogOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Details of the last change attempt; initially `{ reason: 'none' }`. */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<DialogOpenChangeReason>>>
  isControlled: ComputedRef<boolean>
  trigger: PartSurface<DialogTriggerState>
  close: PartSurface<Record<string, never>>
  content: PartSurface<DialogContentState>
  overlay: PartSurface<DialogOverlayState>
  title: PartSurface<Record<string, never>>
  description: PartSurface<Record<string, never>>
  /** The `DialogRootContext` value — the SFC provides this verbatim. */
  context: DialogRootContext
}

/**
 * Headless Dialog logic. The `.vue` shells compose this; a standalone consumer
 * gets the open model (with `beforeUpdate`/`update` details), ids and the
 * aria/role/`data-state` surfaces, but must still wrap the content in
 * `Presence` + `FocusScope`/`DismissableLayer` (or their own equivalents) for
 * mount/unmount, focus trapping and dismissal — those are component families
 * a pure composable cannot absorb (see the #2723 recipe's "Overlay families").
 *
 * SSR-safe (no `document`/`window` at call scope) and callable outside
 * `setup()` — computed-only; every mount-bound behaviour stays in the SFCs.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useDialog(props: UseDialogProps = {}): UseDialogReturn {
  const baseId = props.baseId ?? `reka-dialog-${++dialogCount}`

  // Every open/close path (trigger, close button, dismiss) goes through one
  // `setState` so `beforeUpdate:open` can cancel it and the details reach the consumer.
  const { state: open, setState, lastChangeDetails, isControlled } = useControllableState<boolean, DialogOpenChangeReason>({
    prop: props.open,
    defaultValue: props.defaultOpen ?? false,
    name: 'open',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const modal = computed<boolean>(() => toValue(props.modal) ?? true)
  const unmountOnHide = computed<boolean>(() => toValue(props.unmountOnHide) ?? true)

  const triggerElement = ref<HTMLElement>()
  const contentElement = ref<HTMLElement>()

  function onOpenChange(value: boolean, reason?: DialogOpenChangeReason | BaseChangeReason, event?: Event): boolean {
    return setState(value, reason, event)
  }
  function onOpenToggle(reason?: DialogOpenChangeReason | BaseChangeReason, event?: Event): boolean {
    return setState(!open.value, reason, event)
  }
  function openModal(reason?: DialogOpenChangeReason | BaseChangeReason, event?: Event): boolean {
    return setState(true, reason, event)
  }

  const context: DialogRootContext = {
    open,
    modal: modal as Ref<boolean>,
    unmountOnHide: unmountOnHide as Ref<boolean>,
    openModal,
    onOpenChange,
    onOpenToggle,
    triggerElement,
    contentElement,
    contentId: `${baseId}-content`,
    titleId: `${baseId}-title`,
    descriptionId: `${baseId}-description`,
  }

  return {
    open,
    modal,
    unmountOnHide,
    onOpenChange,
    onOpenToggle,
    openModal,
    lastChangeDetails,
    isControlled,
    trigger: getDialogTriggerSurface(context),
    close: getDialogCloseSurface(context),
    content: getDialogContentSurface(context),
    overlay: getDialogOverlaySurface(context),
    title: getDialogTitleSurface(context),
    description: getDialogDescriptionSurface(context),
    context,
  }
}
