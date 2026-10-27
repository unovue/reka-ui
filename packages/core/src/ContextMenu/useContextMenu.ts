import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { ContextMenuRootContext } from './ContextMenuRoot.vue'
import type { FocusOutsideEvent, PointerDownOutsideEvent } from '@/DismissableLayer'
import type { MenuOpenChangeReason, UseMenuRootProps } from '@/Menu'
import type { MenuContext, MenuRootContext } from '@/Menu/MenuRoot.vue'
import type { Point } from '@/Menu/utils'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import { computed, nextTick, ref, toValue, watch } from 'vue'
import { useMenuRoot } from '@/Menu/useMenu'
import { createPartSurface, disclosureState } from '@/shared'
import { isTouchOrPen } from './utils'

// =============================================================================
// Headless composable for the ContextMenu family — issue #2723.
//
// ContextMenu is a thin layer over Menu: the trigger is an area that opens the
// menu at the pointer (right click or long press), and the content anchors to
// that point. `useContextMenu()` COMPOSES `useMenuRoot()` (one open model and
// the two Menu contexts) and adds the context-menu context; the trigger's
// pointer machine is `createContextMenuTriggerSurface()`. `PopperRoot`,
// `MenuAnchor` and `MenuContent` stay wrappers in the SFCs.
// =============================================================================

/** Why the context menu's `open` state changed — the Menu union. */
export type ContextMenuOpenChangeReason = MenuOpenChangeReason

/** Semantic state of the trigger part (`data-state`, `data-disabled`). */
export type ContextMenuTriggerState = { state: DisclosureState, disabled: boolean }

/** The virtual element `MenuAnchor` positions against while the menu was opened at the pointer. */
export interface ContextMenuVirtualElement {
  getBoundingClientRect: () => DOMRect
}

export interface ContextMenuTriggerSurface extends PartSurface<ContextMenuTriggerState> {
  /** The anchor reference for `MenuAnchor`: the pointer point, or the trigger element for a non-pointer open. */
  reference: ComputedRef<ContextMenuVirtualElement | HTMLElement | undefined>
}

export interface ContextMenuTriggerOptions {
  /** When `true`, right click and long press do not open the menu (the native menu shows). */
  disabled?: MaybeRefOrGetter<boolean | undefined>
}

/**
 * The trigger surface: the right-click / long-press machine ported verbatim
 * from `ContextMenuTrigger` (the pointer point, the long-press timer, the
 * pending pointer open a controlled parent may refuse) plus `data-state` /
 * `data-disabled` and the touch-callout style. A context-scoped FACTORY with a
 * watcher, so call it exactly once per trigger instance inside `setup()`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup
 */
export function createContextMenuTriggerSurface(
  context: ContextMenuRootContext,
  options: ContextMenuTriggerOptions = {},
): ContextMenuTriggerSurface {
  const isDisabled = () => toValue(options.disabled) ?? false
  const point = ref<Point>({ x: 0, y: 0 })
  const isPointerOpen = ref(false)
  // Set while a pointer open request waits for the (possibly controlled) open state.
  let pendingPointerOpen = false
  const virtualEl = computed<ContextMenuVirtualElement>(() => ({
    getBoundingClientRect: () =>
      ({
        width: 0,
        height: 0,
        left: point.value.x,
        right: point.value.x,
        top: point.value.y,
        bottom: point.value.y,
        ...point.value,
      } as DOMRect),
  }))

  const reference = computed(() =>
    isPointerOpen.value
      ? virtualEl.value
      : context.triggerElement.value,
  )

  // Pick the anchor when the menu opens, and keep it while closing so the
  // content doesn't jump to the trigger during its exit animation.
  watch(
    () => context.open.value,
    (open) => {
      if (open) {
        isPointerOpen.value = pendingPointerOpen
        pendingPointerOpen = false
      }
    },
  )

  let longPressTimer = 0
  function clearLongPress() {
    window.clearTimeout(longPressTimer)
  }

  async function handleOpen(event: MouseEvent | PointerEvent) {
    point.value = { x: event.clientX, y: event.clientY }

    // Already open: move the menu to the new pointer position.
    if (context.open.value) {
      isPointerOpen.value = true
      return
    }

    pendingPointerOpen = true
    context.onOpenChange(true, 'trigger-press', event)

    await nextTick()

    // A controlled parent may have refused the request.
    pendingPointerOpen = false
  }

  async function handleContextMenu(event: PointerEvent) {
    if (!isDisabled()) {
      await nextTick()
      if (!event.defaultPrevented) {
        clearLongPress()
        handleOpen(event)
        event.preventDefault()
      }
    }
  }

  async function handlePointerDown(event: PointerEvent) {
    if (!isDisabled()) {
      await nextTick()

      if (isTouchOrPen(event) && !event.defaultPrevented) {
        // clear the long press here in case there's multiple touch points
        clearLongPress()
        longPressTimer = window.setTimeout(handleOpen, context.pressOpenDelay.value, event)
      }
    }
  }

  async function handlePointerEvent(event: PointerEvent) {
    if (!isDisabled()) {
      await nextTick()
      if (isTouchOrPen(event) && !event.defaultPrevented)
        clearLongPress()
    }
  }

  const surface = createPartSurface<ContextMenuTriggerState>(
    () => ({
      style: {
        WebkitTouchCallout: 'none',
        pointerEvents: 'auto',
      },
      onContextmenu: handleContextMenu,
      onPointerdown: handlePointerDown,
      onPointermove: handlePointerEvent,
      onPointercancel: handlePointerEvent,
      onPointerup: handlePointerEvent,
    }),
    () => ({ state: disclosureState(context.open.value), disabled: isDisabled() }),
  )

  return { ...surface, reference }
}

export interface ContextMenuContentHandlers {
  /** `MenuContent` `closeAutoFocus`: no focus restore after an outside interaction. */
  onCloseAutoFocus: (event: Event) => void
  /** `MenuContent` `interactOutside`: a right click on the trigger re-positions instead of dismissing. */
  onInteractOutside: (event: PointerDownOutsideEvent | FocusOutsideEvent) => void
}

/**
 * The content's `MenuContent` event handlers, ported verbatim. A context-scoped
 * FACTORY (it owns the per-instance "interacted outside" flag): call it once
 * per content instance.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function createContextMenuContentHandlers(
  context: Pick<ContextMenuRootContext, 'triggerElement' | 'modal'>,
): ContextMenuContentHandlers {
  let hasInteractedOutside = false
  return {
    onCloseAutoFocus: (event) => {
      if (!event.defaultPrevented && hasInteractedOutside)
        event.preventDefault()
      hasInteractedOutside = false
    },
    onInteractOutside: (event) => {
      const originalEvent = event.detail.originalEvent as PointerEvent
      // Prevent closing when right click (button=2) with the trigger element
      if (originalEvent.button === 2 && event.target === context.triggerElement.value)
        event.preventDefault()
      if (!event.defaultPrevented && !context.modal.value)
        hasInteractedOutside = true
    },
  }
}

export interface UseContextMenuProps extends Omit<UseMenuRootProps, 'onBeforeUpdate' | 'onUpdate'> {
  /** The duration from when the trigger is pressed until the menu opens. @defaultValue `700` */
  pressOpenDelay?: MaybeRefOrGetter<number | undefined>
  /** Disables the trigger surface returned by this call. */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: boolean, details: ChangeEventDetails<ContextMenuOpenChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: boolean, details: ChangeEventDetails<ContextMenuOpenChangeReason>) => void
}

export interface UseContextMenuReturn {
  open: ComputedRef<boolean>
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenChange: (value: boolean, reason?: ContextMenuOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<ContextMenuOpenChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** The trigger surface: bind `attrs` on the trigger area and pass `reference` to `MenuAnchor`. */
  trigger: ContextMenuTriggerSurface
  /** The handlers for `MenuContent`'s `closeAutoFocus` / `interactOutside`. */
  content: ContextMenuContentHandlers
  /** The `ContextMenuRootContext` value — the SFC provides this verbatim. */
  context: ContextMenuRootContext
  /** The `MenuContext` value from `useMenuRoot()` — the SFC provides this verbatim. */
  menuContext: MenuContext
  /** The `MenuRootContext` value from `useMenuRoot()` — the SFC provides this verbatim. */
  menuRootContext: MenuRootContext
}

/**
 * Headless ContextMenu root. Composes `useMenuRoot()` for the open model and
 * the Menu contexts and adds the context-menu context (trigger element,
 * long-press delay). The trigger's pointer machine is
 * `createContextMenuTriggerSurface(context)`.
 *
 * NOT callable outside `setup()` — `useMenuRoot()` binds `useIsUsingKeyboard`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup
 */
export function useContextMenu(props: UseContextMenuProps = {}): UseContextMenuReturn {
  const { open, onOpenChange, lastChangeDetails, isControlled, menuContext, menuRootContext } = useMenuRoot(props)
  const pressOpenDelay = computed(() => toValue(props.pressOpenDelay) ?? 700)

  const context: ContextMenuRootContext = {
    open,
    onOpenChange: (value, reason = 'trigger-press', event) => {
      onOpenChange(value, reason, event)
    },
    modal: menuRootContext.modal,
    dir: menuRootContext.dir,
    triggerElement: ref<HTMLElement>(),
    pressOpenDelay: pressOpenDelay as Ref<number>,
  }

  return {
    open,
    onOpenChange,
    lastChangeDetails,
    isControlled,
    trigger: createContextMenuTriggerSurface(context, { disabled: props.disabled }),
    content: createContextMenuContentHandlers(context),
    context,
    menuContext,
    menuRootContext,
  }
}
