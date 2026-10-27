import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { NavigationMenuItemContext } from './NavigationMenuItem.vue'
import type { NavigationMenuContext } from './NavigationMenuRoot.vue'
import type { Direction, Orientation } from './utils'
import type { FocusOutsideEvent, PointerDownOutsideEvent } from '@/DismissableLayer'
import type { BaseChangeReason, ChangeEventDetails, DisclosureState, PartSurface } from '@/shared'
import { refAutoReset, useDebounceFn, useResizeObserver } from '@vueuse/core'
import { computed, nextTick, ref, toValue, watch, watchEffect } from 'vue'
import {
  createPartSurface,
  disclosureState,
  getActiveElement,
  getElementByIdFrom,
  useArrowNavigation,
  useControllableState,
} from '@/shared'
import {
  EVENT_ROOT_CONTENT_DISMISS,
  focusFirst,
  getTabbableCandidates,
  LINK_SELECT,
  makeContentId,
  makeTriggerId,
  removeFromTabOrder,
  whenMouse,
} from './utils'

// =============================================================================
// Headless composables for the NavigationMenu family — issue #2723.
//
// NavigationMenu is a disclosure family with hover intent: the root owns ONE
// string model (the value of the open item, `''` when every item is closed)
// and every interaction — the delayed hover open, the pointer-leave close, a
// trigger press, Escape, an outside press, a focus move and a link press —
// funnels through one `setState`, so `beforeUpdate:modelValue` can cancel any
// of them and `update:modelValue` carries the reason (#2828).
//
// Per-part composables are context-scoped factories (they own per-instance
// state such as the hover-opened latch of a trigger or the previous motion
// attribute of a content), so each is called EXACTLY ONCE per part instance,
// by its SFC or by a standalone consumer. Collection, Presence, Teleport,
// DismissableLayer and VisuallyHidden stay wrappers in the shells; a
// standalone consumer composes them itself (see the #2723 recipe's
// "Component-wrapper behaviors stay wrappers").
// =============================================================================

/**
 * Why the open item of a navigation menu changed (#2828); the `reason` of
 * `ChangeEventDetails`.
 *
 * - `trigger-press`: a click, Enter or Space on a trigger.
 * - `trigger-hover`: the pointer opened an item (after `delayDuration`, or at
 *   once when moving from one open trigger to another).
 * - `pointer-leave`: the pointer left a trigger or the content and the close
 *   delay elapsed.
 * - `escape-key`, `outside-press`, `focus-outside`: the content was dismissed.
 * - `link-press`: a `NavigationMenuLink` was selected.
 */
export type NavigationMenuChangeReason
  = | 'trigger-press'
    | 'trigger-hover'
    | 'pointer-leave'
    | 'escape-key'
    | 'outside-press'
    | 'focus-outside'
    | 'link-press'

/** Direction of the content's enter/leave animation; `data-motion`. */
export type NavigationMenuMotion = 'to-start' | 'to-end' | 'from-start' | 'from-end'

/** Semantic state of the root and sub parts; `data-orientation`. */
export type NavigationMenuRootState = { orientation: Orientation }
/** Semantic state of the list part; `data-orientation`. */
export type NavigationMenuListState = { orientation: Orientation }
/** Semantic state of a trigger; `data-state` / `data-disabled`. */
export type NavigationMenuTriggerState = { state: DisclosureState, disabled: boolean }
/** Semantic state of a content; `data-state` / `data-motion` / `data-orientation`. */
export type NavigationMenuContentState = { state: DisclosureState, motion: NavigationMenuMotion | null, orientation: Orientation }
/** Semantic state of the indicator; `data-state` / `data-orientation`. */
export type NavigationMenuIndicatorState = { state: DisclosureState, orientation: Orientation }
/** Semantic state of the viewport; `data-state` / `data-orientation`. */
export type NavigationMenuViewportState = { state: DisclosureState, orientation: Orientation }
/** Semantic state of a link; `data-active`. */
export type NavigationMenuLinkState = { active: boolean }

type ChangeReason = NavigationMenuChangeReason | BaseChangeReason

/** Detail of the `navigationMenu.rootContentDismiss` event: why the menu is being dismissed. */
export interface NavigationMenuDismissDetail {
  reason?: ChangeReason
  originalEvent?: Event
}

/** Dismiss events already handled by a root content, so the root listener does not retry a cancelled close. */
const handledDismissEvents = new WeakSet<Event>()

function readDismissDetail(event: Event): NavigationMenuDismissDetail {
  return (event as CustomEvent<NavigationMenuDismissDetail | null>).detail ?? {}
}

/** Standalone calls without a `baseId` draw `reka-navigation-menu-<n>` from here. */
let navigationMenuCount = 0

function getNavigationMenuRootSurface(
  context: NavigationMenuContext,
): PartSurface<NavigationMenuRootState> {
  return createPartSurface<NavigationMenuRootState>(
    () => ({
      // Only the root renders `dir`; a sub menu inherits it from the DOM.
      'dir': context.isRootMenu ? context.dir.value : undefined,
      // Functional selector: content keydown scopes itself with `closest()`.
      'data-reka-navigation-menu': '',
    }),
    () => ({ orientation: context.orientation }),
  )
}

/** The list surface (`data-orientation`), derived purely from the context. @internal */
export function getNavigationMenuListSurface(context: NavigationMenuContext): PartSurface<NavigationMenuListState> {
  return createPartSurface<NavigationMenuListState>(
    () => ({}),
    () => ({ orientation: context.orientation }),
  )
}

interface ModelCallbacks {
  /** Component `emit`; receives `beforeUpdate:modelValue` then `update:modelValue`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: string, details: ChangeEventDetails<NavigationMenuChangeReason>) => void
  /** Called after a change commits. */
  onUpdate?: (value: string, details: ChangeEventDetails<NavigationMenuChangeReason>) => void
}

function useActiveTrigger(modelValue: Readonly<Ref<string>>, getItems?: () => HTMLElement[]) {
  const activeTrigger = ref<HTMLElement>()
  if (getItems) {
    watchEffect(() => {
      if (!modelValue.value)
        return

      activeTrigger.value = getItems().find(item =>
        item.id.includes(modelValue.value),
      )
    })
  }
  return activeTrigger
}

export interface UseNavigationMenuProps extends ModelCallbacks {
  /**
   * Controlled value of the open item. A getter/ref resolving to `undefined` is
   * uncontrolled; a writable `Ref` (with no `emit`/`onUpdate`) is written back.
   */
  modelValue?: MaybeRefOrGetter<string | undefined>
  /** The item open on first render when uncontrolled. @defaultValue `''` */
  defaultValue?: string
  /** Reading direction. @defaultValue `'ltr'` */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** Orientation of the menu. Read once. @defaultValue `'horizontal'` */
  orientation?: Orientation
  /** Delay (ms) from hovering a trigger until it opens. @defaultValue `200` */
  delayDuration?: MaybeRefOrGetter<number | undefined>
  /** Time (ms) after a close during which another trigger opens without the delay. @defaultValue `300` */
  skipDelayDuration?: MaybeRefOrGetter<number | undefined>
  /** When `true`, a mouse click does not toggle a trigger. @defaultValue `false` */
  disableClickTrigger?: MaybeRefOrGetter<boolean | undefined>
  /** When `true`, hovering a trigger does not open it. @defaultValue `false` */
  disableHoverTrigger?: MaybeRefOrGetter<boolean | undefined>
  /** When `true`, leaving the trigger or content does not close the menu. @defaultValue `false` */
  disablePointerLeaveClose?: MaybeRefOrGetter<boolean | undefined>
  /** When `true`, closed contents and the viewport unmount. @defaultValue `true` */
  unmountOnHide?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Base id the trigger and content ids derive from. Defaults to
   * `reka-navigation-menu-<n>` from a per-call counter, which is NOT stable
   * across server and client: SSR consumers must pass a stable `baseId` (the
   * SFC hands its `useId(undefined, 'reka-navigation-menu')`).
   */
  baseId?: string
  /** The menu's root element, used to scope keyboard handling and outside-focus checks. */
  rootElement?: Ref<HTMLElement | undefined>
  /** The triggers and links in DOM order (the SFC hands its collection), used to track the active trigger. */
  getItems?: () => HTMLElement[]
}

export interface UseNavigationMenuReturn {
  /** The value of the open item; `''` when closed. */
  modelValue: ComputedRef<string>
  /** The previously open item, kept so a closing content stays mounted while the viewport animates. */
  previousValue: Ref<string>
  /** The trigger of the open item, for the indicator and viewport position. */
  activeTrigger: Ref<HTMLElement | undefined>
  /** Opens `value` (or closes with `''`) immediately. Returns `false` when unchanged or cancelled. */
  onItemSelect: (value: string, reason?: ChangeReason, event?: Event) => boolean
  /** Closes the menu immediately. Returns `false` when unchanged or cancelled. */
  onItemDismiss: (reason?: ChangeReason, event?: Event) => boolean
  /** Details of the last change attempt; initially `{ reason: 'none' }`. */
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<NavigationMenuChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** `dir` + `data-orientation` + the `data-reka-navigation-menu` selector. */
  root: PartSurface<NavigationMenuRootState>
  /** `data-orientation`. */
  list: PartSurface<NavigationMenuListState>
  /** The `NavigationMenuContext` value — the SFC provides this verbatim. */
  context: NavigationMenuContext
}

/**
 * Headless NavigationMenu root logic: the open-item model with hover intent
 * (`delayDuration`, `skipDelayDuration`), the pointer-leave close and the
 * context every part reads. A standalone consumer gets the model, the root and
 * list surfaces and the context to hand to `useNavigationMenuItem()` and the
 * other part composables.
 *
 * The delayed open and close are debounced: the timer, not the handler, calls
 * `setState`, carrying the reason and event of the interaction that armed it.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — debounce and auto-reset timers and the active-trigger
 * watcher are bound to the calling component or effect scope.
 */
export function useNavigationMenu(props: UseNavigationMenuProps = {}): UseNavigationMenuReturn {
  const baseId = props.baseId ?? `reka-navigation-menu-${++navigationMenuCount}`
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<string, NavigationMenuChangeReason>({
    prop: props.modelValue,
    defaultValue: props.defaultValue ?? '',
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  const previousValue = ref('')

  const dir = computed<Direction>(() => toValue(props.dir) ?? 'ltr')
  const delayDuration = computed(() => toValue(props.delayDuration) ?? 200)
  const skipDelayDuration = computed(() => toValue(props.skipDelayDuration) ?? 300)
  const disableClickTrigger = computed(() => toValue(props.disableClickTrigger) ?? false)
  const disableHoverTrigger = computed(() => toValue(props.disableHoverTrigger) ?? false)
  const unmountOnHide = computed(() => toValue(props.unmountOnHide) ?? true)

  const rootNavigationMenu = props.rootElement ?? ref<HTMLElement>()
  const indicatorTrack = ref<HTMLElement>()
  const viewport = ref<HTMLElement>()
  const activeTrigger = useActiveTrigger(modelValue, props.getItems)

  // Every write goes through here so `previousValue` only moves when the
  // change commits; a cancelled change leaves both values untouched.
  function setValue(value: string, reason?: ChangeReason, event?: Event): boolean {
    const previous = modelValue.value
    const changed = setState(value, reason, event)
    if (changed)
      previousValue.value = previous
    return changed
  }

  const isDelaySkipped = refAutoReset(false, skipDelayDuration)
  const skipNextClose = ref(false)
  const computedDelay = computed(() => {
    const isOpen = modelValue.value !== ''
    if (isOpen || isDelaySkipped.value)
      return 150 // 150ms for user to switch trigger or move into content view
    else return delayDuration.value
  })

  // The reason and event of the interaction that armed the pending debounce.
  // Kept beside the debounced function rather than passed through it, so a
  // debounce that forwards only its first argument still reports them.
  let pendingReason: ChangeReason | undefined
  let pendingEvent: Event | undefined
  const debouncedFn = useDebounceFn((val?: string) => {
    // passing `undefined` meant to reset the debounce timer
    if (typeof val === 'string') {
      if (val === '' && skipNextClose.value) {
        skipNextClose.value = false
        return
      }
      setValue(val, pendingReason, pendingEvent)
      if (val === '')
        isDelaySkipped.value = true
    }
  }, computedDelay)

  function schedule(value: string, reason: ChangeReason, event?: Event) {
    pendingReason = reason
    pendingEvent = event
    debouncedFn(value)
  }

  function onItemSelect(value: string, reason: ChangeReason = 'imperative-action', event?: Event) {
    return setValue(value, reason, event)
  }
  function onItemDismiss(reason: ChangeReason = 'imperative-action', event?: Event) {
    return setValue('', reason, event)
  }

  const context: NavigationMenuContext = {
    isRootMenu: true,
    modelValue,
    previousValue,
    baseId,
    disableClickTrigger,
    disableHoverTrigger,
    dir,
    unmountOnHide,
    orientation: props.orientation ?? 'horizontal',
    rootNavigationMenu,
    indicatorTrack,
    activeTrigger,
    onIndicatorTrackChange: (val) => {
      indicatorTrack.value = val
    },
    viewport,
    onViewportChange: (val) => {
      viewport.value = val
    },
    onTriggerEnter: (val, event) => {
      if (modelValue.value !== '') {
        skipNextClose.value = true
        setValue(val, 'trigger-hover', event)
      }
      else {
        schedule(val, 'trigger-hover', event)
      }
    },
    onTriggerLeave: (event) => {
      skipNextClose.value = false
      schedule('', 'pointer-leave', event)
    },
    onContentEnter: () => {
      debouncedFn()
    },
    onContentLeave: (event) => {
      if (!toValue(props.disablePointerLeaveClose)) {
        skipNextClose.value = false
        schedule('', 'pointer-leave', event)
      }
    },
    // When selecting item we trigger update immediately
    onItemSelect,
    onItemDismiss,
  }

  return {
    modelValue,
    previousValue,
    activeTrigger,
    onItemSelect,
    onItemDismiss,
    lastChangeDetails,
    isControlled,
    root: getNavigationMenuRootSurface(context),
    list: getNavigationMenuListSurface(context),
    context,
  }
}

/**
 * Handles a `navigationMenu.rootContentDismiss` event that reached the root
 * element without passing through an open root content (a top-level link).
 * @internal
 */
export function handleRootDismissEvent(context: NavigationMenuContext, event: Event) {
  if (handledDismissEvents.has(event))
    return
  const { reason, originalEvent } = readDismissDetail(event)
  context.onItemDismiss(reason, originalEvent ?? event)
}

export interface UseNavigationMenuSubProps extends ModelCallbacks {
  /** The parent menu's context (`injectNavigationMenuContext()`). */
  parentContext: NavigationMenuContext
  /** Controlled value of the open sub item; `undefined` is uncontrolled. */
  modelValue?: MaybeRefOrGetter<string | undefined>
  /** The sub item open on first render when uncontrolled. @defaultValue `''` */
  defaultValue?: string
  /** Orientation of the sub menu. Read once. @defaultValue `'horizontal'` */
  orientation?: Orientation
  /** The sub menu's root element. */
  rootElement?: Ref<HTMLElement | undefined>
  /** The sub menu's triggers and links in DOM order, used to track the active trigger. */
  getItems?: () => HTMLElement[]
}

export interface UseNavigationMenuSubReturn {
  modelValue: ComputedRef<string>
  activeTrigger: Ref<HTMLElement | undefined>
  /** Returns `false` when unchanged or cancelled. */
  onItemSelect: (value: string, reason?: ChangeReason, event?: Event) => boolean
  /** Returns `false` when unchanged or cancelled. */
  onItemDismiss: (reason?: ChangeReason, event?: Event) => boolean
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<NavigationMenuChangeReason>>>
  isControlled: ComputedRef<boolean>
  /** `data-orientation` + the `data-reka-navigation-menu` selector. */
  root: PartSurface<NavigationMenuRootState>
  list: PartSurface<NavigationMenuListState>
  /** The sub menu's `NavigationMenuContext` — the SFC provides this verbatim. */
  context: NavigationMenuContext
}

/**
 * Headless NavigationMenuSub logic: a nested menu with its own open-item model.
 * A sub item opens at once on hover (no delay) and does not close on pointer
 * leave; the parent's ids, direction and trigger settings are inherited.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — the active-trigger watcher is bound to the calling scope.
 */
export function useNavigationMenuSub(props: UseNavigationMenuSubProps): UseNavigationMenuSubReturn {
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<string, NavigationMenuChangeReason>({
    prop: props.modelValue,
    defaultValue: props.defaultValue ?? '',
    name: 'modelValue',
    emit: props.emit,
    onBeforeUpdate: props.onBeforeUpdate,
    onUpdate: props.onUpdate,
  })
  // A sub menu never tracks the previous item (v2 parity): its contents get
  // no `data-motion` and do not linger while a viewport animates.
  const previousValue = ref('')
  const indicatorTrack = ref<HTMLElement>()
  const viewport = ref<HTMLElement>()
  const activeTrigger = useActiveTrigger(modelValue, props.getItems)

  function onItemSelect(value: string, reason: ChangeReason = 'imperative-action', event?: Event) {
    return setState(value, reason, event)
  }
  function onItemDismiss(reason: ChangeReason = 'imperative-action', event?: Event) {
    return setState('', reason, event)
  }

  const context: NavigationMenuContext = {
    ...props.parentContext,
    isRootMenu: false,
    modelValue,
    previousValue,
    activeTrigger,
    orientation: props.orientation ?? 'horizontal',
    rootNavigationMenu: props.rootElement ?? ref<HTMLElement>(),
    indicatorTrack,
    onIndicatorTrackChange: (val) => {
      indicatorTrack.value = val
    },
    viewport,
    onViewportChange: (val) => {
      viewport.value = val
    },
    onTriggerEnter: (val, event) => {
      setState(val, 'trigger-hover', event)
    },
    onTriggerLeave: () => {
      // do nothing for submenu
    },
    onContentEnter: () => {
      // do nothing for submenu
    },
    onContentLeave: () => {
      // do nothing for submenu
    },
    onItemSelect,
    onItemDismiss,
  }

  return {
    modelValue,
    activeTrigger,
    onItemSelect,
    onItemDismiss,
    lastChangeDetails,
    isControlled,
    root: getNavigationMenuRootSurface(context),
    list: getNavigationMenuListSurface(context),
    context,
  }
}

// -----------------------------------------------------------------------------
// Item
// -----------------------------------------------------------------------------

/** The keys `NavigationMenuItem` handles (Vue's `.up.down.left.right.home.end.space`). */
const ITEM_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', ' '])

export interface UseNavigationMenuItemOptions {
  /** The menu (or sub menu) context. */
  context: NavigationMenuContext
  /** The item's value; the SFC hands `useId(props.value)`. */
  value: string
  /** The menu's triggers and links in DOM order, for arrow-key navigation between triggers. */
  getItems?: () => HTMLElement[]
}

export interface UseNavigationMenuItemReturn {
  /** The `NavigationMenuItemContext` — the SFC provides this verbatim. */
  itemContext: NavigationMenuItemContext
  /** The `data-menu-item` selector + the arrow/Home/End/Space keydown handler. */
  item: PartSurface<Record<string, never>>
}

/**
 * Headless NavigationMenuItem logic: moves focus between triggers with the
 * arrow keys, toggles the item with Space, and owns the focus hand-off into
 * and out of the item's content. Call once per item.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useNavigationMenuItem(options: UseNavigationMenuItemOptions): UseNavigationMenuItemReturn {
  const { context, value } = options
  const triggerRef = ref<HTMLElement>()
  const focusProxyRef = ref<HTMLElement>()
  const contentId = makeContentId(context.baseId, value)

  let restoreContentTabOrderRef: () => void = () => ({})

  const wasEscapeCloseRef = ref(false)
  // `NavigationMenuTrigger` replaces `triggerRef` on mount, so the handlers
  // below read it through the context object, never a captured ref.
  const itemContext: NavigationMenuItemContext = {
    value,
    contentId,
    triggerRef,
    focusProxyRef,
    wasEscapeCloseRef,
    onEntryKeyDown: handleContentEntry,
    onFocusProxyEnter: handleContentEntry,
    onContentFocusOutside: handleContentExit,
    onRootContentClose: handleContentExit,
  }

  async function handleContentEntry(side = 'start') {
    const el = getElementByIdFrom(itemContext.triggerRef.value, contentId)
    if (el) {
      restoreContentTabOrderRef()
      const candidates = getTabbableCandidates(el)
      if (candidates.length)
        focusFirst(side === 'start' ? candidates : candidates.reverse())
    }
  }

  function handleContentExit() {
    const el = getElementByIdFrom(itemContext.triggerRef.value, contentId)
    if (el) {
      const candidates = getTabbableCandidates(el)
      if (candidates.length)
        restoreContentTabOrderRef = removeFromTabOrder(candidates)
    }
  }

  function handleClose(event: KeyboardEvent) {
    context.onItemDismiss('trigger-press', event)
    itemContext.triggerRef.value?.focus()
  }

  function handleKeydown(ev: KeyboardEvent) {
    if (!ITEM_KEYS.has(ev.key))
      return
    const currentFocus = getActiveElement() as HTMLElement
    if (ev.keyCode === 32 || ev.key === 'Enter') {
      if (context.modelValue.value === value) {
        handleClose(ev)
        ev.preventDefault()
        return
      }
      else {
        (ev.target as HTMLElement).click()
        ev.preventDefault()
        return
      }
    }

    const itemsArray = (options.getItems?.() ?? []).filter(item =>
      item.parentElement?.hasAttribute('data-menu-item'),
    )

    // prevent triggering when the focus is on link
    if (!itemsArray.includes(currentFocus))
      return

    const newSelectedElement = useArrowNavigation(ev, currentFocus, undefined, {
      itemsArray,
      loop: false,
    })

    if (newSelectedElement)
      newSelectedElement?.focus()

    ev.preventDefault()
    ev.stopPropagation()
  }

  return {
    itemContext,
    item: createPartSurface<Record<string, never>>(
      () => ({
        // Functional selector: arrow navigation keeps to the menu's own triggers.
        'data-menu-item': '',
        'onKeydown': handleKeydown,
      }),
      () => ({}),
    ),
  }
}

// -----------------------------------------------------------------------------
// Trigger
// -----------------------------------------------------------------------------

export interface UseNavigationMenuTriggerOptions {
  context: NavigationMenuContext
  itemContext: NavigationMenuItemContext
  /** When `true`, the trigger ignores pointer interaction. */
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** The trigger element, used by the focus proxy. */
  triggerElement?: Ref<HTMLElement | undefined>
}

export interface UseNavigationMenuTriggerReturn {
  /** Whether this trigger's item is open. */
  open: ComputedRef<boolean>
  /** `id` / `aria-expanded` / `aria-controls` / `disabled` + the hover, click and entry-key handlers. */
  trigger: PartSurface<NavigationMenuTriggerState>
  /**
   * `focus` handler for the tabbable focus proxy rendered after an open
   * trigger: it moves focus into the content (or back to its end).
   */
  onFocusProxyFocus: (event: FocusEvent) => void
}

/**
 * Headless NavigationMenuTrigger logic: hover intent (a hover opens once per
 * pointer pass; a click or Escape close blocks the hover reopen), the
 * click toggle, and the entry key that moves focus into the open content.
 * Call once per trigger.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — the hover-opened latch resets on a timer bound to the calling scope.
 */
export function useNavigationMenuTrigger(options: UseNavigationMenuTriggerOptions): UseNavigationMenuTriggerReturn {
  const { context: menuContext, itemContext } = options
  const disabled = computed(() => toValue(options.disabled) ?? false)
  const triggerElement = options.triggerElement ?? ref<HTMLElement>()

  const hasPointerMoveOpenedRef = refAutoReset(false, 300)
  const wasClickCloseRef = ref(false)

  const open = computed(() => itemContext.value === menuContext.modelValue.value)

  function handlePointerEnter() {
    if (menuContext.disableHoverTrigger.value)
      return

    wasClickCloseRef.value = false
    itemContext.wasEscapeCloseRef.value = false
  }

  function handlePointerMove(ev: PointerEvent) {
    if (ev.defaultPrevented || menuContext.disableHoverTrigger.value)
      return

    if (ev.pointerType === 'mouse') {
      if (
        disabled.value
        || wasClickCloseRef.value
        || itemContext.wasEscapeCloseRef.value
        || hasPointerMoveOpenedRef.value
      ) {
        return
      }

      menuContext.onTriggerEnter(itemContext.value, ev)
      hasPointerMoveOpenedRef.value = true
    }
  }

  function handlePointerLeave(ev: PointerEvent) {
    if (menuContext.disableHoverTrigger.value)
      return

    if (ev.pointerType === 'mouse') {
      if (disabled.value)
        return
      menuContext.onTriggerLeave(ev)
      hasPointerMoveOpenedRef.value = false
    }
  }

  function handleClick(event: MouseEvent | PointerEvent) {
    if (event.defaultPrevented)
      return
    if (
      (!('pointerType' in event) || event.pointerType === 'mouse')
      && menuContext.disableClickTrigger.value
    ) {
      return
    }

    // if open via pointermove, we prevent click event
    if (hasPointerMoveOpenedRef.value)
      return

    if (open.value)
      menuContext.onItemSelect('', 'trigger-press', event)
    else menuContext.onItemSelect(itemContext.value, 'trigger-press', event)

    wasClickCloseRef.value = open.value
  }

  function handleKeydown(ev: KeyboardEvent) {
    if (ev.defaultPrevented)
      return
    const verticalEntryKey = menuContext.dir.value === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const entryKey = { horizontal: 'ArrowDown', vertical: verticalEntryKey }[
      menuContext.orientation
    ]
    if (open.value && ev.key === entryKey) {
      itemContext.onEntryKeyDown()
      // Prevent FocusGroupItem from handling the event
      ev.preventDefault()
      ev.stopPropagation()
    }
  }

  function onFocusProxyFocus(ev: FocusEvent) {
    const content = getElementByIdFrom(triggerElement.value, itemContext.contentId)
    const prevFocusedElement = ev.relatedTarget as HTMLElement | null

    const wasTriggerFocused = prevFocusedElement === triggerElement.value
    const wasFocusFromContent = content?.contains(prevFocusedElement)

    if (wasTriggerFocused || !wasFocusFromContent)
      itemContext.onFocusProxyEnter(wasTriggerFocused ? 'start' : 'end')
  }

  const trigger = createPartSurface<NavigationMenuTriggerState>(
    () => ({
      'id': makeTriggerId(menuContext.baseId, itemContext.value),
      'disabled': disabled.value,
      // Functional selector: the content keeps focus moves onto a trigger inside the menu.
      'data-navigation-menu-trigger': '',
      'aria-expanded': open.value,
      'aria-controls': makeContentId(menuContext.baseId, itemContext.value),
      'onPointerenter': handlePointerEnter,
      'onPointermove': handlePointerMove,
      'onPointerleave': handlePointerLeave,
      'onClick': handleClick,
      'onKeydown': handleKeydown,
    }),
    () => ({ state: disclosureState(open.value), disabled: disabled.value }),
  )

  return { open, trigger, onFocusProxyFocus }
}

// -----------------------------------------------------------------------------
// Content
// -----------------------------------------------------------------------------

/**
 * Whether a content is open, and whether it stays mounted as the last active
 * one while the viewport animates out. Pure derivation shared by
 * `NavigationMenuContent.vue` and `useNavigationMenuContent()`.
 * @internal
 */
export function getNavigationMenuContentPresence(context: NavigationMenuContext, itemContext: NavigationMenuItemContext) {
  const open = computed(() => itemContext.value === context.modelValue.value)
  // We persist the last active content value as the viewport may be animating out
  // and we want the content to remain mounted for the lifecycle of the viewport.
  const isLastActiveValue = computed(() => {
    if (context.viewport.value) {
      if (!context.modelValue.value && context.previousValue.value)
        return (context.previousValue.value === itemContext.value)
    }
    return false
  })
  return { open, isLastActiveValue }
}

export interface UseNavigationMenuContentOptions {
  context: NavigationMenuContext
  itemContext: NavigationMenuItemContext
  /** The content element (the dismissable layer). */
  contentElement: Ref<HTMLElement | undefined | null>
  /** The menu's triggers and links in DOM order, for `data-motion` and outside-press checks. */
  getItems?: () => HTMLElement[]
  /**
   * Component `emit`; receives `escapeKeyDown`, `pointerDownOutside`,
   * `focusOutside` and `interactOutside` before the content acts on them, so
   * `event.preventDefault()` keeps the content open.
   */
  emit?: (event: any, ...args: any[]) => void
}

export interface UseNavigationMenuContentReturn {
  open: ComputedRef<boolean>
  /** `true` while this content is the last active one and the viewport animates out. */
  isLastActiveValue: ComputedRef<boolean>
  /** `id` / `aria-labelledby` / tab-trapping `onKeydown` / hover handlers + `data-state`, `data-motion`, `data-orientation`. */
  content: PartSurface<NavigationMenuContentState>
  /** Bind to the dismissable layer's `escapeKeyDown`. */
  onEscapeKeyDown: (event: KeyboardEvent) => void
  /** Bind to the dismissable layer's `pointerDownOutside`. */
  onPointerDownOutside: (event: PointerDownOutsideEvent) => void
  /** Bind to the dismissable layer's `focusOutside`. */
  onFocusOutside: (event: FocusOutsideEvent) => void
  /** Bind to the dismissable layer's `dismiss`. */
  onDismiss: (details?: { reason?: ChangeReason, event?: Event }) => void
}

/**
 * Headless NavigationMenuContent logic: the motion direction between items,
 * Tab and arrow-key focus management, the dismissal rules (outside presses on
 * triggers and the viewport, focus moving within the menu) and the close that
 * returns focus to the trigger. Call once per content; the content must be
 * wrapped in a `DismissableLayer` (or an equivalent) whose events are bound to
 * the returned handlers.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — the dismiss listener is bound to the calling scope.
 */
export function useNavigationMenuContent(options: UseNavigationMenuContentOptions): UseNavigationMenuContentReturn {
  const { context: menuContext, itemContext, contentElement } = options
  const getItems = () => options.getItems?.() ?? []
  const emit = (event: string, ...args: any[]) => options.emit?.(event, ...args)

  const { open, isLastActiveValue } = getNavigationMenuContentPresence(menuContext, itemContext)

  const prevMotionAttributeRef = ref<NavigationMenuMotion | null>(null)
  const motionAttribute = computed(() => {
    const values = getItems().map(i => i.id.split('trigger-')[1])
    if (menuContext.dir.value === 'rtl')
      values.reverse()
    const index = values.indexOf(menuContext.modelValue.value)
    const prevIndex = values.indexOf(menuContext.previousValue.value)
    const isSelected = itemContext.value === menuContext.modelValue.value
    const wasSelected = prevIndex === values.indexOf(itemContext.value)

    // We only want to update selected and the last selected content
    // this avoids animations being interrupted outside of that range
    if (!isSelected && !wasSelected)
      return prevMotionAttributeRef.value

    const attribute = ((): NavigationMenuMotion | null => {
      // Don't provide a direction on the initial open
      if (index !== prevIndex) {
        // If we're moving to this item from another
        if (isSelected && prevIndex !== -1)
          return index > prevIndex ? 'from-end' : 'from-start'
        // If we're leaving this item for another
        if (wasSelected && index !== -1)
          return index > prevIndex ? 'to-start' : 'to-end'
      }
      // Otherwise we're entering from closed or leaving the list
      // entirely and should not animate in any direction
      return null
    })()

    prevMotionAttributeRef.value = attribute
    return attribute
  })

  // A close was requested but `beforeUpdate:modelValue` cancelled it: the menu still shows this item.
  function wasCancelled(closed: boolean) {
    return !closed && menuContext.modelValue.value !== ''
  }

  function onFocusOutside(ev: FocusOutsideEvent) {
    emit('focusOutside', ev)
    emit('interactOutside', ev)

    const target = ev.detail.originalEvent.target as HTMLElement
    if (target.hasAttribute('data-navigation-menu-trigger'))
      ev.preventDefault()

    if (!ev.defaultPrevented) {
      itemContext.onContentFocusOutside()

      const target = ev.target as HTMLElement
      // Only dismiss content when focus moves outside of the menu
      if (menuContext.rootNavigationMenu?.value?.contains(target))
        ev.preventDefault()
    }
  }

  function onPointerDownOutside(ev: PointerDownOutsideEvent) {
    emit('pointerDownOutside', ev)

    if (!ev.defaultPrevented) {
      const target = ev.target as HTMLElement
      const isTrigger = getItems().some(item =>
        item.contains(target),
      )
      const isRootViewport
        = menuContext.isRootMenu && menuContext.viewport.value?.contains(target)

      if (isTrigger || isRootViewport || !menuContext.isRootMenu)
        ev.preventDefault()
    }
  }

  watchEffect((cleanupFn) => {
    const content = contentElement.value
    if (menuContext.isRootMenu && content) {
      // Bubble dismiss to the root content node and focus its trigger
      const handleClose = (event: Event) => {
        handledDismissEvents.add(event)
        const { reason, originalEvent } = readDismissDetail(event)
        if (wasCancelled(menuContext.onItemDismiss(reason, originalEvent ?? event)))
          return
        itemContext.onRootContentClose()
        if (content.contains(getActiveElement()))
          itemContext.triggerRef.value?.focus()
      }
      content.addEventListener(EVENT_ROOT_CONTENT_DISMISS, handleClose)

      cleanupFn(() =>
        content.removeEventListener(EVENT_ROOT_CONTENT_DISMISS, handleClose),
      )
    }
  })

  function onEscapeKeyDown(ev: KeyboardEvent) {
    emit('escapeKeyDown', ev)

    if (!ev.defaultPrevented) {
      if (wasCancelled(menuContext.onItemDismiss('escape-key', ev)))
        return
      itemContext.triggerRef?.value?.focus()
      itemContext.wasEscapeCloseRef.value = true
    }
  }

  function handleKeydown(ev: KeyboardEvent) {
    // prevent parent menu triggering keydown event
    if ((ev.target as HTMLElement).closest('[data-reka-navigation-menu]') !== menuContext.rootNavigationMenu.value)
      return

    const isMetaKey = ev.altKey || ev.ctrlKey || ev.metaKey
    const isTabKey = ev.key === 'Tab' && !isMetaKey
    const candidates = getTabbableCandidates(ev.currentTarget as HTMLElement)

    if (isTabKey) {
      const focusedElement = getActiveElement()
      const index = candidates.findIndex(
        candidate => candidate === focusedElement,
      )
      const isMovingBackwards = ev.shiftKey
      const nextCandidates = isMovingBackwards
        ? candidates.slice(0, index).reverse()
        : candidates.slice(index + 1, candidates.length)

      if (focusFirst(nextCandidates)) {
        // prevent browser tab keydown because we've handled focus
        ev.preventDefault()
      }
      else {
        // If we can't focus that means we're at the edges
        // so focus the proxy and let browser handle
        // tab/shift+tab keypress on the proxy instead
        itemContext.focusProxyRef.value?.focus()
        return
      }
    }

    const newSelectedElement = useArrowNavigation(
      ev,
      getActiveElement() as HTMLElement,
      undefined,
      { itemsArray: candidates, loop: false, enableIgnoredElement: true },
    )
    newSelectedElement?.focus()
  }

  function onDismiss(details?: { reason?: ChangeReason, event?: Event }) {
    if (menuContext.modelValue.value !== itemContext.value)
      return
    // Escape already went through `onEscapeKeyDown`; dispatching it again
    // would ask `beforeUpdate:modelValue` twice when the close is cancelled.
    if (details?.reason === 'escape-key')
      return

    const rootContentDismissEvent = new CustomEvent<NavigationMenuDismissDetail>(EVENT_ROOT_CONTENT_DISMISS, {
      bubbles: true,
      cancelable: true,
      detail: { reason: details?.reason, originalEvent: details?.event },
    })
    contentElement.value?.dispatchEvent(rootContentDismissEvent)
  }

  const content = createPartSurface<NavigationMenuContentState>(
    () => ({
      'id': makeContentId(menuContext.baseId, itemContext.value),
      'aria-labelledby': makeTriggerId(menuContext.baseId, itemContext.value),
      // Prevent interaction while a root content animates out
      'style': { pointerEvents: !open.value && menuContext.isRootMenu ? 'none' : undefined },
      'onKeydown': handleKeydown,
      'onPointerenter': () => menuContext.onContentEnter(itemContext.value),
      'onPointerleave': whenMouse(event => menuContext.onContentLeave(event)),
    }),
    () => ({
      state: disclosureState(open.value),
      motion: motionAttribute.value,
      orientation: menuContext.orientation,
    }),
  )

  return {
    open,
    isLastActiveValue,
    content,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onDismiss,
  }
}

// -----------------------------------------------------------------------------
// Link
// -----------------------------------------------------------------------------

export interface UseNavigationMenuLinkOptions {
  /** Marks the link as the current page (`aria-current="page"`, `data-active`). */
  active?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Called with the cancellable `select` event before the menu closes;
   * `event.preventDefault()` keeps it open. The SFC passes `e => emit('select', e)`.
   */
  onSelect?: (event: CustomEvent<{ originalEvent: Event }>) => void
}

export interface UseNavigationMenuLinkReturn {
  /** `aria-current` + the selecting `onClick`; `data-active`. */
  link: PartSurface<NavigationMenuLinkState>
}

/**
 * Headless NavigationMenuLink logic: selecting a link closes the menu (reason
 * `link-press`) unless the `select` event is prevented or the meta key is held.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useNavigationMenuLink(options: UseNavigationMenuLinkOptions = {}): UseNavigationMenuLinkReturn {
  const active = computed(() => toValue(options.active) ?? false)

  function handleClick(ev: MouseEvent) {
    const linkSelectEvent = new CustomEvent(LINK_SELECT, {
      bubbles: true,
      cancelable: true,
      detail: {
        originalEvent: ev,
      },
    })
    options.onSelect?.(linkSelectEvent)

    if (!linkSelectEvent.defaultPrevented && !ev.metaKey) {
      const rootContentDismissEvent = new CustomEvent<NavigationMenuDismissDetail>(
        EVENT_ROOT_CONTENT_DISMISS,
        {
          bubbles: true,
          cancelable: true,
          detail: { reason: 'link-press', originalEvent: ev },
        },
      )
      ev.target?.dispatchEvent(rootContentDismissEvent)
    }
  }

  return {
    link: createPartSurface<NavigationMenuLinkState>(
      () => ({
        'aria-current': active.value ? 'page' : undefined,
        'onClick': handleClick,
      }),
      () => ({ active: active.value }),
    ),
  }
}

// -----------------------------------------------------------------------------
// Indicator
// -----------------------------------------------------------------------------

export interface UseNavigationMenuIndicatorOptions {
  context: NavigationMenuContext
}

export interface UseNavigationMenuIndicatorReturn {
  /** `true` while an item is open. */
  isVisible: ComputedRef<boolean>
  /** `aria-hidden` + the `--reka-navigation-menu-indicator-size` / `-position` variables; `data-state`, `data-orientation`. */
  indicator: PartSurface<NavigationMenuIndicatorState>
}

/**
 * Headless NavigationMenuIndicator logic: tracks the size and position of the
 * active trigger within the list.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — resize observers are bound to the calling scope.
 */
export function useNavigationMenuIndicator(options: UseNavigationMenuIndicatorOptions): UseNavigationMenuIndicatorReturn {
  const { context: menuContext } = options
  const indicatorStyle = ref<{ size: number, position: number }>()
  const isHorizontal = computed(() => menuContext.orientation === 'horizontal')
  const isVisible = computed(() => !!menuContext.modelValue.value)
  const { activeTrigger } = menuContext

  function handlePositionChange() {
    if (!activeTrigger.value) {
      return
    }

    indicatorStyle.value = {
      size: isHorizontal.value
        ? activeTrigger.value.offsetWidth
        : activeTrigger.value.offsetHeight,
      position: isHorizontal.value
        ? activeTrigger.value.offsetLeft
        : activeTrigger.value.offsetTop,
    }
  }

  watchEffect(() => {
    if (!menuContext.modelValue.value) {
      return
    }
    handlePositionChange()
  })

  useResizeObserver(activeTrigger, handlePositionChange)
  useResizeObserver(menuContext.indicatorTrack, handlePositionChange)

  return {
    isVisible,
    indicator: createPartSurface<NavigationMenuIndicatorState>(
      () => ({
        'aria-hidden': 'true',
        'style': indicatorStyle.value
          ? {
              '--reka-navigation-menu-indicator-size': `${indicatorStyle.value.size}px`,
              '--reka-navigation-menu-indicator-position': `${indicatorStyle.value.position}px`,
            }
          : {},
      }),
      () => ({ state: disclosureState(isVisible.value), orientation: menuContext.orientation }),
    ),
  }
}

// -----------------------------------------------------------------------------
// Viewport
// -----------------------------------------------------------------------------

export interface UseNavigationMenuViewportOptions {
  context: NavigationMenuContext
  /** The viewport element. */
  viewportElement: Ref<HTMLElement | undefined | null>
  /** Placement for `--reka-navigation-menu-viewport-left` / `-top`. @defaultValue `'center'` */
  align?: MaybeRefOrGetter<'start' | 'center' | 'end' | undefined>
}

export interface UseNavigationMenuViewportReturn {
  /** `true` while an item is open. */
  open: ComputedRef<boolean>
  /** The size / position CSS variables, the leave-animation `pointer-events` guard and the hover handlers; `data-state`, `data-orientation`. */
  viewport: PartSurface<NavigationMenuViewportState>
  /** Clears the measured size and position; call after the viewport's leave animation. */
  reset: () => void
}

/**
 * Headless NavigationMenuViewport logic: registers the viewport with the menu,
 * measures the open content and positions the viewport under the active
 * trigger (`--reka-navigation-menu-viewport-width` / `-height` / `-left` / `-top`).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — watchers and resize observers are bound to the calling scope.
 */
export function useNavigationMenuViewport(options: UseNavigationMenuViewportOptions): UseNavigationMenuViewportReturn {
  const { context: menuContext, viewportElement: currentElement } = options
  const { activeTrigger, rootNavigationMenu, modelValue } = menuContext

  const size = ref<{ width: number, height: number }>()
  const position = ref<{ left: number, top: number }>()

  const open = computed(() => !!menuContext.modelValue.value)

  watch(currentElement, () => {
    menuContext.onViewportChange(currentElement.value ?? undefined)
  })

  const content = ref<HTMLElement>()

  watch([modelValue, open], () => {
    nextTick(() => {
      if (!currentElement.value)
        return

      requestAnimationFrame(() => {
        const el = (currentElement.value as HTMLElement)?.querySelector('[data-state=open]') as HTMLElement | undefined
        content.value = el
      })
    })
  }, { immediate: true })

  function updatePosition() {
    if (content.value && activeTrigger.value && rootNavigationMenu.value) {
      const bodyWidth = document.documentElement.offsetWidth
      const bodyHeight = document.documentElement.offsetHeight
      const rootRect = rootNavigationMenu.value.getBoundingClientRect()
      const rect = activeTrigger.value.getBoundingClientRect()
      const { offsetWidth, offsetHeight } = content.value

      // Find the beginning of the position of the menu item
      const startPositionLeft = rect.left - rootRect.left
      const startPositionTop = rect.top - rootRect.top

      // Aligning to specified alignment
      let posLeft = null
      let posTop = null
      switch (toValue(options.align) ?? 'center') {
        case 'start':
          posLeft = startPositionLeft
          posTop = startPositionTop
          break
        case 'end':
          posLeft = startPositionLeft - offsetWidth + rect.width
          posTop = startPositionTop - offsetHeight + rect.height
          break
        default:
          // center
          posLeft = startPositionLeft - offsetWidth / 2 + rect.width / 2
          posTop = startPositionTop - offsetHeight / 2 + rect.height / 2
      }

      const screenOffset = 10

      // Do not let go of the left side of the screen
      if (posLeft + rootRect.left < screenOffset) {
        posLeft = screenOffset - rootRect.left
      }

      // Now also check the right side of the screen
      const rightOffset = posLeft + rootRect.left + offsetWidth
      if (rightOffset > bodyWidth - screenOffset) {
        posLeft -= rightOffset - bodyWidth + screenOffset

        // Recheck the left side of the screen
        if (posLeft < screenOffset - rootRect.left) {
          // Just set the menu to the full width of the screen
          posLeft = screenOffset - rootRect.left
        }
      }

      // Do not let go of the top side of the screen
      if (posTop + rootRect.top < screenOffset) {
        posTop = screenOffset - rootRect.top
      }

      // Now also check the bottom side of the screen
      const bottomOffset = posTop + rootRect.top + offsetHeight
      if (bottomOffset > bodyHeight - screenOffset) {
        posTop -= bottomOffset - bodyHeight + screenOffset

        // Recheck the top side of the screen
        if (posTop < screenOffset - rootRect.top) {
          // Just set the menu to the full height of the screen
          posTop = screenOffset - rootRect.top
        }
      }

      // Possible blurring font with decimal values
      posLeft = Math.round(posLeft)
      posTop = Math.round(posTop)

      position.value = {
        left: posLeft,
        top: posTop,
      }
    }
  }

  useResizeObserver(content, () => {
    if (content.value) {
      size.value = {
        width: content.value.offsetWidth,
        height: content.value.offsetHeight,
      }
      updatePosition()
    }
  })

  useResizeObserver([globalThis.document?.body, rootNavigationMenu], () => {
    updatePosition()
  })

  return {
    open,
    reset: () => {
      size.value = undefined
      position.value = undefined
    },
    viewport: createPartSurface<NavigationMenuViewportState>(
      () => ({
        style: {
          // Prevent interaction when animating out
          'pointerEvents': !open.value && menuContext.isRootMenu ? 'none' : undefined,
          '--reka-navigation-menu-viewport-width': size.value ? `${size.value.width}px` : undefined,
          '--reka-navigation-menu-viewport-height': size.value ? `${size.value.height}px` : undefined,
          '--reka-navigation-menu-viewport-left': position.value ? `${position.value.left}px` : undefined,
          '--reka-navigation-menu-viewport-top': position.value ? `${position.value.top}px` : undefined,
        },
        onPointerenter: () => menuContext.onContentEnter(menuContext.modelValue.value),
        onPointerleave: whenMouse(event => menuContext.onContentLeave(event)),
      }),
      () => ({ state: disclosureState(open.value), orientation: menuContext.orientation }),
    ),
  }
}
