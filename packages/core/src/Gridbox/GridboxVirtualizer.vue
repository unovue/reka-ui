<script lang="ts">
export interface GridboxVirtualizerProps<T extends AcceptableValue = AcceptableValue> {
  /** List of items. */
  options: T[]
  /** Number of columns in the grid. */
  columns: number
  /** Number of items rendered outside the visible area. */
  overscan?: number
  /** Estimated size (in px) of each row. */
  estimateSize?: number
  /** Text content for each item to achieve type-ahead feature. */
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
import { cloneVNode, computed, Fragment, useSlots } from 'vue'
import { useCollection } from '@/Collection'
import { getActiveElement, queryCheckedElement, useKbd, valueComparator } from '@/shared'
import { getNextMatch } from '@/shared/useTypeahead'
import { injectGridboxRootContext } from './GridboxRoot.vue'

const props = defineProps<GridboxVirtualizerProps<T>>()

defineSlots<{
  row: (props: {
    row: T[]
    virtualizer: Virtualizer<HTMLElement, Element>
    virtualItem: VirtualItem
  }) => any
  cell: (props: {
    option: T
    virtualizer: Virtualizer<HTMLElement, Element>
    virtualItem: VirtualItem
    rowIndex: number
    colIndex: number
  }) => any
}>()

const slots = useSlots()
const rootContext = injectGridboxRootContext()
const parentEl = useParentElement() as Ref<HTMLElement>
const { getItems } = useCollection<{ value: T, row: number, col: number }>()
const kbd = useKbd()

// set virtual true when this component mounted
rootContext.isVirtual.value = true

// Create rows from options based on columns
const rows = computed(() => {
  const result: T[][] = []
  for (let i = 0; i < props.options.length; i += props.columns) {
    result.push(props.options.slice(i, i + props.columns))
  }
  return result
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
    get count() { return rows.value.length },
    get horizontal() { return false }, // Grid rows are always vertical.
    estimateSize() {
      return props.estimateSize ?? 40
    },
    getScrollElement() { return parentEl.value },
    overscan: props.overscan ?? 5,
  },
)

const virtualizedItems = computed(() => virtualizer.value.getVirtualItems().map((item) => {
  const rowData = rows.value[item.index]

  // Create cell vnodes for this row.
  const cellVNodes = rowData.map((option, colIndex) => {
    const globalIndex = item.index * props.columns + colIndex
    return slots.cell!({
      option,
      virtualizer: virtualizer.value,
      virtualItem: item,
      rowIndex: item.index,
      colIndex,
    }).map((cellNode) => {
      const targetCellNode = cellNode.type === Fragment && Array.isArray(cellNode.children)
        ? cellNode.children[0] as VNode
        : cellNode

      return cloneVNode(targetCellNode, {
        'key': `cell-${item.key}-${colIndex}`,
        'data-index': globalIndex,
        'data-row': item.index,
        'data-col': colIndex,
        'aria-setsize': props.options.length,
        'aria-posinset': globalIndex + 1,
      })
    })
  }).flat()

  // Create the row vnode and inject cells as children.
  const rowNode = slots.row!({
    row: rowData,
    virtualizer: virtualizer.value,
    virtualItem: item,
  })[0]

  const targetRowNode = rowNode.type === Fragment && Array.isArray(rowNode.children)
    ? rowNode.children[0] as VNode
    : rowNode

  // Clone the row node with updated props.
  const clonedRowNode = cloneVNode(targetRowNode, {
    'key': `row-${item.key}`,
    'data-row-index': item.index,
    'style': {
      position: 'absolute',
      top: 0,
      left: 0,
      transform: `translateY(${item.start}px)`,
      overflowAnchor: 'none',
      width: '100%',
    },
  })

  // Set children directly on the cloned vnode.
  clonedRowNode.children = cellVNodes

  return {
    item,
    is: clonedRowNode,
  }
}))

rootContext.virtualFocusHook.on((event) => {
  const index = props.options.findIndex((option) => {
    if (Array.isArray(rootContext.modelValue.value))
      return valueComparator(option, rootContext.modelValue.value[0], rootContext.by)
    else
      return valueComparator(option, rootContext.modelValue.value!, rootContext.by)
  })
  if (index !== -1) {
    event?.preventDefault()

    const rowIndex = Math.floor(index / props.columns)
    virtualizer.value.scrollToIndex(rowIndex, { align: 'start' })
    requestAnimationFrame(() => {
      const item = queryCheckedElement(parentEl.value)
      if (item) {
        rootContext.changeHighlight(item)
        if (event)
          item?.focus()
      }
    })
  }
  else {
    rootContext.highlightFirstItem()
  }
})

rootContext.virtualHighlightHook.on((value) => {
  const index = props.options.findIndex((option) => {
    return valueComparator(option, value, rootContext.by)
  })
  const rowIndex = Math.floor(index / props.columns)
  virtualizer.value.scrollToIndex(rowIndex, { align: 'start' })
  requestAnimationFrame(() => {
    const item = queryCheckedElement(parentEl.value)
    if (item)
      rootContext.changeHighlight(item)
  })
})

// Reset `search` 1 second after it was last updated.
const search = refAutoReset('', 1000)
const optionsWithMetadata = computed(() => {
  const parseTextContent = (option: T) => {
    if (props.textContent)
      return props.textContent(option)
    else
      return option?.toString().toLowerCase()
  }

  return props.options.map((option, index) => ({
    index,
    textContent: parseTextContent(option),
  }))
})

function handleMultipleReplace(event: Event, intent: 'first' | 'last' | 'prev' | 'next') {
  if (!rootContext.firstValue?.value || !rootContext.multiple.value || !Array.isArray(rootContext.modelValue.value))
    return

  const collection = getItems().filter(i => i.ref.dataset.disabled !== '')
  const lastValue = collection.find(i => i.ref === rootContext.highlightedElement.value)?.value.value
  if (!lastValue)
    return

  let value: T[] | null = null
  switch (intent) {
    case 'prev':
    case 'next': {
      // For grid, we need to find values between first and last in grid order.
      if (rootContext.firstValue && rootContext.firstValue.value !== undefined) {
        const firstIndex = props.options.findIndex(opt => valueComparator(opt, rootContext.firstValue!.value as T, rootContext.by))
        const lastIndex = props.options.findIndex(opt => valueComparator(opt, lastValue, rootContext.by))
        if (firstIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(firstIndex, lastIndex)
          const end = Math.max(firstIndex, lastIndex)
          value = props.options.slice(start, end + 1)
        }
      }
      break
    }
    case 'first': {
      if (rootContext.firstValue && rootContext.firstValue.value !== undefined) {
        const firstIndex = props.options.findIndex(opt => valueComparator(opt, rootContext.firstValue!.value as T, rootContext.by))
        if (firstIndex !== -1) {
          value = props.options.slice(0, firstIndex + 1)
        }
      }
      break
    }
    case 'last': {
      if (rootContext.firstValue && rootContext.firstValue.value !== undefined) {
        const firstIndex = props.options.findIndex(opt => valueComparator(opt, rootContext.firstValue!.value as T, rootContext.by))
        if (firstIndex !== -1) {
          value = props.options.slice(firstIndex)
        }
      }
      break
    }
  }
  if (value)
    rootContext.modelValue.value = value
}

rootContext.virtualKeydownHook.on((event) => {
  const isMetaKey = event.altKey || event.ctrlKey || event.metaKey
  const isTabKey = event.key === kbd.TAB && !isMetaKey
  if (isTabKey)
    return

  const currentElement = getActiveElement()
  const currentIndex = currentElement ? Number(currentElement.getAttribute('data-index')) : -1
  const currentRow = Math.floor(currentIndex / props.columns)
  const currentCol = currentIndex % props.columns

  // Meta + A, select all feature.
  if (isMetaKey && event.key === 'a' && rootContext.multiple.value) {
    event.preventDefault()
    rootContext.modelValue.value = [...props.options]
    // Focus last item
    const lastRowIndex = rows.value.length - 1
    virtualizer.value.scrollToIndex(lastRowIndex)
    requestAnimationFrame(() => {
      const items = getItems()
      const lastItem = items[items.length - 1]
      if (lastItem)
        rootContext.changeHighlight(lastItem.ref)
    })
    return
  }

  let targetIndex = currentIndex
  let shouldScroll = false

  switch (event.key) {
    case kbd.ARROW_RIGHT: {
      if (currentCol < props.columns - 1 && currentIndex + 1 < props.options.length) {
        targetIndex = currentIndex + 1
      }
      else if (currentIndex + 1 < props.options.length) {
        // Move to next row, first column.
        targetIndex = (currentRow + 1) * props.columns
        if (targetIndex >= props.options.length) {
          targetIndex = props.options.length - 1
        }
        shouldScroll = true
      }
      break
    }
    case kbd.ARROW_LEFT: {
      if (currentCol > 0) {
        targetIndex = currentIndex - 1
      }
      else if (currentRow > 0) {
        // Move to previous row, last column.
        targetIndex = currentRow * props.columns - 1
        shouldScroll = true
      }
      break
    }
    case kbd.ARROW_DOWN: {
      const nextRowIndex = Math.min(currentRow + 1, rows.value.length - 1)
      targetIndex = Math.min(nextRowIndex * props.columns + currentCol, props.options.length - 1)
      shouldScroll = true
      break
    }
    case kbd.ARROW_UP: {
      const prevRowIndex = Math.max(currentRow - 1, 0)
      targetIndex = prevRowIndex * props.columns + currentCol
      shouldScroll = true
      break
    }
    case kbd.HOME: {
      targetIndex = currentRow * props.columns
      break
    }
    case kbd.END: {
      targetIndex = Math.min((currentRow + 1) * props.columns - 1, props.options.length - 1)
      break
    }
  }

  if (targetIndex !== currentIndex && targetIndex >= 0 && targetIndex < props.options.length) {
    event.preventDefault()

    if (event.shiftKey) {
      handleMultipleReplace(event, 'next')
    }

    if (shouldScroll) {
      const targetRowIndex = Math.floor(targetIndex / props.columns)
      virtualizer.value.scrollToIndex(targetRowIndex, { align: 'start' })
    }

    requestAnimationFrame(() => {
      const item = parentEl.value.querySelector(`[data-index="${targetIndex}"]`)
      if (item instanceof HTMLElement)
        rootContext.changeHighlight(item)
    })
  }
  else if ([kbd.HOME, kbd.END, kbd.PAGE_UP, kbd.PAGE_DOWN].includes(event.key)) {
    event.preventDefault()

    let newIndex = currentIndex
    if (event.key === kbd.PAGE_UP || (event.key === kbd.HOME && isMetaKey)) {
      newIndex = 0
    }
    else if (event.key === kbd.PAGE_DOWN || (event.key === kbd.END && isMetaKey)) {
      newIndex = props.options.length - 1
    }

    if (newIndex !== currentIndex) {
      const targetRowIndex = Math.floor(newIndex / props.columns)
      virtualizer.value.scrollToIndex(targetRowIndex)
      requestAnimationFrame(() => {
        const item = parentEl.value.querySelector(`[data-index="${newIndex}"]`)
        if (item instanceof HTMLElement)
          rootContext.changeHighlight(item)
      })
    }
  }
  else if (!isMetaKey) {
    // Type-ahead search.
    search.value += event.key
    const filteredOptions = optionsWithMetadata.value.map(i => i.textContent ?? '')
    const currentMatch = optionsWithMetadata.value[currentIndex]?.textContent
    const next = getNextMatch(filteredOptions, search.value, currentMatch)

    const nextMatch = optionsWithMetadata.value.find(option => option.textContent === next)
    if (nextMatch) {
      const targetRowIndex = Math.floor(nextMatch.index / props.columns)
      virtualizer.value.scrollToIndex(targetRowIndex, { align: 'start' })
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
