<script lang="ts">
import type { VirtualGroup } from '@/Listbox/useListVirtualizer'
import type { AcceptableValue } from '@/shared/types'

export interface SelectVirtualizerProps<T extends AcceptableValue = AcceptableValue> {
  /**
   * List of items, or groups of items (`{ label, options, disabled? }`). Each
   * option is the `value` of the `SelectItem` the default slot renders.
   */
  options: T[] | VirtualGroup<T>[]
  /** Number of items rendered outside the visible area */
  overscan?: number
  /** Estimated size (in px) of each item. A function receives the row index (group header rows included). */
  estimateSize?: number | ((index: number) => number)
  /** Text content for each item, used by typeahead and by `SelectValue` while the item is not rendered. Required for object options. */
  textContent?: (option: T) => string
}
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import type { VirtualItem, Virtualizer } from '@tanstack/vue-virtual'
import type { Ref, VNode } from 'vue'
import { useParentElement } from '@vueuse/core'
import { cloneVNode, computed, Fragment, h, onUnmounted, useSlots, watch } from 'vue'
import { useCollection } from '@/Collection'
import { isGroupedOptions, useListVirtualizer } from '@/Listbox/useListVirtualizer'
import { compare, getActiveElement, useForwardElement, useId } from '@/shared'
import { injectSelectContentContext } from './SelectContentImpl.vue'
import { injectSelectRootContext } from './SelectRoot.vue'

const props = defineProps<SelectVirtualizerProps<T>>()

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
const rootContext = injectSelectRootContext()
const contentContext = injectSelectContentContext()
const parentEl = useParentElement() as Ref<HTMLElement | undefined>
const { getItems } = useCollection()

// Closed, the content renders its items into a detached fragment only so they
// register their labels; the virtualizer registers every label itself (below)
// and renders no row there.
const isOpenContent = computed(() => !!contentContext.content)
// Virtualization needs a scroll container the content does not resize to its
// items: `position="popper"`. Item-aligned positioning measures the selected
// item, so there the options render flat.
const isVirtual = computed(() => isOpenContent.value && contentContext.position === 'popper')

if (process.env.NODE_ENV !== 'production' && isOpenContent.value && contentContext.position !== 'popper')
  console.warn('[reka-ui] SelectVirtualizer: only supported with `<SelectContent position="popper">`; rendering the options without virtualization.')

const list = useListVirtualizer<T>({
  options: () => props.options,
  textContent: () => props.textContent,
  estimateSize: () => props.estimateSize,
  overscan: () => props.overscan,
  scrollElement: parentEl,
  idPrefix: useId(undefined, 'reka-select-virtualizer'),
})
const { options, virtualizer } = list

// The sticky label registry (#2824 item 2): every option's text, rendered or
// not, so `SelectValue`, the native select and the closed-trigger typeahead
// know every option. Without `textContent` only primitive options have a
// meaningful text. A rendered `SelectItemText` overwrites its entry.
watch(() => [props.options, props.textContent] as const, () => {
  const source = props.options
  const register = (option: T, disabled = false) => {
    if (props.textContent || (option !== null && typeof option !== 'object'))
      rootContext.labels.register(option, list.optionText(option), disabled)
  }
  if (isGroupedOptions(source)) {
    for (const group of source)
      group.options.forEach(option => register(option, !!group.disabled))
  }
  else {
    (source as T[]).forEach(option => register(option))
  }
}, { immediate: true })

const virtualRows = list.renderRows(slots as any)

function firstNode(nodes: VNode[] | undefined) {
  const node = nodes?.[0]
  if (!node)
    return undefined
  return node.type === Fragment && Array.isArray(node.children)
    ? node.children.find(child => typeof (child as VNode).type !== 'symbol') as VNode
    : node
}

// Item-aligned fallback: every row, in flow, with the same ids and aria.
const flatRows = computed(() => {
  if (!isOpenContent.value || isVirtual.value)
    return []
  const size = options.value.length
  return list.rows.value.flatMap((row, index) => {
    const virtualItem = { index, key: index, start: 0, end: 0, size: 0, lane: 0 } as VirtualItem
    if (row.type === 'group') {
      const node = firstNode(slots.group?.({ group: row.group, virtualItem })) ?? h('div', row.group.label)
      return [{ key: index, is: cloneVNode(node, { 'id': row.id, 'role': 'presentation', 'data-reka-virtualizer-group': '' }) }]
    }
    const node = firstNode(slots.default?.({ option: row.option, virtualizer: virtualizer.value, virtualItem }))
    if (!node)
      return []
    return [{
      key: index,
      is: cloneVNode(node, {
        'aria-setsize': size,
        'aria-posinset': row.optionIndex + 1,
        ...(row.groupId ? { 'aria-describedby': row.groupId } : {}),
        ...(row.group?.disabled ? { disabled: true } : {}),
      }),
    }]
  })
})

function enabledItems() {
  return getItems().map(item => item.ref).filter(el => !el.hasAttribute('data-disabled'))
}

/** Scrolls the option's row into the viewport, then focuses it (or the first enabled rendered item after it). */
function focusOption(optionIndex: number, fallback: 'first' | 'last' = 'first') {
  const rowIndex = list.scrollToOption(optionIndex, 'auto')
  requestAnimationFrame(() => {
    const row = parentEl.value?.querySelector<HTMLElement>(`[data-index="${rowIndex}"]`)
    if (row && !row.hasAttribute('data-disabled')) {
      row.focus()
      return
    }
    const items = enabledItems()
    const item = fallback === 'first' ? items[0] : items.at(-1)
    item?.focus()
  })
}

function focusSelected() {
  const value = rootContext.modelValue.value
  const selected = Array.isArray(value) ? value[0] : value
  const index = selected === undefined ? -1 : options.value.findIndex(option => compare(option, selected as T, rootContext.by))
  if (index !== -1) {
    const rowIndex = list.scrollToOption(index, 'start')
    requestAnimationFrame(() => {
      const row = parentEl.value?.querySelector<HTMLElement>(`[data-index="${rowIndex}"]`)
      ;(row ?? enabledItems()[0] ?? contentContext.content?.value)?.focus()
    })
  }
  else {
    requestAnimationFrame(() => (enabledItems()[0] ?? contentContext.content?.value)?.focus())
  }
}

function onVirtualKeydown(event: KeyboardEvent, intent: string | null | undefined) {
  if (!options.value.length)
    return false
  const isModifierKey = event.ctrlKey || event.altKey || event.metaKey
  const current = list.optionIndexOfElement(getActiveElement())
  const last = options.value.length - 1

  if (intent === 'first' || intent === 'last') {
    focusOption(intent === 'first' ? 0 : last, intent)
    return true
  }
  if (intent === 'prev' || intent === 'next') {
    // A move inside the rendered window is left to the content (the neighbour
    // is rendered, the overscan guarantees it); only a loop past either end
    // targets a row that may not be.
    const atEnd = intent === 'next' ? current === last : current === 0
    if (atEnd && contentContext.loop?.()) {
      focusOption(intent === 'next' ? 0 : last, intent === 'next' ? 'first' : 'last')
      return true
    }
    return false
  }
  if (!intent && !isModifierKey && event.key.length === 1 && contentContext.searchRef) {
    contentContext.searchRef.value += event.key
    const next = list.getTypeaheadMatch(contentContext.searchRef.value, current)
    if (next !== undefined)
      focusOption(next)
    return true
  }
  return false
}

watch(isVirtual, (virtual) => {
  if (virtual) {
    contentContext.onVirtualKeydown = onVirtualKeydown
    contentContext.focusSelectedItem = focusSelected
  }
}, { immediate: true })

onUnmounted(() => {
  if (contentContext.onVirtualKeydown === onVirtualKeydown)
    contentContext.onVirtualKeydown = undefined
})

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <div
    v-if="isVirtual"
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
      v-for="{ is, item } in virtualRows"
      :key="item.index"
    />
  </div>
  <template v-else-if="isOpenContent">
    <component
      :is="is"
      v-for="{ is, key } in flatRows"
      :key="key"
    />
  </template>
</template>
