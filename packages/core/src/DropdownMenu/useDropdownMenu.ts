import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { DropdownMenuRootContext } from './DropdownMenuRoot.vue'
import type { FocusOutsideEvent, PointerDownOutsideEvent } from '@/DismissableLayer'
import type { MenuOpenChangeReason, UseMenuRootProps } from '@/Menu'
import type { MenuContext, MenuRootContext } from '@/Menu/MenuRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import { nextTick, ref, toValue } from 'vue'
import { useMenuRoot } from '@/Menu/useMenu'
import { createPartSurface, disclosureState } from '@/shared'

// =============================================================================
// Headless composable for the DropdownMenu family — issue #2723.
//
// DropdownMenu is a thin layer over Menu: a button trigger that toggles the
// menu, and content that restores focus to it. `useDropdownMenu()` COMPOSES
// `useMenuRoot()` — one open model (so `beforeUpdate:open` / `update:open`
// fire once, from the DropdownMenu root) and the two Menu context objects the
// Menu parts inject — and adds the dropdown context, ids and part surfaces.
// `PopperRoot`, `MenuAnchor` and `MenuContent` stay wrappers in the SFCs.
// =============================================================================

/** Why the dropdown menu's `open` state changed — the Menu union. */
export type DropdownMenuOpenChangeReason = MenuOpenChangeReason

/** Semantic state of the trigger part (`data-state`, `data-disabled`). */
export type DropdownMenuTriggerState = { state: DisclosureState, disabled: boolean }

/** Standalone `useDropdownMenu()` calls without a `baseId` draw `reka-dropdown-menu-<n>` from here. */
let dropdownMenuCount = 0

const TRIGGER_KEYS = ['Enter', ' ', 'ArrowDown']

/**
 * The trigger surface: id/aria wiring plus the click and Enter/Space/ArrowDown
 * handlers, ported verbatim from `DropdownMenuTrigger`. A pure derivation from
 * the context (no per-instance state). The `type` binding is tag-dependent and
 * stays in the SFC.
 */
export function getDropdownMenuTriggerSurface(
  context: Pick<DropdownMenuRootContext, 'open' | 'onOpenChange' | 'onOpenToggle' | 'triggerId' | 'contentId'>,
  disabled?: MaybeRefOrGetter<boolean | undefined>,
): PartSurface<DropdownMenuTriggerState> {
  const isDisabled = () => toValue(disabled) ?? false
  return createPartSurface<DropdownMenuTriggerState>(
    () => ({
      'id': context.triggerId,
      'aria-haspopup': 'menu',
      'aria-expanded': context.open.value,
      'aria-controls': context.open.value ? context.contentId : undefined,
      'disabled': isDisabled(),
      'onClick': async (event: MouseEvent) => {
        if (event.defaultPrevented)
          return
        // only call handler if it's the left button (mousedown gets triggered by all mouse buttons)
        // but not when the control key is pressed (avoiding MacOS right click)
        if (!isDisabled() && event.button === 0 && event.ctrlKey === false) {
          context.onOpenToggle('trigger-press', event)
          await nextTick()
          // prevent trigger focusing when opening
          // this allows the content to be given focus without competition
          if (context.open.value)
            event.preventDefault()
        }
      },
      'onKeydown': (event: KeyboardEvent) => {
        if (!TRIGGER_KEYS.includes(event.key))
          return
        if (isDisabled() || event.defaultPrevented)
          return
        if (['Enter', ' '].includes(event.key))
          context.onOpenToggle('trigger-press', event)
        if (event.key === 'ArrowDown')
          context.onOpenChange(true, 'trigger-press', event)
        // prevent keydown from scrolling window / first focused item to execute
        // that keydown (inadvertently closing the menu)
        event.preventDefault()
      },
    }),
    () => ({ state: disclosureState(context.open.value), disabled: isDisabled() }),
  )
}

export interface DropdownMenuContentSurface extends PartSurface<Record<string, never>> {
  /** `MenuContent` `closeAutoFocus`: refocuses the trigger unless the user interacted outside. */
  onCloseAutoFocus: (event: Event) => void
  /** `MenuContent` `interactOutside`: a press on the trigger never dismisses (the trigger toggles). */
  onInteractOutside: (event: PointerDownOutsideEvent | FocusOutsideEvent) => void
}

/**
 * The content surface: `id` / `aria-labelledby` plus the two `MenuContent`
 * event handlers. A context-scoped FACTORY — it owns the per-instance
 * "interacted outside" flag — so call it exactly once per content instance.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function createDropdownMenuContentSurface(
  context: Pick<DropdownMenuRootContext, 'triggerId' | 'contentId' | 'triggerElement' | 'modal'>,
): DropdownMenuContentSurface {
  const hasInteractedOutside = ref(false)
  const surface = createPartSurface<Record<string, never>>(
    () => ({
      'id': context.contentId,
      'aria-labelledby': context.triggerId,
    }),
    () => ({}),
  )

  function onCloseAutoFocus(event: Event) {
    if (event.defaultPrevented)
      return
    if (!hasInteractedOutside.value) {
      setTimeout(() => {
        context.triggerElement.value?.focus()
      }, 0)
    }
    hasInteractedOutside.value = false

    // Always prevent auto focus because we either focus manually or want user agent focus
    event.preventDefault()
  }

  function onInteractOutside(event: PointerDownOutsideEvent | FocusOutsideEvent) {
    if (event.defaultPrevented)
      return

    const originalEvent = event.detail.originalEvent as PointerEvent
    const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true
    const isRightClick = originalEvent.button === 2 || ctrlLeftClick
    if (!context.modal.value || isRightClick)
      hasInteractedOutside.value = true
    if (context.triggerElement.value?.contains(event.target as HTMLElement))
      event.preventDefault()
  }

  return { ...surface, onCloseAutoFocus, onInteractOutside }
}

export interface UseDropdownMenuProps extends Omit<UseMenuRootProps, 'onBeforeUpdate' | 'onUpdate'> {
  /**
   * Base id the trigger/content ids derive from (`<baseId>-trigger`,
   * `<baseId>-content`). Defaults to `reka-dropdown-menu-<n>` from a per-call
   * counter, which is NOT stable across server and client: SSR consumers must
   * pass a stable `baseId` (the SFC hands its `useId(undefined, 'reka-dropdown-menu')`).
   */
  baseId?: string
  /** Disables the trigger surface returned by this call. */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: boolean, details: ChangeEventDetails<DropdownMenuOpenChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: boolean, details: ChangeEventDetails<DropdownMenuOpenChangeReason>) => void
}

export interface UseDropdownMenuReturn {
  open: ComputedRef<boolean>
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenChange: (value: boolean, reason?: DropdownMenuOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Returns `false` when the change was a no-op or cancelled via `beforeUpdate:open`. */
  onOpenToggle: (reason?: DropdownMenuOpenChangeReason | BaseChangeReason, event?: Event) => boolean
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<DropdownMenuOpenChangeReason>>>
  isControlled: ComputedRef<boolean>
  trigger: PartSurface<DropdownMenuTriggerState>
  /** The content surface (`id` / `aria-labelledby`) plus the `MenuContent` focus-restore handlers. */
  content: DropdownMenuContentSurface
  /** The `DropdownMenuRootContext` value — the SFC provides this verbatim. */
  context: DropdownMenuRootContext
  /** The `MenuContext` value from `useMenuRoot()` — the SFC provides this verbatim. */
  menuContext: MenuContext
  /** The `MenuRootContext` value from `useMenuRoot()` — the SFC provides this verbatim. */
  menuRootContext: MenuRootContext
}

/**
 * Headless DropdownMenu root. Composes `useMenuRoot()` for the open model and
 * the Menu contexts, and adds the dropdown context (ids, trigger element) and
 * the trigger surface. The SFC keeps `PopperRoot`; the content part keeps
 * `MenuContent` (focus, dismissal, roving focus, positioning).
 *
 * NOT callable outside `setup()` — `useMenuRoot()` binds `useIsUsingKeyboard`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup
 */
export function useDropdownMenu(props: UseDropdownMenuProps = {}): UseDropdownMenuReturn {
  const baseId = props.baseId ?? `reka-dropdown-menu-${++dropdownMenuCount}`
  const { open, onOpenChange, lastChangeDetails, isControlled, menuContext, menuRootContext } = useMenuRoot(props)

  function onOpenToggle(reason?: DropdownMenuOpenChangeReason | BaseChangeReason, event?: Event): boolean {
    return onOpenChange(!open.value, reason, event)
  }

  const context: DropdownMenuRootContext = {
    open,
    onOpenChange: (value, reason = 'trigger-press', event) => {
      onOpenChange(value, reason, event)
    },
    onOpenToggle: (reason = 'trigger-press', event) => {
      onOpenToggle(reason, event)
    },
    triggerId: `${baseId}-trigger`,
    triggerElement: ref<HTMLElement>(),
    contentId: `${baseId}-content`,
    modal: menuRootContext.modal,
    dir: menuRootContext.dir,
  }

  return {
    open,
    onOpenChange,
    onOpenToggle,
    lastChangeDetails,
    isControlled,
    trigger: getDropdownMenuTriggerSurface(context, props.disabled),
    content: createDropdownMenuContentSurface(context),
    context,
    menuContext,
    menuRootContext,
  }
}
