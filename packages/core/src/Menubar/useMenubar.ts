import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { MenubarMenuContext } from './MenubarMenu.vue'
import type { MenubarRootContext } from './MenubarRoot.vue'
import type { MenuOpenChangeReason } from '@/Menu'
import type { MenuContext, MenuRootContext } from '@/Menu/MenuRoot.vue'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import type { Direction } from '@/shared/types'
import { computed, ref, toValue, watch } from 'vue'
import { useMenuRoot } from '@/Menu/useMenu'
import { createPartSurface, disclosureState, useControllableState } from '@/shared'
import { wrapArray } from '@/shared/useTypeahead'

// =============================================================================
// Headless composables for the Menubar family — issue #2723.
//
// Menubar owns ONE model — `modelValue`, the value of the open menu (`''` when
// none is) — through `useControllableState`, so every open/close/switch goes
// through one cancellable `beforeUpdate:modelValue`. Each `MenubarMenu` is a
// Menu whose `open` is DERIVED from that model: `useMenubarMenu()` composes
// `useMenuRoot()` with `open = modelValue === value` and routes the Menu's own
// close requests (item select, Escape, outside press) back to the menubar model
// with their reason. RovingFocusGroup/Collection/PopperRoot/MenuContent stay
// wrappers in the SFCs.
// =============================================================================

/**
 * Why the menubar's `modelValue` changed — the Menu union: `trigger-press`
 * (pointer down, Enter/Space/ArrowDown on a trigger), `trigger-hover` (moving
 * to another trigger while a menu is open), `list-navigation` (ArrowLeft/Right
 * inside a menu), and the Menu close reasons (`item-press`, `escape-key`,
 * `outside-press`, `focus-outside`).
 */
export type MenubarChangeReason = MenuOpenChangeReason

/** Semantic state of a menubar trigger (`data-highlighted`, `data-state`, `data-disabled`). */
export type MenubarTriggerState = { highlighted: boolean, state: DisclosureState, disabled: boolean }

/** A Collection item as `useCollection().getItems()` returns it. */
export interface MenubarCollectionItem { ref: HTMLElement }

const TRIGGER_KEYS = ['Enter', ' ', 'ArrowDown']

/** The root surface: `role="menubar"`; renders no `data-*`. */
export function getMenubarRootSurface(): PartSurface<Record<string, never>> {
  return createPartSurface<Record<string, never>>(() => ({ role: 'menubar' }), () => ({}))
}

export interface UseMenubarProps {
  /**
   * Controlled value of the open menu. A getter/ref resolving to `undefined` is
   * uncontrolled; a writable `Ref` (with no `emit`/`onUpdate`) is written back.
   */
  modelValue?: MaybeRefOrGetter<string | undefined>
  /** Initial open menu when uncontrolled. @defaultValue `''` */
  defaultValue?: string
  /** Resolved reading direction (the SFC hands its `useDirection` ref). @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** Loop keyboard navigation between menus. @defaultValue `false` */
  loop?: MaybeRefOrGetter<boolean | undefined>
  /** Component `emit`; receives `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: string, details: ChangeEventDetails<MenubarChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: string, details: ChangeEventDetails<MenubarChangeReason>) => void
}

export interface UseMenubarReturn {
  /** The value of the open menu; `''` when every menu is closed. */
  modelValue: ComputedRef<string>
  /** Opens the menu `value` (or switches to it). Returns `false` when unchanged or cancelled. */
  onMenuOpen: (value: string, reason?: MenubarChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Closes the open menu. Returns `false` when unchanged or cancelled. */
  onMenuClose: (reason?: MenubarChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Closes the open menu, or opens `value` when none is. Returns `false` when unchanged or cancelled. */
  onMenuToggle: (value: string, reason?: MenubarChangeReason | BaseChangeReason, event?: Event) => boolean
  /** The `RovingFocusGroup` tab stop (`v-model:current-tab-stop-id`). */
  currentTabStopId: Ref<string | null>
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<MenubarChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** `role="menubar"` for the root element. */
  root: PartSurface<Record<string, never>>
  /** The `MenubarRootContext` value — the SFC provides this verbatim. */
  context: MenubarRootContext
}

/**
 * Headless Menubar root: the open-menu model and the roving tab stop. The SFC
 * keeps `RovingFocusGroup` (arrow keys between triggers) and the Collection.
 *
 * SSR-safe and callable outside `setup()` — no watchers or lifecycle hooks.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useMenubar(props: UseMenubarProps = {}): UseMenubarReturn {
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<string, MenubarChangeReason>({
    prop: props.modelValue,
    defaultValue: props.defaultValue ?? '',
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const loop = computed<boolean>(() => toValue(props.loop) ?? false)
  const currentTabStopId = ref<string | null>(null)

  function onMenuOpen(value: string, reason?: MenubarChangeReason | BaseChangeReason, event?: Event) {
    const changed = setState(value, reason, event)
    currentTabStopId.value = value
    return changed
  }
  function onMenuClose(reason?: MenubarChangeReason | BaseChangeReason, event?: Event) {
    return setState('', reason, event)
  }
  function onMenuToggle(value: string, reason?: MenubarChangeReason | BaseChangeReason, event?: Event) {
    const changed = setState(modelValue.value ? '' : value, reason, event)
    // `onMenuOpen` and `onMenuToggle` are called exclusively so we
    // need to update the id in either case.
    currentTabStopId.value = value
    return changed
  }

  const context: MenubarRootContext = {
    modelValue,
    dir: dir as Ref<Direction>,
    loop: loop as Ref<boolean>,
    onMenuOpen,
    onMenuClose,
    onMenuToggle,
  }

  return {
    modelValue,
    onMenuOpen,
    onMenuClose,
    onMenuToggle,
    currentTabStopId,
    lastChangeDetails,
    isControlled,
    root: getMenubarRootSurface(),
    context,
  }
}

export interface UseMenubarMenuOptions {
  /** The menu's value (the SFC hands its `useId(props.value)`); also its trigger id. */
  value: string
  /** The content id. Defaults to `<value>-content`; the SFC hands an SSR-stable `useId`. */
  contentId?: string
  /** Disables the returned trigger surface. */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /**
   * The menubar triggers, for the returned content's ArrowLeft/Right switching
   * (`useCollection({ key: 'Menubar' }).getItems`, or the trigger elements of a
   * standalone bar). Without it the content does not switch menus.
   */
  getItems?: () => MenubarCollectionItem[]
}

export interface UseMenubarMenuReturn {
  /** `true` while the menubar's `modelValue` is this menu's value. */
  open: ComputedRef<boolean>
  /** The trigger surface; it focuses `context.triggerElement` when hover switches to it. */
  trigger: PartSurface<MenubarTriggerState>
  /** The content surface plus its `MenuContent` handlers. */
  content: MenubarContentSurface
  /** The `MenubarMenuContext` value — the SFC provides this verbatim. */
  context: MenubarMenuContext
  /** The `MenuContext` value from `useMenuRoot()` — the SFC provides this verbatim. */
  menuContext: MenuContext
  /** The `MenuRootContext` value from `useMenuRoot()` — the SFC provides this verbatim. */
  menuRootContext: MenuRootContext
}

/**
 * One menu of the menubar. Composes `useMenuRoot()` with `open` derived from the
 * menubar model and `modal: false`; a Menu close request (item select, Escape,
 * outside press) becomes `onMenuClose(reason, event)` on the menubar, so it is
 * reported — and cancellable — through `beforeUpdate:modelValue`.
 *
 * NOT callable outside `setup()` — `useMenuRoot()` binds `useIsUsingKeyboard`
 * and the keyboard-open flag resets through a watcher.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup
 */
export function useMenubarMenu(rootContext: MenubarRootContext, options: UseMenubarMenuOptions): UseMenubarMenuReturn {
  const { value } = options
  const open = computed(() => rootContext.modelValue.value === value)
  const wasKeyboardTriggerOpenRef = ref(false)

  watch(open, () => {
    if (!open.value)
      wasKeyboardTriggerOpenRef.value = false
  })

  const { menuContext, menuRootContext } = useMenuRoot({
    open,
    modal: false,
    dir: rootContext.dir,
    // Menu only requests a change when dismissing, so close the menubar on
    // the same events (and with the same reason).
    onUpdate: (next, details) => {
      if (!next)
        rootContext.onMenuClose(details.reason, details.event)
    },
  })

  const context: MenubarMenuContext = {
    value,
    triggerElement: ref<HTMLElement>(),
    triggerId: value,
    contentId: options.contentId ?? `${value}-content`,
    wasKeyboardTriggerOpenRef,
  }

  return {
    open,
    trigger: createMenubarTriggerSurface(rootContext, context, {
      disabled: options.disabled,
      // Read through the context: the trigger SFC swaps in its own element ref on mount.
      triggerElement: () => context.triggerElement.value,
    }),
    content: createMenubarContentSurface(rootContext, context, { getItems: options.getItems ?? (() => []) }),
    context,
    menuContext,
    menuRootContext,
  }
}

export interface MenubarTriggerOptions {
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** The trigger's own element (the SFC's `useForwardElement` element); focused on hover-switch. */
  triggerElement: MaybeRefOrGetter<HTMLElement | undefined | null>
}

/**
 * The trigger surface: `role="menuitem"`, aria wiring, the `data-value`
 * selector the arrow navigation reads, and the pointer/keyboard handlers ported
 * verbatim from `MenubarTrigger`. A context-scoped FACTORY (it owns the
 * per-instance focus flag behind `data-highlighted`): call it once per trigger.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function createMenubarTriggerSurface(
  rootContext: MenubarRootContext,
  menuContext: MenubarMenuContext,
  options: MenubarTriggerOptions,
): PartSurface<MenubarTriggerState> {
  const isDisabled = () => toValue(options.disabled) ?? false
  const isFocused = ref(false)
  const open = computed(() => rootContext.modelValue.value === menuContext.value)

  return createPartSurface<MenubarTriggerState>(
    () => ({
      'id': menuContext.triggerId,
      'role': 'menuitem',
      'aria-haspopup': 'menu',
      'aria-expanded': open.value,
      'aria-controls': open.value ? menuContext.contentId : undefined,
      'disabled': isDisabled(),
      // Functional selector: the content's ArrowLeft/Right navigation reads it.
      'data-value': menuContext.value,
      'onPointerdown': (event: PointerEvent) => {
        if (event.defaultPrevented)
          return
        // only call handler if it's the left button (mousedown gets triggered by all mouse buttons)
        // but not when the control key is pressed (avoiding MacOS right click)
        if (!isDisabled() && event.button === 0 && event.ctrlKey === false) {
          rootContext.onMenuOpen(menuContext.value, 'trigger-press', event)
          // prevent trigger focusing when opening
          // this allows the content to be given focus without competition
          if (!open.value)
            event.preventDefault()
        }
      },
      'onPointerenter': (event: PointerEvent) => {
        const menubarOpen = Boolean(rootContext.modelValue.value)
        if (menubarOpen && !open.value) {
          rootContext.onMenuOpen(menuContext.value, 'trigger-hover', event)
          toValue(options.triggerElement)?.focus()
        }
      },
      'onKeydown': (event: KeyboardEvent) => {
        if (!TRIGGER_KEYS.includes(event.key))
          return
        if (isDisabled() || event.defaultPrevented)
          return
        if (['Enter', ' '].includes(event.key))
          rootContext.onMenuToggle(menuContext.value, 'trigger-press', event)
        if (event.key === 'ArrowDown')
          rootContext.onMenuOpen(menuContext.value, 'trigger-press', event)
        // prevent keydown from scrolling window / first focused item to execute
        // that keydown (inadvertently closing the menu)
        menuContext.wasKeyboardTriggerOpenRef.value = true
        event.preventDefault()
      },
      'onFocus': () => {
        isFocused.value = true
      },
      'onBlur': () => {
        isFocused.value = false
      },
    }),
    () => ({ highlighted: isFocused.value, state: disclosureState(open.value), disabled: isDisabled() }),
  )
}

/**
 * The value of the menu ArrowLeft/Right moves to from `currentValue`, or
 * `undefined` at the end of a non-looping bar. Disabled triggers are skipped.
 */
function getNextMenuValue(items: MenubarCollectionItem[], currentValue: string, reverse: boolean, loop: boolean) {
  let candidateValues = items.filter(i => i.ref.dataset.disabled !== '').map(i => i.ref.dataset.value)
  if (reverse)
    candidateValues.reverse()

  const currentIndex = candidateValues.indexOf(currentValue)

  candidateValues = loop
    ? wrapArray(candidateValues, currentIndex + 1)
    : candidateValues.slice(currentIndex + 1)

  return candidateValues[0]
}

export interface MenubarContentOptions {
  /** The menubar triggers (`useCollection({ key: 'Menubar' }).getItems`). */
  getItems: () => MenubarCollectionItem[]
}

export interface MenubarContentSurface extends PartSurface<Record<string, never>> {
  /** `MenuContent` `closeAutoFocus`: refocuses the trigger once the whole menubar closed. */
  onCloseAutoFocus: (event: Event) => void
  /** `MenuContent` `focusOutside`: moving focus to another trigger does not dismiss. */
  onFocusOutside: (event: Event) => void
  /** `MenuContent` `interactOutside`. */
  onInteractOutside: (event: Event) => void
  /** `MenuContent` `entryFocus`: only a keyboard open focuses the first item. */
  onEntryFocus: (event: Event) => void
  /** ArrowLeft/ArrowRight inside the menu switches to the neighbouring menu (`list-navigation`). */
  onKeydown: (event: KeyboardEvent) => void
}

/**
 * The content surface: `id`, `aria-labelledby`, the `data-reka-menubar-content`
 * selector, and the `MenuContent` handlers ported verbatim from
 * `MenubarContent`. A context-scoped FACTORY (it owns the per-instance
 * "interacted outside" flag): call it once per content instance.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function createMenubarContentSurface(
  rootContext: MenubarRootContext,
  menuContext: MenubarMenuContext,
  options: MenubarContentOptions,
): MenubarContentSurface {
  let hasInteractedOutside = false
  const surface = createPartSurface<Record<string, never>>(
    () => ({
      'id': menuContext.contentId,
      'aria-labelledby': menuContext.triggerId,
      // Functional selector, not state.
      'data-reka-menubar-content': '',
    }),
    () => ({}),
  )

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft')
      return
    const target = event.target as HTMLElement
    const targetIsSubTrigger = target.hasAttribute('data-reka-menubar-subtrigger')

    const prevMenuKey = rootContext.dir.value === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    const isPrevKey = prevMenuKey === event.key
    const isNextKey = !isPrevKey

    // Prevent navigation when we're opening a submenu
    if (isNextKey && targetIsSubTrigger)
      return

    const nextValue = getNextMenuValue(options.getItems(), menuContext.value, isPrevKey, rootContext.loop.value)
    if (nextValue)
      rootContext.onMenuOpen(nextValue, 'list-navigation', event)
  }

  return {
    ...surface,
    onCloseAutoFocus: (event) => {
      const menubarOpen = Boolean(rootContext.modelValue.value)
      if (!menubarOpen && !hasInteractedOutside)
        menuContext.triggerElement.value?.focus()

      hasInteractedOutside = false
      // Always prevent auto focus because we either focus manually or want user agent focus
      event.preventDefault()
    },
    onFocusOutside: (event) => {
      const target = event.target as HTMLElement
      const isMenubarTrigger = options.getItems().filter(i => i.ref.dataset.disabled !== '').some(i => i.ref.contains(target))
      if (isMenubarTrigger)
        event.preventDefault()
    },
    onInteractOutside: () => {
      hasInteractedOutside = true
    },
    onEntryFocus: (event) => {
      if (!menuContext.wasKeyboardTriggerOpenRef.value)
        event.preventDefault()
    },
    onKeydown,
  }
}

/**
 * The submenu content's ArrowRight handler, ported verbatim from
 * `MenubarSubContent`: from a non-sub-trigger item it switches to the next
 * menu of the bar (`list-navigation`).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function createMenubarSubContentKeydown(
  rootContext: MenubarRootContext,
  menuContext: MenubarMenuContext,
  options: MenubarContentOptions,
): (event: KeyboardEvent) => void {
  return (event) => {
    if (event.key !== 'ArrowRight')
      return
    const target = event.target as HTMLElement
    const targetIsSubTrigger = target.hasAttribute('data-reka-menubar-subtrigger')

    // Prevent navigation when we're opening a submenu
    if (targetIsSubTrigger)
      return

    const nextValue = getNextMenuValue(options.getItems(), menuContext.value, false, rootContext.loop.value)
    if (nextValue)
      rootContext.onMenuOpen(nextValue, 'list-navigation', event)
  }
}
