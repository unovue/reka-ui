import type { ShallowRef } from 'vue'
import { isClient } from '@vueuse/shared'
import { serialize } from 'ohash'
import { shallowRef } from 'vue'
import { KeyedSelectorImpl, lazySelector, SelectorHold } from '@/shared/createKeyedSelector'
import { valueComparator } from './utils'

const KEYED_OBJECTS = new Set(['[object Object]', '[object Array]', '[object Map]', '[object Set]'])

type By<T> = string | ((a: T, b: T) => boolean) | undefined

/**
 * The key `compare(modelValue, itemValue, by)` matches on: for a model value `a` and an item
 * value `b`, `compare(a, b, by)` holds exactly when both keys are strings and equal.
 *
 * - `null` for `undefined`, which `compare` never matches.
 * - Without `by`: a string by itself, anything else by its ohash form, which is what `isEqual`
 *   compares.
 * - With a key `by`: a string model value by itself (`compare` matches it with `===`), any other
 *   value by its `value?.[by]` when that is a primitive.
 * - `undefined` when no key is exact, and the caller compares instead: a function `by`, a string
 *   item under a key `by` (it would need two keys), a `value[by]` that is an object, a symbol or
 *   `NaN`, an object Vue does not track, such as a `Date`, a `URL` or a typed array, or a value ohash
 *   cannot serialize.
 *
 * @internal
 */
export function selectionKey(value: unknown, by: By<any>, isModelValue: boolean): string | null | undefined {
  if (value === undefined)
    return null
  if (typeof by === 'function')
    return undefined
  if (typeof by === 'string') {
    if (typeof value === 'string')
      return isModelValue ? `s:${value}` : undefined
    const key: unknown = (value as Record<string, unknown> | null)?.[by]
    switch (typeof key) {
      case 'undefined': return 'k:u'
      case 'string': return `k:s:${key}`
      case 'boolean': return `k:b:${key}`
      case 'bigint': return `k:i:${key}`
      case 'number': return Number.isNaN(key) ? undefined : `k:d:${key}`
      default: return key === null ? 'k:n' : undefined
    }
  }
  if (typeof value === 'string')
    return `s:${value}`
  // Vue only makes plain objects, arrays, maps and sets reactive. Any other object (a `Date`, a
  // `URL`, a typed array) can change in place unseen, and its key would go stale: compare instead.
  if (value !== null && typeof value === 'object' && !KEYED_OBJECTS.has(Object.prototype.toString.call(value)))
    return undefined
  try {
    return `h:${serialize(value)}`
  }
  catch {
    return undefined
  }
}

/**
 * `isSelected` for every item of a list, as a keyed selector: a selection change notifies only the
 * items that entered or left the selection, and a multiple selection is a `Set` lookup instead of
 * a `compare` of every item against every selected value.
 *
 * Exact against `valueComparator(model, value, by)`: a function `by`, an item whose value has no
 * exact key and a model holding such a value fall back to the comparison, tracking the whole
 * model as before.
 *
 * Construct it in `setup`. It is lazy: the first item that reads it starts its one sync watcher.
 *
 * @internal
 */
export class SelectionSelector<T> {
  selector: KeyedSelectorImpl<string> | undefined = undefined
  /** `false` while the model holds a value without an exact key. */
  keyed: ShallowRef<boolean> | undefined = undefined

  constructor(readonly model: () => T | T[] | undefined, readonly by?: By<T>) {
    // No selector on the server: its watcher starts while an item renders, outside `setup`, so
    // the server renderer would never stop it, and a model that outlives the request (app-level
    // state) would keep that render alive. A server render reads each item once; it compares.
    if (typeof by === 'function' || !isClient)
      return
    const selector = this.selector = new KeyedSelectorImpl<string>(true)
    lazySelector(selector, () => this.modelKeys(), (next) => {
      this.keyed!.value = next !== null
    })
    const start = selector.pending!
    selector.pending = () => {
      start()
      this.keyed = shallowRef(selector.current !== null)
    }
  }

  /** The model's keys, or `null` when one of its values has no exact key. */
  modelKeys(): Set<string> | null {
    const value = this.model()
    const keys = new Set<string>()
    for (const entry of Array.isArray(value) ? value : [value]) {
      const key = selectionKey(entry, this.by, true)
      if (key === undefined)
        return null
      if (key !== null)
        keys.add(key)
    }
    return keys
  }

  /** A reader's hold for `isSelected`; `release()` it when the reader unmounts. */
  createHold(): SelectorHold<string> | undefined {
    return this.selector && new SelectorHold<string>(this.selector)
  }

  /** Tracked: whether `value` is (part of) the selection, matched with `by`. */
  isSelected(value: T, hold?: SelectorHold<string>): boolean {
    const selector = this.selector
    if (!selector)
      return valueComparator(this.model(), value, this.by)
    selector.init()
    if (!this.keyed!.value) {
      hold?.release()
      return valueComparator(this.model(), value, this.by)
    }
    // Nothing is selected: no key is needed yet, and an object value's key is the costly part.
    if (hold?.key == null && !selector.active)
      return false
    const key = selectionKey(value, this.by, false)
    if (key === null) {
      hold?.release()
      return false
    }
    if (key === undefined) {
      hold?.release()
      return valueComparator(this.model(), value, this.by)
    }
    return hold ? hold.read(key) : selector.is(key)
  }
}
