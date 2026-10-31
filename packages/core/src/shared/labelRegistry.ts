import type { By } from './compare'
import { serialize } from 'ohash'
import { shallowRef, triggerRef } from 'vue'
import { compare } from './compare'

/**
 * The sticky label registry (#2824): items register the text they render so a
 * value can be displayed after its item unmounted (filtered out, virtualized
 * away, closed content). Entries are matched with `by`, the last write for a
 * value wins, and nothing is ever removed automatically. Shared by Listbox,
 * Combobox and Select.
 */
export interface LabelRegistry<T> {
  register: (value: T, label: string, disabled?: boolean) => void
  get: (value: T) => string | undefined
  /** The entry of `value`, by the same lookup as `get`. */
  entry: (value: T) => { value: T, label: string, disabled: boolean } | undefined
  entries: () => Array<{ value: T, label: string, disabled: boolean }>
}

/**
 * Creates a sticky label registry matched with `by`.
 *
 * Every identity that `compare` resolves without a custom function is indexed
 * in a Map, so a registration is O(1) rather than a scan:
 * - a primitive value (or a primitive `value[by]` under a key `by`) by its
 *   tagged string form;
 * - an object value with no `by` by its ohash `serialize` form, which is
 *   exactly what the default `isEqual` comparison compares (no digest: the
 *   crypto code would only grow every listbox bundle). The trade-off is
 *   memory: the key is the whole serialized object, so a large object value
 *   keeps a string about the size of its JSON in the index for the life of
 *   the registry. Pass `by` (a key) for large or deeply nested objects; the key
 *   is then the primitive `value[by]`.
 *
 * Only a function `by` (no stable key exists) and the rare leftovers (an
 * `undefined` value, a non-primitive `value[by]`) fall back to a `compare`
 * scan. The entries array is mutated in place and the ref triggered, so a
 * registration never copies the whole registry.
 *
 * @internal
 * @lifecycle pure
 */
export function createLabelRegistry<T>(by?: By<T>): LabelRegistry<T> {
  // Writes go to the raw array and only trigger the ref, so a registration
  // never tracks the registry: an item registering from an effect would
  // otherwise re-run on every other item's registration.
  const list: Array<{ value: T, label: string, disabled: boolean }> = []
  const labelEntries = shallowRef(list)
  const labelIndex = new Map<string, number>()

  function labelKey(value: T): string | undefined {
    if (typeof by === 'function')
      return undefined
    const keyed = typeof by === 'string' && value !== null && typeof value === 'object'
    const key: unknown = keyed ? (value as Record<string, unknown>)[by as string] : value
    const type = typeof key
    if (type === 'string' || type === 'number' || type === 'bigint' || type === 'boolean')
      // Tagged so a plain `'1'`, a `1` and a `{ id: 1 }` under `by: 'id'` never collide.
      return `${keyed ? 'k' : 'v'}:${type}:${String(key)}`
    if (by === undefined && type === 'object')
      return `h:${serialize(key)}`
    return undefined
  }

  function labelIndexOf(value: T, key = labelKey(value)) {
    if (key !== undefined)
      return labelIndex.get(key) ?? -1
    return list.findIndex(i => compare(i.value, value, by))
  }

  return {
    register: (value, label, disabled = false) => {
      const key = labelKey(value)
      const index = labelIndexOf(value, key)
      const current = list[index]
      // Items re-register on every render; only an actual change is written.
      if (current && current.label === label && current.disabled === disabled)
        return
      const entry = { value, label, disabled }
      if (index === -1) {
        if (key !== undefined)
          labelIndex.set(key, list.length)
        list.push(entry)
      }
      else {
        list[index] = entry
      }
      triggerRef(labelEntries)
    },
    get: (value) => {
      // Read the entries first so a lookup that misses still tracks them: the
      // index Map is not reactive, and a later registration must re-run it.
      const entries = labelEntries.value
      const index = labelIndexOf(value)
      return index === -1 ? undefined : entries[index].label
    },
    entry: (value) => {
      const entries = labelEntries.value
      return entries[labelIndexOf(value)]
    },
    entries: () => [...labelEntries.value],
  }
}
