import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { MenuContentContext } from './MenuContentImpl.vue'
import type { MenuContext, MenuRootContext } from './MenuRoot.vue'
import type { Direction, GraceIntent, Side } from './utils'
import type { PartSurface } from '@/shared'
import { computed, nextTick, onUnmounted, ref, toValue, watch } from 'vue'
import { getActiveElement, useArrowNavigation, useTypeahead } from '@/shared'
import { useIsUsingKeyboard } from '@/shared/useIsUsingKeyboard'
import { FIRST_LAST_KEYS, focusFirst, getOpenState, isMouseEvent, isPointerInGraceArea, ITEM_SELECT, LAST_KEYS, SELECTION_KEYS } from './utils'

// =============================================================================
// Headless composables for the Menu (overlay) family — issue #2723.
//
// Validates that the useX() pattern extends to an OVERLAY family, and documents
// where it bends. Findings: docs/superpowers/pocs/2723-menu-overlay-composable.md.
//
// Four shapes are exercised:
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
//  4. useMenuContent()         — the overlay BRAIN (typeahead/arrow-nav/pointer-
//                                grace/highlight). Returns the role=menu surface +
//                                MenuContentContext; the 4 wrappers stay in the SFC.
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

// -----------------------------------------------------------------------------
// 4. useMenuContent — the overlay BRAIN (MenuContentImpl)
//
// The finding this proves: the recipe deferred overlays because "their logic
// lives in content-part wrappers", but the MAJORITY of MenuContentImpl's logic —
// typeahead, arrow-nav, the pointer-grace/direction machine, and highlight
// ownership — is wrapper-INDEPENDENT and extracts here. FocusScope/DismissableLayer/
// RovingFocusGroup/PopperContent (+ the two mount side-effects useFocusGuards /
// useBodyScrollLock) stay in the SFC. The wrappers are the shell; this is the brain.
//
// The one genuine seam: `RovingFocusGroup.getItems()` is a template-instance-ref
// call the composable cannot make — the SFC injects it as `getItems`.
// -----------------------------------------------------------------------------

export interface MenuContentItem { ref: HTMLElement, value?: any }

export interface UseMenuContentOptions {
  menuContext: MenuContext
  rootContext: MenuRootContext
  /** The content element ref (the SFC's `useForwardExpose` currentElement). */
  contentElement: Ref<HTMLElement | undefined>
  /**
   * Roving-focus/collection items. `rovingFocusGroupRef.getItems()` is a
   * template-instance-ref call the composable can't make — the SFC injects it.
   * This is the wrapper seam.
   */
  getItems: () => MenuContentItem[]
  /** @defaultValue `false` */
  loop?: MaybeRefOrGetter<boolean | undefined>
  /** `openAutoFocus` passthrough (SFC: `e => emits('openAutoFocus', e)`). */
  onOpenAutoFocus?: (event: Event) => void
}

export type MenuContentState = { state: 'open' | 'closed' }

export interface UseMenuContentReturn {
  /** The `role=menu` surface for `PopperContent`; positioning props stay in the SFC. */
  content: PartSurface<MenuContentState>
  /** The context the SFC provides via `provideMenuContentContext`. */
  contentContext: MenuContentContext
  /** `FocusScope` `@mount-auto-focus` — focuses content, honors the openAutoFocus veto. */
  handleMountAutoFocus: (event: Event) => void
  /** `RovingFocusGroup` `v-model:current-tab-stop-id`. */
  currentItemId: Ref<string | null>
  highlightedElement: Ref<HTMLElement | undefined>
  searchRef: Ref<string>
}

/**
 * Headless Menu content — the keyboard/pointer/highlight brain. Returns the
 * `role=menu` surface + the `MenuContentContext` value; the SFC keeps the four
 * component wrappers and the two mount side-effects. Owns watchers + `onUnmounted`,
 * so it runs inside the mounted content's `setup()` (not standalone-callable).
 */
export function useMenuContent(options: UseMenuContentOptions): UseMenuContentReturn {
  const { menuContext, rootContext, contentElement, getItems } = options
  const loop = () => toValue(options.loop) ?? false

  const searchRef = ref('')
  const timerRef = ref(0)
  const pointerGraceTimerRef = ref(0)
  const pointerGraceIntentRef = ref<GraceIntent | null>(null)
  const pointerDirRef = ref<Side>('right')
  const lastPointerXRef = ref(0)
  const currentItemId = ref<string | null>(null)
  const highlightedElement = ref<HTMLElement>()
  const filterElement = ref<HTMLElement>()
  const activeSubmenuContext = ref<{ onOpenChange: (open: boolean) => void, trigger: Ref<HTMLElement | undefined> }>()

  const { handleTypeaheadSearch } = useTypeahead()

  function onKeydownNavigation(event: KeyboardEvent) {
    const el = useArrowNavigation(
      event,
      (highlightedElement.value || getActiveElement()) as HTMLElement,
      contentElement.value,
      { loop: loop(), arrowKeyOptions: 'vertical', dir: rootContext?.dir.value, focus: false, attributeName: '[data-reka-collection-item]:not([data-disabled])' },
    )
    if (el) {
      highlightedElement.value = el
      el.scrollIntoView({ block: 'nearest' })
    }
  }

  function onKeydownEnter() {
    if (highlightedElement.value)
      highlightedElement.value.click()
  }

  function isPointerMovingToSubmenu(event: PointerEvent) {
    const isMovingTowards = pointerDirRef.value === pointerGraceIntentRef.value?.side
    return isMovingTowards && isPointerInGraceArea(event, pointerGraceIntentRef.value?.area)
  }

  function handleMountAutoFocus(event: Event) {
    options.onOpenAutoFocus?.(event)
    if (event.defaultPrevented)
      return
    // focus the content area only; onEntryFocus controls focusing the first item
    event.preventDefault()
    contentElement.value?.focus({ preventScroll: true })
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented)
      return
    // submenu key events bubble through portals; only handle keys in this menu.
    const target = event.target as HTMLElement
    const isKeyDownInside = target.closest('[data-reka-menu-content]') === event.currentTarget
    const isKeyDownInTextField = ['input', 'textarea'].includes(target.tagName.toLowerCase())
    const isModifierKey = event.ctrlKey || event.altKey || event.metaKey
    const isCharacterKey = event.key.length === 1

    const el = useArrowNavigation(
      event,
      getActiveElement() as HTMLElement,
      contentElement.value,
      { loop: loop(), arrowKeyOptions: 'vertical', dir: rootContext?.dir.value, focus: true, attributeName: '[data-reka-collection-item]:not([data-disabled])' },
    )
    if (el)
      return el?.focus()

    // prevent "Space" being taken into typeahead
    if (event.code === 'Space')
      return

    const collectionItems = getItems() ?? []
    if (isKeyDownInside) {
      if (event.key === 'Tab' && rootContext.modal.value)
        event.preventDefault()
      if (!isModifierKey && isCharacterKey && !isKeyDownInTextField)
        handleTypeaheadSearch(event.key, collectionItems)
    }

    if (event.target !== contentElement.value)
      return
    if (!FIRST_LAST_KEYS.includes(event.key))
      return
    event.preventDefault()
    const candidateNodes = [...collectionItems.map(item => item.ref)]
    if (LAST_KEYS.includes(event.key))
      candidateNodes.reverse()
    focusFirst(candidateNodes)
  }

  function handleBlur(event: FocusEvent) {
    // clear the search buffer when focus leaves the menu
    // @ts-expect-error the provided currentTarget and target should be HTMLElement
    if (!event?.currentTarget?.contains?.(event.target)) {
      window.clearTimeout(timerRef.value)
      searchRef.value = ''
    }
  }

  function handlePointerMove(event: PointerEvent) {
    if (!isMouseEvent(event))
      return
    const target = event.target as HTMLElement
    const pointerXHasChanged = lastPointerXRef.value !== event.clientX
    // not `event.movementX` — Safari always returns 0 on a pointer event.
    if ((event?.currentTarget as HTMLElement)?.contains(target) && pointerXHasChanged) {
      pointerDirRef.value = event.clientX > lastPointerXRef.value ? 'right' : 'left'
      lastPointerXRef.value = event.clientX
    }
  }

  function handlePointerEnter(event: PointerEvent) {
    if (!isMouseEvent(event))
      return
    // hovering a menu content (main or sub) focuses its filter element if present
    if (filterElement.value)
      filterElement.value.focus()
  }

  watch(highlightedElement, (el) => {
    if (activeSubmenuContext.value && (el === undefined || el !== activeSubmenuContext.value.trigger.value)) {
      // Only close when the highlight moves to a DIFFERENT parent item; a
      // disappearing highlight (pointer left all items) must not close it.
      if (el === undefined)
        return
      activeSubmenuContext.value.onOpenChange(false)
      activeSubmenuContext.value = undefined
    }
  })

  watch(contentElement, (el) => {
    menuContext.onContentChange(el)
  })

  onUnmounted(() => {
    window.clearTimeout(timerRef.value)
  })

  const contentContext: MenuContentContext = {
    onItemEnter: event => isPointerMovingToSubmenu(event),
    onItemLeave: (event) => {
      if (isPointerMovingToSubmenu(event))
        return true
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(getActiveElement()?.tagName || '')
      if (!isInputFocused)
        contentElement.value?.focus()
      currentItemId.value = null
      return false
    },
    onTriggerLeave: event => isPointerMovingToSubmenu(event),
    searchRef,
    highlightedElement,
    onKeydownNavigation,
    onKeydownEnter,
    filterElement,
    onFilterElementChange: (el) => {
      filterElement.value = el
    },
    activeSubmenuContext,
    pointerGraceTimerRef,
    onPointerGraceIntentChange: (intent) => {
      pointerGraceIntentRef.value = intent
    },
  }

  const content: PartSurface<MenuContentState> = {
    props: computed(() => ({
      'role': 'menu',
      'aria-orientation': 'vertical',
      // Functional selector (submenu `closest()` scoping) — lives in `props`,
      // exempt from the no-`data-*` rule; NOT routed through stateToDataAttrs.
      'data-reka-menu-content': '',
      'dir': rootContext.dir.value,
      'onKeydown': handleKeyDown,
      'onBlur': handleBlur,
      'onPointermove': handlePointerMove,
      'onPointerenter': handlePointerEnter,
    })),
    state: computed(() => ({ state: getOpenState(menuContext.open.value) })),
  }

  return { content, contentContext, handleMountAutoFocus, currentItemId, highlightedElement, searchRef }
}
