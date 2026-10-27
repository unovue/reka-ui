<script lang="ts">
export interface ListboxVirtualizerProps<T extends AcceptableValue = AcceptableValue> {
  /** List of items */
  options: T[]
  /** Number of items rendered outside the visible area */
  overscan?: number
  /** Estimated size (in px) of each item */
  estimateSize?: number | ((index: number) => number)
  /** Text content for each item, used by typeahead and by a `ListboxRoot` `filter` (which otherwise matches the option's string form) */
  textContent?: (option: T) => string
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import type { VirtualItem, Virtualizer } from '@tanstack/vue-virtual'
import type { Ref, VNode } from 'vue'
import type { AcceptableValue } from '@/shared/types'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useParentElement } from '@vueuse/core'
import { refAutoReset } from '@vueuse/shared'
import { cloneVNode, computed, Fragment, onUnmounted, useSlots, watch, watchSyncEffect } from 'vue'
import { useCollection } from '@/Collection'
import { findValuesBetween, getActiveElement } from '@/shared'
import { getNextMatch } from '@/shared/useTypeahead'
import { injectListboxRootContext } from './ListboxRoot.vue'
import { compare, queryCheckedElement } from './utils'

const props = defineProps<ListboxVirtualizerProps<T>>()

defineSlots<{
  default?: (props: {
    option: T
    virtualizer: Virtualizer<HTMLElement, Element>
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
// `aria-setsize`, and is skipped by navigation, typeahead and select-all.
let hasWarnedTextContent = false
const options = computed(() => {
  if (!rootContext.isFilterActive.value)
    return props.options

  if (process.env.NODE_ENV !== 'production' && !props.textContent && !hasWarnedTextContent && props.options.some(option => option !== null && typeof option === 'object')) {
    hasWarnedTextContent = true
    console.warn('[reka-ui] ListboxVirtualizer: pass `textContent` to filter object options.')
  }
  return props.options.filter(option => rootContext.filterOption(option, props.textContent ? props.textContent(option) : String(option)))
})
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

const padding = computed(() => {
  const el = parentEl.value
  if (!el) {
    return { start: 0, end: 0 }
  }
  else {
    const styles = window.getComputedStyle(el)
    return {
      start: Number.parseFloat(styles.paddingBlockStart || styles.paddingTop),
      end: Number.parseFloat(styles.paddingBlockEnd || styles.paddingBottom),
    }
  }
})

const virtualizer = useVirtualizer(
  {
    get scrollPaddingStart() { return padding.value.start },
    get scrollPaddingEnd() { return padding.value.end },
    get count() { return options.value.length },
    get horizontal() { return rootContext.orientation.value === 'horizontal' },
    estimateSize(index) {
      if (typeof props.estimateSize === 'function')
        return props.estimateSize(index)

      return props.estimateSize ?? 28
    },
    getScrollElement() { return parentEl.value },
    overscan: props.overscan ?? 12,
  },
)

const virtualizedItems = computed(() => virtualizer.value.getVirtualItems().map((item) => {
  const defaultNode = slots.default!({
    option: options.value[item.index],
    virtualizer: virtualizer.value,
    virtualItem: item,
  })[0]

  const targetNode = defaultNode.type === Fragment && Array.isArray(defaultNode.children)
    ? defaultNode.children.find(child => typeof (child as VNode).type !== 'symbol') as VNode
    : defaultNode

  return {
    item,
    is: cloneVNode(targetNode, {
      'key': `${item.key}`,
      'data-index': item.index,
      'aria-setsize': options.value.length,
      'aria-posinset': item.index + 1,
      'style': {
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translateY(${item.start}px)`,
        overflowAnchor: 'none',
      },
    }),
  }
}))

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
    virtualizer.value.scrollToIndex(index, { align: 'start' })
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
      const item = getItems().find(i => i.ref.dataset.disabled !== '')?.ref
      if (item)
        rootContext.changeHighlight(item, false, false)
    })
  }
})

rootContext.virtualHighlightHook.on((value) => {
  const index = options.value.findIndex((option) => {
    return compare(option, value, rootContext.by)
  })
  virtualizer.value.scrollToIndex(index, { align: 'start' })
  requestAnimationFrame(() => {
    const item = queryCheckedElement(parentEl.value)
    if (item)
      rootContext.changeHighlight(item)
  })
})

// Reset `search` 1 second after it was last updated
const search = refAutoReset('', 1000)
const optionsWithMetadata = computed(() => {
  const parseTextContent = (option: T) => {
    if (props.textContent)
      return props.textContent(option)
    else
      return option?.toString().toLowerCase()
  }

  return options.value.map((option, index) => ({
    index,
    textContent: parseTextContent(option),
  }))
})

function handleMultipleReplace(event: Event, intent: 'first' | 'last' | 'prev' | 'next') {
  if (!rootContext.firstValue?.value || !rootContext.multiple.value || !Array.isArray(rootContext.modelValue.value))
    return

  const collection = getItems().filter(i => i.ref.dataset.disabled !== '')
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

    const index = intent === 'first' ? 0 : options.value.length - 1
    virtualizer.value.scrollToIndex(index)
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
    const currentIndex = Number(getActiveElement()?.getAttribute('data-index'))
    const currentMatch = optionsWithMetadata.value[currentIndex].textContent
    const filteredOptions = optionsWithMetadata.value.map(i => i.textContent ?? '')
    const next = getNextMatch(filteredOptions, search.value, currentMatch)

    const nextMatch = optionsWithMetadata.value.find(option => option.textContent === next)
    if (nextMatch) {
      virtualizer.value.scrollToIndex(nextMatch.index, { align: 'start' })
      requestAnimationFrame(() => {
        const item = parentEl.value.querySelector(`[data-index="${nextMatch.index}"]`)
        if (item instanceof HTMLElement)
          rootContext.changeHighlight(item)
      })
    }
  }
})
</script>

<template>
  <div
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
