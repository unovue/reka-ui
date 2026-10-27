import type { VirtualItem, Virtualizer } from '@tanstack/vue-virtual'
import type { ComputedRef, Ref, VNode } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { cloneVNode, computed, Fragment, h } from 'vue'
import { getNextMatch } from '@/shared/useTypeahead'

/**
 * A group of options for a virtualized list (#2824 item 6). Groups are
 * flattened into one row index space: a header row for the group, then a row
 * per option. Header rows are not options: navigation, typeahead, select-all
 * and range selection skip them, and `aria-setsize` / `aria-posinset` count
 * options only.
 */
export interface VirtualGroup<T> {
  /** The group's label, rendered by the `group` slot (or as plain text without one). */
  label: string
  /** The options in the group. */
  options: T[]
  /** When `true`, every option of the group renders `disabled`. */
  disabled?: boolean
}

export type ListVirtualizerRow<T>
  = | { type: 'option', option: T, optionIndex: number, group?: VirtualGroup<T>, groupId?: string }
    | { type: 'group', group: VirtualGroup<T>, id: string }

export interface ListVirtualizerSlots<T> {
  default?: (props: { option: T, virtualizer: Virtualizer<HTMLElement, Element>, virtualItem: VirtualItem }) => VNode[] | undefined
  group?: (props: { group: VirtualGroup<T>, virtualItem: VirtualItem }) => VNode[] | undefined
}

export interface UseListVirtualizerOptions<T> {
  /** Flat options, or groups of options. */
  options: () => T[] | VirtualGroup<T>[]
  /** Keeps an option when it returns `true`; a group left with no option is dropped. */
  filter?: () => ((option: T, text: string) => boolean) | undefined
  /** Text of an option, for typeahead, filtering and the label registry. */
  textContent: () => ((option: T) => string) | undefined
  estimateSize: () => number | ((index: number) => number) | undefined
  overscan: () => number | undefined
  horizontal?: () => boolean
  /** The scroll container (the virtualizer's parent element). */
  scrollElement: Ref<HTMLElement | undefined>
  /** Prefix for the group header ids. */
  idPrefix: string
}

export function isVirtualGroup<T>(entry: unknown): entry is VirtualGroup<T> {
  return entry !== null && typeof entry === 'object'
    && Array.isArray((entry as VirtualGroup<T>).options)
    && typeof (entry as VirtualGroup<T>).label === 'string'
}

/** `true` when every entry is a `VirtualGroup` (an empty list is flat). */
export function isGroupedOptions<T>(options: T[] | VirtualGroup<T>[]): options is VirtualGroup<T>[] {
  return options.length > 0 && options.every(entry => isVirtualGroup<T>(entry))
}

/** Every option of `options`, groups flattened. */
export function flattenVirtualOptions<T>(options: T[] | VirtualGroup<T>[]): T[] {
  return isGroupedOptions(options) ? options.flatMap(group => group.options) : options as T[]
}

/**
 * The virtualization core shared by `ListboxVirtualizer` (and so
 * `ComboboxVirtualizer`) and `SelectVirtualizer` (#2824): the flat row model
 * (grouped options flattened to header + option rows, after filtering), the
 * tanstack virtualizer, the absolutely positioned row vnodes and typeahead
 * over every option, rendered or not.
 *
 * @internal
 * @lifecycle setup — creates the tanstack virtualizer; call inside a component's `setup()`.
 */
export function useListVirtualizer<T>(options: UseListVirtualizerOptions<T>) {
  function optionText(option: T) {
    const textContent = options.textContent()
    return textContent ? textContent(option) : String(option)
  }

  const rows = computed<ListVirtualizerRow<T>[]>(() => {
    const source = options.options()
    const filter = options.filter?.()
    const keep = (option: T) => !filter || filter(option, optionText(option))
    const result: ListVirtualizerRow<T>[] = []
    let optionIndex = 0
    if (isGroupedOptions(source)) {
      source.forEach((group, groupIndex) => {
        const kept = group.options.filter(keep)
        if (!kept.length)
          return
        const id = `${options.idPrefix}-group-${groupIndex}`
        result.push({ type: 'group', group, id })
        for (const option of kept)
          result.push({ type: 'option', option, optionIndex: optionIndex++, group, groupId: id })
      })
    }
    else {
      for (const option of source as T[]) {
        if (keep(option))
          result.push({ type: 'option', option, optionIndex: optionIndex++ })
      }
    }
    return result
  })

  /** The rendered options in order, groups flattened, after filtering. */
  const flatOptions = computed(() => rows.value.flatMap(row => row.type === 'option' ? [row.option] : []))
  /** Row index of each option index. */
  const optionRowIndex = computed(() => rows.value.flatMap((row, index) => row.type === 'option' ? [index] : []))

  const padding = computed(() => {
    const el = options.scrollElement.value
    if (!el)
      return { start: 0, end: 0 }
    const styles = window.getComputedStyle(el)
    return {
      start: Number.parseFloat(styles.paddingBlockStart || styles.paddingTop),
      end: Number.parseFloat(styles.paddingBlockEnd || styles.paddingBottom),
    }
  })

  const virtualizer = useVirtualizer({
    get scrollPaddingStart() { return padding.value.start },
    get scrollPaddingEnd() { return padding.value.end },
    get count() { return rows.value.length },
    get horizontal() { return options.horizontal?.() ?? false },
    estimateSize(index) {
      const estimateSize = options.estimateSize()
      if (typeof estimateSize === 'function')
        return estimateSize(index)
      return estimateSize ?? 28
    },
    getScrollElement() { return options.scrollElement.value ?? null },
    overscan: options.overscan() ?? 12,
  })

  function rowIndexOfOption(optionIndex: number) {
    return optionRowIndex.value[optionIndex] ?? -1
  }

  /** The option index of a rendered row element (`data-index` is the row index). */
  function optionIndexOfElement(element: Element | null | undefined) {
    const rowIndex = Number(element?.getAttribute('data-index'))
    const row = Number.isNaN(rowIndex) ? undefined : rows.value[rowIndex]
    return row?.type === 'option' ? row.optionIndex : -1
  }

  function scrollToOption(optionIndex: number, align?: 'start' | 'center' | 'end' | 'auto') {
    const rowIndex = rowIndexOfOption(optionIndex)
    if (rowIndex !== -1)
      virtualizer.value.scrollToIndex(rowIndex, align ? { align } : undefined)
    return rowIndex
  }

  function firstNode(nodes: VNode[] | undefined) {
    const node = nodes?.[0]
    if (!node)
      return undefined
    return node.type === Fragment && Array.isArray(node.children)
      ? node.children.find(child => typeof (child as VNode).type !== 'symbol') as VNode
      : node
  }

  function renderRows(slots: ListVirtualizerSlots<T>): ComputedRef<Array<{ item: VirtualItem, is: VNode }>> {
    return computed(() => {
      const size = flatOptions.value.length
      return virtualizer.value.getVirtualItems().flatMap((item) => {
        const row = rows.value[item.index]
        if (!row)
          return []
        const style = {
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translateY(${item.start}px)`,
          overflowAnchor: 'none',
        }
        if (row.type === 'group') {
          const node = firstNode(slots.group?.({ group: row.group, virtualItem: item })) ?? h('div', row.group.label)
          return [{
            item,
            is: cloneVNode(node, {
              'key': `${item.key}`,
              'id': row.id,
              'role': 'presentation',
              'data-index': item.index,
              'data-reka-virtualizer-group': '',
              style,
            }),
          }]
        }
        const node = firstNode(slots.default?.({ option: row.option, virtualizer: virtualizer.value, virtualItem: item }))
        if (!node)
          return []
        return [{
          item,
          is: cloneVNode(node, {
            'key': `${item.key}`,
            'data-index': item.index,
            'aria-setsize': size,
            'aria-posinset': row.optionIndex + 1,
            ...(row.groupId ? { 'aria-describedby': row.groupId } : {}),
            ...(row.group?.disabled ? { disabled: true } : {}),
            style,
          }),
        }]
      })
    })
  }

  /**
   * The option index typeahead moves to for `search`, starting from the option
   * at `currentOptionIndex`; `undefined` when nothing matches.
   */
  function getTypeaheadMatch(search: string, currentOptionIndex: number): number | undefined {
    const textContent = options.textContent()
    const texts = flatOptions.value.map(option => (textContent ? textContent(option) : String(option ?? '').toLowerCase()) ?? '')
    const currentMatch = currentOptionIndex >= 0 ? texts[currentOptionIndex] : undefined
    const next = getNextMatch(texts, search, currentMatch)
    if (next === undefined)
      return undefined
    const index = texts.indexOf(next)
    return index === -1 ? undefined : index
  }

  return {
    rows,
    options: flatOptions,
    virtualizer,
    optionText,
    rowIndexOfOption,
    optionIndexOfElement,
    scrollToOption,
    renderRows,
    getTypeaheadMatch,
  }
}

export type UseListVirtualizerReturn<T> = ReturnType<typeof useListVirtualizer<T>>
