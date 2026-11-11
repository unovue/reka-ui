import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { By } from '@/shared'
import type { AcceptableValue } from '@/shared/types'
import { computed, toValue } from 'vue'
import { compare } from '@/shared'

// The `items` prop of `ComboboxRoot`: the options as data. It is where the
// label of a selected value comes from when no rendered item can supply it
// (before the first open, on the server, while the item is filtered out).

/** A group of items in the root's `items`; keys besides `items` (a `label`, say) are free. */
export interface ComboboxItemGroup<I = unknown> {
  items: readonly I[]
  [key: string]: unknown
}

declare const comboboxItemCollection: unique symbol

/**
 * Items with a derived value and label each, made by `createComboboxItems()`.
 * Opaque: pass it to the root's `items` as it is.
 */
export interface ComboboxItemCollection<I = unknown, T = AcceptableValue> {
  /** @internal */
  readonly [comboboxItemCollection]: [item: I, value: T]
}

/** The root's `items`: an array of items, an array of groups of them (`{ items }`), or a `createComboboxItems()` collection. */
export type ComboboxItems<I = unknown, T = AcceptableValue> = readonly I[] | readonly ComboboxItemGroup<I>[] | ComboboxItemCollection<I, T>

export interface CreateComboboxItemsOptions<I, T> {
  /** The value an item is selected as: what the model holds and what `ComboboxItem` takes as its `value`. */
  getValue: (item: I) => T
  /** The text of an item: what the input shows while its value is selected. */
  getLabel: (item: I) => string
}

/** What a collection holds. @internal */
interface ComboboxItemCollectionData<I, T> extends CreateComboboxItemsOptions<I, T> {
  data: readonly I[] | readonly ComboboxItemGroup<I>[]
}

/**
 * Describes items of any shape for the root's `items`: `getValue` derives the
 * value an item is selected as (a string, number, bigint or boolean, an id
 * usually) and `getLabel` its text. The model then holds the derived values,
 * and the input shows the label of the selected one. `data` is an array of
 * items or of groups of them (`{ items }`).
 *
 * @example
 * ```ts
 * const items = createComboboxItems(users, {
 *   getValue: user => user.id,
 *   getLabel: user => user.name,
 * })
 * ```
 */
export function createComboboxItems<I, T extends string | number | bigint | boolean>(
  data: readonly I[] | readonly ComboboxItemGroup<I>[],
  options: CreateComboboxItemsOptions<I, T>,
): ComboboxItemCollection<I, T> {
  return { data, getValue: options.getValue, getLabel: options.getLabel } satisfies ComboboxItemCollectionData<I, T> as unknown as ComboboxItemCollection<I, T>
}

/** The items of an array of items or groups, flat and in order. */
function flattenItems(data: readonly unknown[]): unknown[] {
  return data.flatMap(entry => entry !== null && typeof entry === 'object' && Array.isArray((entry as ComboboxItemGroup).items) ? (entry as ComboboxItemGroup).items : [entry])
}

/** The `label` key of an object, as text. */
function getOwnLabel(value: unknown): string | undefined {
  const label = value !== null && typeof value === 'object' ? (value as { label?: unknown }).label : undefined
  return label == null ? undefined : String(label)
}

/**
 * Resolves the label `items` gives a value, or `undefined`. `byValue` also
 * finds a primitive value among `{ value, label }` items.
 * @internal
 */
export type ComboboxItemsIndex = (value: unknown, byValue?: boolean) => string | undefined

/**
 * Indexes `items` for label lookups. Plain data, no reactive writes: the
 * caller's `computed` rebuilds it when `items` changes.
 *
 * - A collection: the label of the item whose derived value is the value.
 * - An array: the `label` key of the item that `by` matches to the value.
 *
 * @internal
 */
export function createComboboxItemsIndex(items: ComboboxItems<any, any>, by: By<any> | undefined): ComboboxItemsIndex {
  if (!Array.isArray(items)) {
    const { data, getValue, getLabel } = items as unknown as ComboboxItemCollectionData<unknown, unknown>
    const labels = new Map<unknown, string>()
    // Not a collection (a record, say): nothing to resolve.
    if (Array.isArray(data)) {
      for (const item of flattenItems(data)) {
        const value = getValue(item)
        if (!labels.has(value))
          labels.set(value, getLabel(item))
      }
    }
    return value => labels.get(value)
  }
  const list = flattenItems(items)
  return (value, byValue) => {
    // Without `by` an item that matches the value is equal to it, label included:
    // the value's own `label` is the answer. A primitive value is its own text,
    // and only a `by` function can match it to an item.
    if (by && value !== null && (typeof value === 'object' || typeof by === 'function')) {
      const label = getOwnLabel(list.find(item => compare(item, value, by)))
      if (label !== undefined)
        return label
    }
    return byValue ? getOwnLabel(list.find(item => item !== null && typeof item === 'object' && (item as { value?: unknown }).value === value)) : undefined
  }
}

/**
 * What a root that reads `items` on demand keeps: the prop, `by`, and the
 * index, which is only created by the first lookup that finds `items` set.
 * @internal
 */
export interface ComboboxItemsSource {
  items?: MaybeRefOrGetter<ComboboxItems<any, any> | undefined>
  by?: By<any>
  /** @internal */
  itemsIndex?: ComputedRef<ComboboxItemsIndex | undefined>
}

/**
 * The text of a value from data: its label in `items`, else the `label` key of
 * an object value; `undefined` when neither has one. Reactive: a caller inside
 * an effect follows `items`. A root without `items` holds no index and no `computed`.
 * @internal
 */
export function getComboboxItemLabel(source: ComboboxItemsSource, value: unknown, byValue?: boolean): string | undefined {
  const label = source.items !== undefined && toValue(source.items) !== undefined
    ? (source.itemsIndex ??= computed(() => {
        const items = toValue(source.items)
        return items && createComboboxItemsIndex(items, source.by)
      })).value?.(value, byValue)
    : undefined
  return label ?? getOwnLabel(value)
}
