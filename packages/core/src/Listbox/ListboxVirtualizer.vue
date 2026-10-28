<script lang="ts">
export interface ListboxVirtualizerProps<T extends AcceptableValue = AcceptableValue> {
  /**
   * List of items, or, with `grouped`, groups of items (`{ label, options, disabled? }`).
   * Groups are flattened to rows: a header row rendered by the `group` slot, then
   * the group's options. Each option is the value of the item the default slot renders.
   */
  options: T[] | VirtualGroup<T>[]
  /** When `true`, `options` holds groups (`VirtualGroup`) rather than options. */
  grouped?: boolean
  /** Number of items rendered outside the visible area */
  overscan?: number
  /** Estimated size (in px) of each item. A function receives the row index (group header rows included). */
  estimateSize?: number | ((index: number) => number)
  /** Text content for each item, used by typeahead and by a `ListboxRoot` `filter` (both otherwise use the option's string form). Required for object options. */
  textContent?: (option: T) => string
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import type { VirtualItem, Virtualizer } from '@tanstack/vue-virtual'
import type { Ref } from 'vue'
import type { VirtualGroup } from './useListVirtualizer'
import type { AcceptableValue } from '@/shared/types'
import { useParentElement } from '@vueuse/core'
import { refAutoReset } from '@vueuse/shared'
import { onUnmounted, useSlots, watch, watchSyncEffect } from 'vue'
import { useCollection } from '@/Collection'
import { findValuesBetween, getActiveElement, useForwardElement, useId } from '@/shared'
import { isDisabledItem } from '@/shared/isDisabledItem'
import { injectListboxRootContext } from './ListboxRoot.vue'
import { useListVirtualizer } from './useListVirtualizer'
import { compare, queryCheckedElement } from './utils'

const props = defineProps<ListboxVirtualizerProps<T>>()

defineSlots<{
  default?: (props: {
    option: T
    virtualizer: Virtualizer<HTMLElement, Element>
    virtualItem: VirtualItem
  }) => any
  /** A group header row, when `options` holds groups. */
  group?: (props: {
    group: VirtualGroup<T>
    virtualItem: VirtualItem
  }) => any
}>()

const slots = useSlots()
const rootContext = injectListboxRootContext()
const parentEl = useParentElement() as Ref<HTMLElement>
const { getItems } = useCollection<{ value: T }>()

// set virtual true when this component mounted
rootContext.isVirtual.value = true

// The root's `filter` (#2824 item 7) applies to `options`, not to the rendered
// rows: a filtered-out option takes no virtual index, is not counted in
// `aria-setsize`, and is skipped by navigation, typeahead and select-all. A
// group left with no matching option is dropped.
let hasWarnedTextContent = false
const list = useListVirtualizer<T>({
  options: () => props.options,
  grouped: () => props.grouped,
  filter: () => {
    if (!rootContext.isFilterActive.value)
      return undefined
    return (option, text) => {
      if (process.env.NODE_ENV !== 'production' && !props.textContent && !hasWarnedTextContent && option !== null && typeof option === 'object') {
        hasWarnedTextContent = true
        console.warn('[reka-ui] ListboxVirtualizer: pass `textContent` to filter object options.')
      }
      return rootContext.filterOption(option, text)
    }
  },
  textContent: () => props.textContent,
  estimateSize: () => props.estimateSize,
  overscan: () => props.overscan,
  horizontal: () => rootContext.orientation.value === 'horizontal',
  scrollElement: parentEl,
  idPrefix: useId(undefined, 'reka-listbox-virtualizer'),
})
const { options, virtualizer } = list

// Rows are keyed by index, so a highlighted row is reused for another option
// once the list is filtered. Before the rows re-render, drop the highlight if
// its option no longer matches.
watch(options, (current) => {
  const element = rootContext.highlightedElement.value
  const highlighted = element && getItems(true).find(i => i.ref === element)
  if (highlighted && !current.some(option => compare(option, highlighted.value, rootContext.by)))
    rootContext.highlightedElement.value = null
})
watchSyncEffect(() => {
  rootContext.virtualFilterCount.value = options.value.length
})
onUnmounted(() => {
  rootContext.virtualFilterCount.value = undefined
})

const virtualizedItems = list.renderRows(slots as any)

rootContext.virtualFocusHook.on(({ event, scroll }) => {
  // `scroll` is `false` only for the initial mount highlight. There we set the
  // roving-tabindex target without focusing or scrolling, so a virtualized
  // Listbox below the fold doesn't pull the page to it on load. User-driven
  // highlights (keyboard, typeahead, select) keep scrolling as before.
  const index = options.value.findIndex((option) => {
    if (Array.isArray(rootContext.modelValue.value))
      return compare(option, rootContext.modelValue.value[0], rootContext.by)
    else
      return compare(option, rootContext.modelValue.value!, rootContext.by)
  })
  if (index !== -1) {
    event?.preventDefault()

    // Bringing the checked item into the (internal) scroll viewport is safe — it
    // only scrolls the listbox container, never the page.
    list.scrollToOption(index, 'start')
    requestAnimationFrame(() => {
      const item = queryCheckedElement(parentEl.value)
      if (item) {
        const focus = event ? true : scroll ? undefined : false
        rootContext.changeHighlight(item, scroll, focus)
      }
    })
  }
  else if (scroll) {
    rootContext.highlightFirstItem()
  }
  else {
    // Mount highlight with no checked item: highlight the first enabled item only,
    // mirroring the non-virtual path. `highlightFirstItem` is reserved for
    // user-driven PageUp/Home navigation, which focuses and scrolls.
    requestAnimationFrame(() => {
      const item = getItems().find(i => !isDisabledItem(i.ref))?.ref
      if (item)
        rootContext.changeHighlight(item, false, false)
    })
  }
})

rootContext.virtualHighlightHook.on((value) => {
  const index = options.value.findIndex((option) => {
    return compare(option, value, rootContext.by)
  })
  list.scrollToOption(index, 'start')
  requestAnimationFrame(() => {
    const item = queryCheckedElement(parentEl.value)
    if (item)
      rootContext.changeHighlight(item)
  })
})

// Reset `search` 1 second after it was last updated
const search = refAutoReset('', 1000)

function handleMultipleReplace(event: Event, intent: 'first' | 'last' | 'prev' | 'next') {
  if (!rootContext.firstValue?.value || !rootContext.multiple.value || !Array.isArray(rootContext.modelValue.value))
    return

  const collection = getItems().filter(i => !isDisabledItem(i.ref))
  const lastValue = collection.find(i => i.ref === rootContext.highlightedElement.value)?.value
  if (!lastValue)
    return

  let value: T[] | null = null
  switch (intent) {
    case 'prev':
    case 'next': {
      value = findValuesBetween(options.value, rootContext.firstValue.value as T, lastValue)
      break
    }
    case 'first': {
      value = findValuesBetween(options.value, rootContext.firstValue.value as T, options.value?.[0])
      break
    }
    case 'last': {
      value = findValuesBetween(options.value, rootContext.firstValue.value as T, options.value.at(-1)!)
      break
    }
  }
  rootContext.modelValue.value = value
}

rootContext.virtualKeydownHook.on(({ event, intent: resolvedIntent }) => {
  const isMetaKey = event.altKey || event.ctrlKey || event.metaKey
  const isTabKey = event.key === 'Tab' && !isMetaKey
  if (isTabKey)
    return

  // The root resolved the intent (the `getNavigationIntent` override
  // included); a `null` intent is never re-derived from `event.key`, so an
  // opted-out key does not move and a custom mapping is honoured.
  let intent: 'first' | 'last' | 'prev' | 'next' | undefined = resolvedIntent ?? undefined

  // Meta + A, select all feature
  if (isMetaKey && event.key === 'a' && rootContext.multiple.value) {
    event.preventDefault()
    rootContext.modelValue.value = [...options.value]
    // purposely make the focus to last
    intent = 'last'
  }
  else if (event.shiftKey && intent) {
    handleMultipleReplace(event, intent)
  }

  if (intent === 'first' || intent === 'last') {
    event.preventDefault()

    list.scrollToOption(intent === 'first' ? 0 : options.value.length - 1)
    requestAnimationFrame(() => {
      const items = getItems()
      const item = intent === 'first' ? items[0] : items.at(-1)
      if (item)
        rootContext.changeHighlight(item.ref)
    })
  }
  // Typeahead only for a printable character (not `Shift`, `Home`, …).
  else if (!intent && !isMetaKey && event.key.length === 1) {
    search.value += event.key
    const next = list.getTypeaheadMatch(search.value, list.optionIndexOfElement(getActiveElement()))
    if (next !== undefined) {
      const rowIndex = list.scrollToOption(next, 'start')
      requestAnimationFrame(() => {
        const item = parentEl.value.querySelector(`[data-index="${rowIndex}"]`)
        if (item instanceof HTMLElement)
          rootContext.changeHighlight(item)
      })
    }
  }
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <div
    :ref="forwardRef"
    data-reka-virtualizer
    :style="{
      position: 'relative',
      width: '100%',
      height: `${virtualizer.getTotalSize()}px`,
    }"
  >
    <component
      :is="is"
      v-for="{ is, item } in virtualizedItems"
      :key="item.index"
    />
  </div>
</template>
