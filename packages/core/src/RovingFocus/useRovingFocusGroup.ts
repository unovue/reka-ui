import type { Ref } from 'vue'
import type { RovingFocusItemMeta } from './useRovingFocusItem'
import type { Direction, Orientation } from './utils'
import type { ElementSourceLike } from '@/Collection/Collection'
import type { KeyedSelector } from '@/shared/createKeyedSelector'
import { nextTick, ref } from 'vue'
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
