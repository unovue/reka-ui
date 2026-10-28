<script lang="ts">
import type { Ref } from 'vue'
import type {
  Direction,
  Orientation,
} from './utils'
import type { PrimitiveProps } from '@/Primitive'
import { createContext, mergeExpose, useDirection, useForwardElement } from '@/shared'

export interface RovingFocusGroupProps extends PrimitiveProps {
  /**
   * The orientation of the group.
   * Mainly so arrow navigation is done accordingly (left & right vs. up & down)
   */
  orientation?: Orientation
  /**
   * The direction of navigation between items.
   */
  dir?: Direction
  /**
   * Whether keyboard navigation should loop around
   * @defaultValue false
   */
  loop?: boolean
  /** The controlled value of the current stop item. Can be binded as `v-model`. */
  currentTabStopId?: string | null
  /**
   * The value of the current stop item.
   *
   * Use when you do not need to control the state of the stop item.
   */
  defaultCurrentTabStopId?: string
  /**
   * When `true`, will prevent scrolling to the focus item when focused.
   */
  preventScrollOnEntryFocus?: boolean
}

export type RovingFocusGroupEmits = {
  'entryFocus': [event: Event]
  'update:currentTabStopId': [value: string | null | undefined]
}

interface RovingContext {
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
</script>

<script setup lang="ts">
import type { RovingFocusItemMeta } from './useRovingFocusItem'
import type { KeyedSelector } from '@/shared/createKeyedSelector'
import { useVModel } from '@vueuse/core'
import { nextTick, ref, toRefs } from 'vue'
import { getCollectionMeta, useCollection, useCollectionSlot } from '@/Collection'
import { Primitive } from '@/Primitive'
import { createKeyedSelector } from '@/shared/createKeyedSelector'
import { ENTRY_FOCUS, EVENT_OPTIONS, focusFirst, getFocusIntent, wrapArray } from './utils'

defineOptions({
  // `$attrs` are bound first in the template, under the group's own
  // bindings: the precedence the former CollectionSlot wrapper gave them.
  inheritAttrs: false,
})

const props = withDefaults(defineProps<RovingFocusGroupProps>(), {
  loop: false,
  orientation: undefined,
  preventScrollOnEntryFocus: false,
})
const emits = defineEmits<RovingFocusGroupEmits>()

const { loop, orientation, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
const currentTabStopId = useVModel(props, 'currentTabStopId', emits, {
  defaultValue: props.defaultCurrentTabStopId,
  passive: (props.currentTabStopId === undefined) as false,
})
const isTabbingBackOut = ref(false)
const isClickFocus = ref(false)
const focusableItemsCount = ref(0)

const { getItems, getItem } = useCollection({ isProvider: true })

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
function handleKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented)
    return
  const item = findItem(event.target as Element | null, event.currentTarget as Element)
  if (item)
    navigate(event, item)
}

/** An item outside the group's element (teleported) listens on itself. */
function handleDetachedItemKeydown(event: KeyboardEvent) {
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

function handleFocus(event: FocusEvent) {
  // We normally wouldn't need this check, because we already check
  // that the focus is on the current target and not bubbling to it.
  // We do this because Safari doesn't focus buttons when clicked, and
  // instead, the wrapper will get focused and not through a bubbling event.
  const isKeyboardFocus = !isClickFocus.value

  if (
    event.currentTarget
    && event.target === event.currentTarget
    && isKeyboardFocus
    && !isTabbingBackOut.value
  ) {
    const entryFocusEvent = new CustomEvent(ENTRY_FOCUS, EVENT_OPTIONS)
    event.currentTarget.dispatchEvent(entryFocusEvent)
    emits('entryFocus', entryFocusEvent)

    if (!entryFocusEvent.defaultPrevented) {
      const items = getItems().map(i => i.ref).filter(i => i.dataset.disabled !== '')
      const activeItem = items.find(item => item.getAttribute('data-active') === '')
      const highlightedItem = items.find(item => item.getAttribute('data-highlighted') === '')
      const currentItem = items.find(
        item => item.id === currentTabStopId.value,
      )
      const candidateItems = [activeItem, highlightedItem, currentItem, ...items].filter(
        Boolean,
      ) as typeof items
      focusFirst(candidateItems, props.preventScrollOnEntryFocus)
    }
  }
  isClickFocus.value = false
}

function handleMouseUp() {
  // reset `isClickFocus` after 1 tick because handleFocus might not triggered due to focused element
  setTimeout(() => {
    isClickFocus.value = false
  }, 1)
}

const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(mergeExpose(expose, {
  getItems,
}))
useCollectionSlot(currentElement)

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
  rootElement: currentElement,
  onDetachedItemKeydown: handleDetachedItemKeydown,
  onFocusableItemRemove: () => {
    focusableItemsCount.value--
  },
})
</script>

<template>
  <Primitive
    v-bind="$attrs"
    :ref="forwardRef"
    :tabindex="isTabbingBackOut || focusableItemsCount === 0 ? -1 : 0"
    :data-orientation="orientation"
    :as="as"
    :as-child="asChild"
    :dir="dir"
    style="outline: none"
    @mousedown="isClickFocus = true"
    @mouseup="handleMouseUp"
    @focus="handleFocus"
    @blur="isTabbingBackOut = false"
    @keydown="handleKeydown"
  >
    <slot />
  </Primitive>
</template>
