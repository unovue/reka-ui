import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { MenuContentContext } from './MenuContentImpl.vue'
import type { MenuContext, MenuRootContext } from './MenuRoot.vue'
import type { Direction } from './utils'
// POC NOTE: `PartSurface` is the shared headless-part contract. On v3 it is only
// published from `@/Switch`; it belongs in `@/shared` (the Tabs PR #2795 moves it
// there). Imported from `@/Switch` here to keep this POC self-contained on v3.
import type { PartSurface } from '@/Switch'
import { computed, nextTick, ref, toValue } from 'vue'
import { getActiveElement } from '@/shared'
import { useIsUsingKeyboard } from '@/shared/useIsUsingKeyboard'
import { isMouseEvent, ITEM_SELECT, SELECTION_KEYS } from './utils'

// =============================================================================
// POC: headless composables for the Menu (overlay) family — issue #2723.
//
// This proves the useX() pattern extends to an OVERLAY family, and documents
// where it must bend. Findings live in docs/superpowers/pocs/2723-menu-*.md.
//
// Three shapes are exercised:
//  1. useMenuRoot()            — state-only root (NO surface); returns the two
//                                context objects the SFC provides. This is the
//                                overlay-root contract: `{ state, context }`.
//  2. getMenuItemBaseSurface() — the attr-bearing item render surface (role/
//                                aria/data-* + hover-highlight handlers). A
//                                context-SCOPED FACTORY: it creates per-instance
//                                refs (isFocused) and needs the item's element,
//                                so unlike Tabs' builders it is NOT pure and must
//                                be called exactly once per item instance.
//  3. getMenuItemSelectSurface() — the select protocol (click/pointer/keydown +
//                                the CustomEvent-token close-on-select). Pure
//                                handlers, no data-*. `onSelect` is a callback
//                                channel (never a merged DOM listener).
// =============================================================================

// -----------------------------------------------------------------------------
// 1. useMenuRoot — state-only overlay root
// -----------------------------------------------------------------------------

export interface UseMenuRootProps {
  /** Externally-owned open state (the SFC hands its `useVModel` ref). */
  open?: Ref<boolean>
  /** Resolved reading direction (the SFC hands its `useDirection` ref). @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** @defaultValue `true` */
  modal?: MaybeRefOrGetter<boolean | undefined>
}

export interface UseMenuRootReturn {
  open: Ref<boolean>
  onOpenChange: (value: boolean) => void
  onClose: () => void
  /** The `MenuContext` value — the SFC provides this verbatim. */
  menuContext: MenuContext
  /** The `MenuRootContext` value — the SFC provides this verbatim. */
  menuRootContext: MenuRootContext
}

/**
 * Headless Menu root. Renders NO element attributes (the SFC keeps `<PopperRoot>`
 * as a wrapper), so there is NO `PartSurface` — the return is pure state plus the
 * two context objects. This is the overlay-root contract: `{ state, context }`.
 *
 * NOT callable outside `setup()` — `useIsUsingKeyboard` binds a mount lifecycle.
 * (Overlay roots are inherently lifecycle-bound; test in a mount harness.)
 */
export function useMenuRoot(props: UseMenuRootProps = {}): UseMenuRootReturn {
  const open = props.open ?? ref(false)
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const modal = computed<boolean>(() => toValue(props.modal) ?? true)
  const content = ref<HTMLElement>()
  const isUsingKeyboardRef = useIsUsingKeyboard()

  function onOpenChange(value: boolean) {
    open.value = value
  }
  function onClose() {
    open.value = false
  }

  const menuContext: MenuContext = {
    open,
    onOpenChange,
    content,
    onContentChange: (element) => {
      content.value = element
    },
  }
  const menuRootContext: MenuRootContext = {
    onClose,
    dir: dir as Ref<Direction>,
    isUsingKeyboardRef,
    modal: modal as Ref<boolean>,
  }

  return { open, onOpenChange, onClose, menuContext, menuRootContext }
}

// -----------------------------------------------------------------------------
// 2. getMenuItemBaseSurface — the item render surface (MenuItemImpl)
// -----------------------------------------------------------------------------

export type MenuItemState = { disabled: boolean, highlighted: boolean }

export interface MenuItemBaseSurface extends PartSurface<MenuItemState> {
  /** Focus-driven half of the highlight (item also reads content's shared ref). */
  isFocused: Ref<boolean>
  isHighlighted: ComputedRef<boolean>
}

export interface MenuItemBaseOptions {
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /**
   * The item's own element ref (populated by the SFC after mount). REQUIRED: the
   * highlight identity check and pointer handlers compare against this element,
   * so a standalone caller must pass a ref it will populate.
   */
  currentElement: Ref<HTMLElement | undefined>
}

/**
 * The attr-bearing item surface shared by every item variant (they all render
 * through `MenuItemImpl`). A context-SCOPED FACTORY: it creates `isFocused` and
 * closes over `currentElement`, so call it EXACTLY ONCE per item instance (never
 * re-derive) — this is the axiom Tabs' pure builders don't need.
 *
 * `highlightedElement` is content-owned shared state; the item both reads it (for
 * `isHighlighted`) and writes it (on pointer-enter/focus) through the context.
 */
export function getMenuItemBaseSurface(
  contentContext: MenuContentContext,
  options: MenuItemBaseOptions,
): MenuItemBaseSurface {
  const { currentElement } = options
  const isDisabled = computed(() => toValue(options.disabled) ?? false)
  const isFocused = ref(false)
  const isHighlighted = computed(() =>
    isFocused.value || (currentElement.value != null && contentContext.highlightedElement.value === currentElement.value))

  async function handlePointerMove(event: PointerEvent) {
    if (event.defaultPrevented || !isMouseEvent(event))
      return
    if (isDisabled.value) {
      contentContext.onItemLeave(event)
    }
    else {
      const defaultPrevented = contentContext.onItemEnter(event)
      if (!defaultPrevented) {
        const item = event.currentTarget as HTMLElement
        contentContext.highlightedElement.value = item
        const isInputFocused = ['INPUT', 'TEXTAREA'].includes(getActiveElement()?.tagName || '')
        if (!isInputFocused)
          item.focus({ preventScroll: true })
      }
    }
  }

  async function handlePointerLeave(event: PointerEvent) {
    await nextTick()
    if (event.defaultPrevented)
      return
    if (!isMouseEvent(event))
      return
    // Stale-leave guard: if another item already claimed the highlight (its
    // synchronous pointermove ran before this nextTick), don't reset state.
    if (contentContext.highlightedElement.value !== currentElement.value)
      return
    const isMovingToSubmenu = contentContext.onItemLeave(event)
    if (!isMovingToSubmenu && contentContext.highlightedElement.value === currentElement.value)
      contentContext.highlightedElement.value = undefined
  }

  async function handleFocus(event: FocusEvent) {
    await nextTick()
    if (event.defaultPrevented || isDisabled.value)
      return
    isFocused.value = true
    contentContext.highlightedElement.value = event.currentTarget as HTMLElement
  }

  async function handleBlur(event: FocusEvent) {
    await nextTick()
    if (event.defaultPrevented)
      return
    isFocused.value = false
  }

  return {
    props: computed(() => ({
      'role': 'menuitem',
      'tabindex': -1,
      'aria-disabled': isDisabled.value || undefined,
      'onPointermove': handlePointerMove,
      'onPointerleave': handlePointerLeave,
      'onFocus': handleFocus,
      'onBlur': handleBlur,
    })),
    state: computed(() => ({ disabled: isDisabled.value, highlighted: isHighlighted.value })),
    isFocused,
    isHighlighted,
  }
}

// -----------------------------------------------------------------------------
// 3. getMenuItemSelectSurface — the select protocol (MenuItem)
// -----------------------------------------------------------------------------

export interface MenuItemSelectOptions {
  disabled?: MaybeRefOrGetter<boolean | undefined>
  currentElement: Ref<HTMLElement | undefined>
  /**
   * Select callback channel. The SFC passes `e => emits('select', e)`. NOT a DOM
   * event — `e` is a cancelable CustomEvent token; calling `preventDefault()` on
   * it keeps the menu open. This stays a callback (never a merged listener).
   */
  onSelect: (event: Event) => void
  /** Content search buffer, to suppress Space selection while typing ahead. */
  searchRef: Ref<string>
}

export interface MenuItemSelectSurface {
  /** Handlers only — no `state` (select semantics render no `data-*`). */
  props: ComputedRef<Record<string, any>>
  isPointerDownRef: Ref<boolean>
}

/**
 * The select layer added on top of the base surface. Ported verbatim from
 * `MenuItem.vue`: the CustomEvent-token protocol (emit → `await nextTick()` →
 * close unless `defaultPrevented`), and the pointerdown/pointerup/keydown wiring.
 * Handlers stay async so the `defaultPrevented`-after-`nextTick` consumer veto
 * keeps working once bound via `mergeProps` (surface handlers first).
 */
export function getMenuItemSelectSurface(
  rootContext: MenuRootContext,
  options: MenuItemSelectOptions,
): MenuItemSelectSurface {
  const isDisabled = computed(() => toValue(options.disabled) ?? false)
  const isPointerDownRef = ref(false)

  async function handleSelect() {
    const menuItem = options.currentElement.value
    if (!isDisabled.value && menuItem) {
      const itemSelectEvent = new CustomEvent(ITEM_SELECT, { bubbles: true, cancelable: true })
      options.onSelect(itemSelectEvent)
      await nextTick()
      if (itemSelectEvent.defaultPrevented)
        isPointerDownRef.value = false
      else
        rootContext.onClose()
    }
  }

  return {
    props: computed(() => ({
      onClick: handleSelect,
      onPointerdown: () => {
        isPointerDownRef.value = true
      },
      onPointerup: async (event: PointerEvent) => {
        await nextTick()
        if (event.defaultPrevented)
          return
        // Pointer down can move to a different item which should activate on
        // pointer up; dispatch a click so click-based triggers compose and
        // Firefox doesn't get stuck in text-selection mode when the menu closes.
        if (!isPointerDownRef.value)
          (event.currentTarget as HTMLElement)?.click()
      },
      onKeydown: async (event: KeyboardEvent) => {
        const isTypingAhead = options.searchRef.value !== ''
        if (isDisabled.value || (isTypingAhead && event.key === ' '))
          return
        if (SELECTION_KEYS.includes(event.key)) {
          (event.currentTarget as HTMLElement)?.click()
          // Selection keys should only select: prevent Space from scrolling and
          // prevent keydown re-firing on a new target if focus moved.
          event.preventDefault()
        }
      },
    })),
    isPointerDownRef,
  }
}
