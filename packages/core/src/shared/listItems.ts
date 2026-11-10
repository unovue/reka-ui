import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { By } from './compare'
import type { AcceptableValue } from './types'
import { computed, toValue } from 'vue'
import { compare } from './compare'

// The `items` prop of Select and Combobox: the options as data, next to the
// rendered items. One shape for every family that takes it.

/** One option of a root's `items`. */
export interface ListItemData<T = AcceptableValue> {
  value: T
  /** The text shown for the value where its rendered item is not available. */
  label: string
  disabled?: boolean
}

/** A group of options in a root's `items`; keys besides `items` (a `label`, say) are free. */
export interface ListItemGroupData<T = AcceptableValue> {
  items: readonly ListItemData<T>[]
  [key: string]: unknown
}

/**
 * A root's `items`: the options as data. A
 * record maps each value (a string key; a number value finds its key) to its
 * label; an array holds `{ value, label, disabled? }` options, or groups of
 * them (`{ items }`), mixed or not.
 */
export type ListItems<T = AcceptableValue> = Readonly<Record<string, string>> | readonly ListItemData<T>[] | readonly ListItemGroupData<T>[]

function isItemGroup(item: unknown): item is ListItemGroupData<any> {
  return typeof item === 'object' && item !== null && Array.isArray((item as ListItemGroupData).items)
}

/** The options of `items`, flat and in order. @internal */
export function normalizeListItems<T>(items: ListItems<T> | undefined): ListItemData<T>[] | undefined {
  if (!items)
    return undefined
  if (!Array.isArray(items))
    return Object.keys(items).map(value => ({ value: value as T, label: (items as Record<string, string>)[value] }))
  return (items as readonly (ListItemData<T> | ListItemGroupData<T>)[])
    .flatMap(entry => isItemGroup(entry) ? entry.items as readonly ListItemData<T>[] : [entry])
}

/** `items`, flat, with a lookup by value. @internal */
export interface ListItemsIndex<T> {
  list: ListItemData<T>[]
  get: (value: T) => ListItemData<T> | undefined
  /** A record: its values are its (string) keys. */
  record: boolean
}

function isPrimitiveKey(value: unknown): value is string | number | bigint | boolean {
  const type = typeof value
  return type === 'string' || type === 'number' || type === 'bigint' || type === 'boolean'
}

/**
 * Indexes `items` for lookups matched with `by`. Plain data, no reactive
 * writes: the caller's `computed` rebuilds it when `items` changes. A record
 * matches a value by its string form, as `items[value]` does.
 * @internal
 */
export function createListItemsIndex<T>(items: ListItems<T> | undefined, by: By<T> | undefined): ListItemsIndex<T> | undefined {
  const list = normalizeListItems(items)
  if (!list)
    return undefined
  const isRecord = !Array.isArray(items)
  const keyOf = (value: unknown): unknown => {
    if (typeof by === 'function')
      return undefined
    if (isRecord)
      return isPrimitiveKey(value) ? String(value) : undefined
    const key = typeof by === 'string' && value !== null && typeof value === 'object' ? (value as Record<string, unknown>)[by] : value
    return isPrimitiveKey(key) ? key : undefined
  }
  const index = new Map<unknown, ListItemData<T>>()
  for (const item of list) {
    const key = keyOf(item.value)
    if (key !== undefined && !index.has(key))
      index.set(key, item)
  }
  return {
    list,
    record: isRecord,
    get: (value) => {
      const key = keyOf(value)
      if (key !== undefined)
        return index.get(key)
      return list.find(item => compare(item.value, value, by))
    },
  }
}

/**
 * What a root that reads `items` on demand keeps: the prop, `by`, and the
 * index, which is only created by the first lookup that finds `items` set.
 * @internal
 */
export interface ListItemsSource<T> {
  items?: MaybeRefOrGetter<ListItems<T> | undefined>
  by?: By<T>
  /** @internal */
  itemsIndex?: ComputedRef<ListItemsIndex<T> | undefined>
}

/**
 * The `items` entry of `value`, or `undefined` when `items` is not set or does
 * not list it. Reactive: a caller inside an effect follows `items`. A root
 * without `items` holds no index and no `computed`.
 * @internal
 */
export function getListItemData<T>(source: ListItemsSource<T>, value: T): ListItemData<T> | undefined {
  if (source.items === undefined || toValue(source.items) === undefined)
    return undefined
  return (source.itemsIndex ??= computed(() => createListItemsIndex(toValue(source.items), source.by))).value?.get(value)
}
