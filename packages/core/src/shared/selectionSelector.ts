import type { ShallowRef } from 'vue'
import type { By } from './compare'
import { serialize } from 'ohash'
import { shallowRef, watch } from 'vue'
import { valueComparator } from './compare'
import { KeyedSelectorImpl, SelectorHold } from './createKeyedSelector'

/**
 * The key `compare(a, b, by)` matches on: `compare(a, b, by)` holds exactly
 * when both keys are strings and equal.
 * - `null` for `undefined`, which `compare` never matches;
 * - a string for every value `compare` resolves without a custom function:
 *   strings by `===`, an object under a key `by` by its primitive `value[by]`,
 *   anything else (no `by`) by its `serialize` form, which is what `isEqual`
 *   compares;
 * - `undefined` when no key is exact (a function `by`, a missing,
 *   non-primitive or `NaN` `value[by]`, a non-object under a key `by`):
 *   compare instead.
 *
 * @internal
 */
export function compareKey<T>(value: T, by?: By<T>): string | null | undefined {
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
    const key: unknown = (value as Record<string, unknown>)[by]
    const type = typeof key
    if (type === 'string' || type === 'bigint' || type === 'boolean' || (type === 'number' && !Number.isNaN(key)))
      return `k:${type}:${String(key)}`
    return undefined
  }
  return `h:${serialize(value)}`
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
 * Construct it in `setup` (it owns one sync watcher).
 *
 * @internal
 */
export class SelectionSelector<T> {
  selector: KeyedSelectorImpl<string> | undefined = undefined
  /** `false` while the model holds a value without an exact key. */
  keyed: ShallowRef<boolean> | undefined = undefined

  constructor(readonly model: () => T | T[] | undefined, readonly by?: By<T>) {
    if (typeof by === 'function')
      return
    const source = () => this.modelKeys()
    const initial = source()
    const selector = this.selector = new KeyedSelectorImpl<string>(true, initial)
    const keyed = this.keyed = shallowRef(initial !== null)
    watch(source, (next) => {
      selector.update(next)
      keyed.value = next !== null
    }, { flush: 'sync' })
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
    const key = compareKey(value, this.by)
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
    const key = this.selector ? compareKey(value, this.by) : undefined
    if (key === null) {
      hold?.release()
      return false
    }
    if (key === undefined || !this.keyed!.value) {
      hold?.release()
      return valueComparator(this.model(), value, this.by)
    }
    return hold ? hold.read(key) : this.selector!.is(key)
  }
}
