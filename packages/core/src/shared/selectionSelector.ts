import type { ShallowRef } from 'vue'
import type { By } from './compare'
import { isClient } from '@vueuse/shared'
import { isReactive, shallowRef } from 'vue'
import { serializeValue, valueComparator } from './compare'
import { KeyedSelectorImpl, lazySelector, SelectorHold } from './createKeyedSelector'

const KEYED_OBJECTS = new Set(['[object Object]', '[object Array]', '[object Map]', '[object Set]'])

/**
 * Whether Vue reports every change inside `value`: no object in it is of a
 * kind Vue leaves alone. With `reactive`, every object in it must also be a
 * reactive proxy: a raw object (`markRaw`, or one held by a `shallowRef`)
 * changes in place unseen.
 */
function isTracked(value: unknown, seen: Set<object>, reactive: boolean): boolean {
  if (value === null || typeof value !== 'object' || seen.has(value))
    return true
  const tag = Object.prototype.toString.call(value)
  if (!KEYED_OBJECTS.has(tag) || (reactive && !isReactive(value)))
    return false
  seen.add(value)
  if (tag === '[object Map]') {
    for (const [key, entry] of value as Map<unknown, unknown>) {
      if (!isTracked(key, seen, reactive) || !isTracked(entry, seen, reactive))
        return false
    }
    return true
  }
  const entries = tag === '[object Object]' ? Object.values(value) : value as Iterable<unknown>
  for (const entry of entries) {
    if (!isTracked(entry, seen, reactive))
      return false
  }
  return true
}

/**
 * The key `compare(a, b, by)` matches on: `compare(a, b, by)` holds exactly
 * when both keys are strings and equal.
 * - `null` for `undefined`, which `compare` never matches;
 * - a string for every value `compare` resolves without a custom function:
 *   strings by `===`, an object under a key `by` by its primitive `value[by]`,
 *   anything else (no `by`) by its `serializeValue` form, which is what `isEqual`
 *   compares;
 * - `undefined` when no key is exact (a function `by`, a missing,
 *   non-primitive or `NaN` `value[by]`, a non-object under a key `by`), or
 *   when the key could go stale: a value that is or holds an object Vue does
 *   not track (a `Date`, a `URL`, a typed array, a DOM node), a model object
 *   that is not a reactive proxy (`markRaw`, or held by a `shallowRef`), or a
 *   value that throws when read: compare instead.
 *
 * `isModelValue`: the value is (part of) the model, whose key is kept until Vue
 * reports a change, so its objects must be ones Vue tracks.
 *
 * @internal
 */
export function compareKey<T>(value: T, by?: By<T>, isModelValue = false): string | null | undefined {
  if (value === undefined)
    return null
  if (typeof by === 'function')
    return undefined
  if (value === null)
    return 'n:'
  if (typeof value === 'string')
    return `s:${value}`
  if (typeof by === 'string') {
    if (typeof value !== 'object')
      return undefined
    if (isModelValue && !isReactive(value))
      return undefined
    let key: unknown
    try {
      key = (value as Record<string, unknown>)[by]
    }
    catch {
      return undefined
    }
    const type = typeof key
    if (type === 'string' || type === 'bigint' || type === 'boolean' || (type === 'number' && !Number.isNaN(key)))
      return `k:${type}:${String(key)}`
    return undefined
  }
  // Vue only makes plain objects, arrays, maps and sets reactive. Any other
  // object can change in place unseen, and so can one nested in the value: its
  // key would go stale.
  try {
    if (!isTracked(value, new Set(), isModelValue))
      return undefined
    return `h:${serializeValue(value)}`
  }
  catch {
    return undefined
  }
}

/**
 * `isSelected` for every item of a list, as a keyed selector: a selection
 * change flips only the items that entered or left the selection, and a
 * multiple selection is a `Set` lookup instead of an O(m) `compare` scan per
 * item.
 *
 * Exact against `valueComparator(model, value, by)`: an item whose value has
 * no exact key, a function `by`, or a model holding such a value fall back to
 * the comparison (tracking the whole model, as before).
 *
 * Construct it in `setup`. Like `createKeyedSelector` it is lazy: the first
 * item that reads it starts its one sync watcher.
 *
 * @internal
 */
export class SelectionSelector<T> {
  selector: KeyedSelectorImpl<string> | undefined = undefined
  /** `false` while the model holds a value without an exact key. */
  keyed: ShallowRef<boolean> | undefined = undefined

  constructor(readonly model: () => T | T[] | undefined, readonly by?: By<T>) {
    // No selector on the server: its watcher starts while an item renders,
    // outside `setup`, so the server renderer would never stop it, and a model
    // that outlives the request would keep that render alive. A server render
    // reads each item once; it compares.
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
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (!this.addKey(keys, entry))
          return null
      }
    }
    else if (!this.addKey(keys, value as T)) {
      return null
    }
    return keys
  }

  addKey(keys: Set<string>, value: T): boolean {
    const key = compareKey(value, this.by, true)
    if (key === undefined)
      return false
    if (key !== null)
      keys.add(key)
    return true
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
    const key = compareKey(value, this.by)
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
