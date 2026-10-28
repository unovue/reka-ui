import type { Ref } from 'vue'
import type { RovingFocusItemMeta } from './useRovingFocusItem'
import type { Direction, Orientation } from './utils'
import type { ElementSourceLike } from '@/Collection/Collection'
import type { KeyedSelector } from '@/shared/createKeyedSelector'
import { computed, getCurrentInstance, nextTick, ref } from 'vue'
import { getCollectionMeta, useCollection, useCollectionSlot } from '@/Collection'
import { createContext } from '@/shared/createContext'
import { createKeyedSelector } from '@/shared/createKeyedSelector'
import { isDisabledItem } from '@/shared/isDisabledItem'
import { getterRef } from '@/shared/partSurface'
import { useDirection } from '@/shared/useDirection'
import { ENTRY_FOCUS, EVENT_OPTIONS, focusFirst, getFocusIntent, wrapArray } from './utils'

export interface RovingContext {
  orientation: Ref<Orientation | undefined>
  dir: Ref<Direction>
  loop: Ref<boolean>
  currentTabStopId: Ref<string | null | undefined>
  /** Keyed by tab stop id: whether the item is the current tab stop. */
  tabStop: KeyedSelector<string>
  onItemFocus: (tabStopId: string) => void
  onItemShiftTab: () => void
  onFocusableItemAdd: () => void
  onFocusableItemRemove: () => void
  /** The group's element: an item rendered outside it (teleported) listens itself. */
  rootElement: { readonly value: unknown }
  /** Arrow keys for an item outside the group's element (its keydown never reaches the group). */
  onDetachedItemKeydown: (event: KeyboardEvent) => void
}

export const [injectRovingFocusGroupContext, provideRovingFocusGroupContext]
  = createContext<RovingContext>('RovingFocusGroup')

export interface UseRovingFocusGroupOptions {
  /** The group's element (its `useForwardElement().currentElement`). */
  element: ElementSourceLike
  orientation?: () => Orientation | undefined
  /** Resolved against `ConfigProvider` when unset, as the `dir` prop is. */
  dir?: () => Direction | undefined
  loop?: () => boolean | undefined
  /** The current tab stop, when the owner holds (or `v-model`s) it. */
  currentTabStopId?: Ref<string | null | undefined>
  preventScrollOnEntryFocus?: () => boolean | undefined
  /** The `entryFocus` event; calling `preventDefault()` keeps the focus on the group. */
  onEntryFocus?: (event: Event) => void
  /**
   * For a part that replaced `<RovingFocusGroup as-child>`: its consumer's
   * attrs named after a `RovingFocusGroup` prop or event (`dir`,
   * `orientation`, `loop`, `currentTabStopId`, `defaultCurrentTabStopId`,
   * `preventScrollOnEntryFocus`, `onEntryFocus`, `onUpdate:currentTabStopId`)
   * configure the group over the part's own options, as they did when they
   * fell through to the wrapper's props. Bind `roving.consumerAttrs($attrs)`,
   * which leaves them out, instead of `$attrs`.
   *
   * `true`: the attrs fell through to a wrapper that was the part's root, so
   * they win over the part's own options. `'under'`: they reached the wrapper
   * through an `as-child` chain (`Slot` merges them under the wrapper's own
   * bindings), so they only fill in options the part leaves unset, and their
   * listeners run before the part's.
   */
  consumerAttrs?: boolean | 'under'
}

/** `RovingFocusGroup`'s props and events, camelCase → kebab-case. */
const GROUP_PROPS: Record<string, string> = {
  dir: 'dir',
  orientation: 'orientation',
  loop: 'loop',
  currentTabStopId: 'current-tab-stop-id',
  defaultCurrentTabStopId: 'default-current-tab-stop-id',
  preventScrollOnEntryFocus: 'prevent-scroll-on-entry-focus',
}
const GROUP_EVENTS = ['onEntryFocus', 'onUpdate:currentTabStopId', 'onUpdate:current-tab-stop-id']
const GROUP_KEYS = new Set([...Object.keys(GROUP_PROPS), ...Object.values(GROUP_PROPS), ...GROUP_EVENTS])

/** Calls a listener attr (a function, or an array of them as `mergeProps` makes). */
function callListener(listener: unknown, arg: unknown) {
  if (Array.isArray(listener))
    listener.forEach(fn => typeof fn === 'function' && fn(arg))
  else if (typeof listener === 'function')
    listener(arg)
}

/**
 * Reads the consumer attrs that name a group prop, as Vue would have resolved
 * them for `RovingFocusGroup`: either spelling, and a boolean prop set by its
 * bare name. Reading `$attrs` through the instance proxy tracks it.
 */
function consumerGroupAttrs() {
  const instance = getCurrentInstance()!
  const read = (key: string): { value: unknown } | undefined => {
    const attrs = instance.proxy!.$attrs
    if (key in attrs)
      return { value: attrs[key] }
    const kebab = GROUP_PROPS[key]
    if (kebab !== key && kebab in attrs)
      return { value: attrs[kebab] }
    return undefined
  }
  const readBoolean = (key: string) => {
    const attr = read(key)
    if (!attr)
      return undefined
    return attr.value === '' || attr.value === GROUP_PROPS[key] ? true : attr.value as boolean | undefined
  }
  const listener = (key: string) => instance.proxy!.$attrs[key]
  return { read, readBoolean, listener }
}

const OUTLINE_NONE = Object.freeze({ outline: 'none' })

/**
 * A `RovingFocusGroup`, as a composable: provides the group context and the
 * collection its items register with, and returns the attrs to bind on the
 * owner's own element (`tabindex`, `data-orientation`, `dir`, the outline
 * reset and the focus/keyboard handlers). A part that wrapped its element in
 * `<RovingFocusGroup as-child>` renders it directly instead.
 *
 * Bind the attrs over the consumer's and under the part's own
 * (`mergeProps($attrs, roving.attrs(), own)`, with `inheritAttrs: false`):
 * the precedence the `as-child` wrapper gave them.
 *
 * @internal
 * @lifecycle setup
 */
export function useRovingFocusGroup(options: UseRovingFocusGroupOptions) {
  if (options.consumerAttrs)
    options = withConsumerAttrs(options)
  const orientation = getterRef(() => options.orientation?.())
  const loop = getterRef(() => !!options.loop?.())
  const dir = useDirection(() => options.dir?.())
  const currentTabStopId = options.currentTabStopId ?? ref<string | null | undefined>()
  const isTabbingBackOut = ref(false)
  let isClickFocus = false
  const focusableItemsCount = ref(0)

  const { getItems, getItem } = useCollection({ isProvider: true })
  useCollectionSlot(options.element)

  /** The roving item `node` is, or is inside (this group's items only). */
  function findItem(node: Element | null, root: Element) {
    for (; node && node !== root; node = node.parentElement) {
      const item = getItem(node as HTMLElement, true)
      if (item)
        return getCollectionMeta<RovingFocusItemMeta>(item)?.roving ? item : undefined
    }
    return undefined
  }

  /**
   * Arrow-key navigation for every item, delegated here instead of a listener
   * per item. Bubbling runs it after the item's own handlers (and anything
   * between the item and the group), so an `asChild` item or a consumer can
   * still claim a key with `preventDefault()`.
   */
  function onKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented)
      return
    const item = findItem(event.target as Element | null, event.currentTarget as Element)
    if (item)
      navigate(event, item)
  }

  /** An item outside the group's element (teleported) listens on itself. */
  function onDetachedItemKeydown(event: KeyboardEvent) {
    // Same element as the item's own handlers, so `stopPropagation()` there
    // doesn't skip this listener: honour it like the delegated path does.
    if (event.defaultPrevented || event.cancelBubble)
      return
    const item = getItem(event.currentTarget as HTMLElement, true)
    if (item && getCollectionMeta<RovingFocusItemMeta>(item)?.roving)
      navigate(event, item)
  }

  function navigate(event: KeyboardEvent, item: { ref: HTMLElement }) {
    if (event.key === 'Tab' && event.shiftKey) {
      isTabbingBackOut.value = true
      return
    }

    if (event.target !== item.ref)
      return

    const focusIntent = getFocusIntent(event, orientation.value, dir.value)
    if (focusIntent === undefined)
      return
    const allowShiftKey = getCollectionMeta<RovingFocusItemMeta>(item)!.allowShiftKey()
    if (event.metaKey || event.ctrlKey || event.altKey || (allowShiftKey ? false : event.shiftKey))
      return
    event.preventDefault()
    let candidateNodes = getItems().map(i => i.ref)

    if (focusIntent === 'last') {
      candidateNodes.reverse()
    }
    else if (focusIntent === 'prev' || focusIntent === 'next') {
      if (focusIntent === 'prev')
        candidateNodes.reverse()
      const currentIndex = candidateNodes.indexOf(item.ref)

      candidateNodes = loop.value
        ? wrapArray(candidateNodes, currentIndex + 1)
        : candidateNodes.slice(currentIndex + 1)
    }

    nextTick(() => focusFirst(candidateNodes))
  }

  function onFocus(event: FocusEvent) {
    // We normally wouldn't need this check, because we already check
    // that the focus is on the current target and not bubbling to it.
    // We do this because Safari doesn't focus buttons when clicked, and
    // instead, the wrapper will get focused and not through a bubbling event.
    const isKeyboardFocus = !isClickFocus

    if (
      event.currentTarget
      && event.target === event.currentTarget
      && isKeyboardFocus
      && !isTabbingBackOut.value
    ) {
      const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS)
      event.currentTarget.dispatchEvent(entryFocusEvent)
      options.onEntryFocus?.(entryFocusEvent)

      if (!entryFocusEvent.defaultPrevented) {
        const items = getItems().map(i => i.ref).filter(i => !isDisabledItem(i))
        const activeItem = items.find(item => item.getAttribute('data-active') === '')
        const highlightedItem = items.find(item => item.getAttribute('data-highlighted') === '')
        const currentItem = items.find(
          item => item.id === currentTabStopId.value,
        )
        const candidateItems = [activeItem, highlightedItem, currentItem, ...items].filter(
          Boolean,
        ) as typeof items
        focusFirst(candidateItems, !!options.preventScrollOnEntryFocus?.())
      }
    }
    isClickFocus = false
  }

  function onMousedown() {
    isClickFocus = true
  }

  function onMouseup() {
    // reset `isClickFocus` after 1 tick because onFocus might not triggered due to focused element
    setTimeout(() => {
      isClickFocus = false
    }, 1)
  }

  function onBlur() {
    isTabbingBackOut.value = false
  }

  provideRovingFocusGroupContext({
    loop,
    dir,
    orientation,
    currentTabStopId,
    tabStop: createKeyedSelector(() => currentTabStopId.value),
    onItemFocus: (tabStopId) => {
      currentTabStopId.value = tabStopId
    },
    onItemShiftTab: () => {
      isTabbingBackOut.value = true
    },
    onFocusableItemAdd: () => {
      focusableItemsCount.value++
    },
    rootElement: options.element,
    onDetachedItemKeydown,
    onFocusableItemRemove: () => {
      focusableItemsCount.value--
    },
  })

  return {
    getItems,
    dir,
    /**
     * The consumer's attrs without those that configure the group (see
     * `consumerAttrs`): `RovingFocusGroup` took them as props, so they never
     * reached the element.
     */
    consumerAttrs: (attrs: Record<string, unknown>): Record<string, unknown> => {
      for (const key in attrs) {
        if (GROUP_KEYS.has(key)) {
          const rest: Record<string, unknown> = {}
          for (const k in attrs) {
            if (!GROUP_KEYS.has(k))
              rest[k] = attrs[k]
          }
          return rest
        }
      }
      return attrs
    },
    /** The group's element bindings, read in render. */
    attrs: (): Record<string, unknown> => ({
      'tabindex': isTabbingBackOut.value || focusableItemsCount.value === 0 ? -1 : 0,
      'data-orientation': orientation.value,
      'dir': dir.value,
      'style': OUTLINE_NONE,
      onMousedown,
      onMouseup,
      onFocus,
      onBlur,
      onKeydown,
    }),
  }
}

export type UseRovingFocusGroupReturn = ReturnType<typeof useRovingFocusGroup>

/** `options`, with the consumer's group attrs merged in (see `consumerAttrs`). */
function withConsumerAttrs(options: UseRovingFocusGroupOptions): UseRovingFocusGroupOptions {
  const { read, readBoolean, listener } = consumerGroupAttrs()
  const under = options.consumerAttrs === 'under'
  /** The consumer's value over the part's option, or (`under`) only for an option the part leaves unset. */
  function pick<V>(attr: { value: unknown } | undefined, option: (() => V) | undefined): V | undefined {
    if (attr && !(under && option))
      return attr.value as V
    return option?.()
  }
  const owned = options.currentTabStopId ?? ref<string | null | undefined>(read('defaultCurrentTabStopId')?.value as string | undefined)
  const controlledByConsumer = !(under && options.currentTabStopId)
  const updateListener = () => listener('onUpdate:currentTabStopId') ?? listener('onUpdate:current-tab-stop-id')
  return {
    ...options,
    orientation: () => pick(read('orientation'), options.orientation),
    dir: () => pick(read('dir'), options.dir),
    loop: () => {
      const loop = readBoolean('loop')
      return pick(loop === undefined ? undefined : { value: loop }, options.loop)
    },
    preventScrollOnEntryFocus: () => {
      const prevent = readBoolean('preventScrollOnEntryFocus')
      return pick(prevent === undefined ? undefined : { value: prevent }, options.preventScrollOnEntryFocus)
    },
    // A `v-model:current-tab-stop-id` on the part controls the group, as it
    // did the wrapper's (unless, `under`, the part binds its own); the
    // consumer's update listener runs either way.
    currentTabStopId: computed({
      get: () => {
        const controlled = controlledByConsumer ? read('currentTabStopId') : undefined
        return controlled && controlled.value !== undefined ? controlled.value as string | null : owned.value
      },
      set: (value) => {
        owned.value = value
        callListener(updateListener(), value)
      },
    }),
    // Merged listeners, in the order the wrapper ran them: a root's fallthrough
    // after the part's own, an `as-child` chain's before.
    onEntryFocus: (event) => {
      if (under)
        callListener(listener('onEntryFocus'), event)
      options.onEntryFocus?.(event)
      if (!under)
        callListener(listener('onEntryFocus'), event)
    },
  }
}
