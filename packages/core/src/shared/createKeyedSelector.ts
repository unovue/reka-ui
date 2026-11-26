import type { EffectScope, ShallowRef } from 'vue'
import { getCurrentScope, onScopeDispose, shallowRef, toRaw, watch } from 'vue'

/**
 * One boolean cell per held key. `holders` counts the readers that hold it, so
 * two items sharing a key (duplicate values) keep the cell until both let go.
 */
interface Cell {
  ref: ShallowRef<boolean>
  holders: number
}

/**
 * Per-key derived state ("is this item the highlighted / a selected one?")
 * that costs O(changed keys) per source change instead of O(items).
 *
 * The naive form, `computed(() => source.value === myKey)` in every item, marks
 * every item's computed dirty and queues every item's render job on each
 * change; each one then re-evaluates and bails out, except the two that
 * changed. A keyed selector watches the source once (sync) and flips only the
 * cells of the keys that entered or left it, so a highlight move re-renders
 * exactly the old and the new item. It is the Vue form of an argument
 * selector, such as Solid's `createSelector`.
 *
 * A reader `hold`s its key (the cell is created then) and `release`s it when it
 * changes key or unmounts; the cell is dropped with its last holder. Object
 * keys (elements) live in a `WeakMap`, so a missed release never retains them.
 * `is` on a key nobody holds still answers correctly; it tracks the whole
 * source instead of a cell.
 *
 * @internal
 */
export interface KeyedSelector<K> {
  /** Tracked: whether `key` is the current key (or one of the current keys). */
  is: (key: K | null | undefined) => boolean
  /** Starts a cell for `key` (reference counted). */
  hold: (key: K) => void
  /** Lets go of `key`; its cell is dropped with the last holder. */
  release: (key: K) => void
  /**
   * Tracked: whether the source holds any key. It only changes on the
   * empty ↔ non-empty transitions, so readers can gate on it cheaply.
   */
  readonly active: boolean
}

type SelectorSource<K> = () => K | null | undefined

type SetSelectorSource<K> = () => ReadonlySet<K> | null | undefined

const EMPTY: ReadonlySet<never> = new Set()

type Current<K> = K | ReadonlySet<K> | null | undefined

/** @internal */
export class KeyedSelectorImpl<K> implements KeyedSelector<K> {
  strong: Map<K, Cell> | undefined = undefined
  weak: WeakMap<K & object, Cell> | undefined = undefined
  /** The raw current key (single) or key set (multiple). */
  current: Current<K> = undefined
  /** Tracked by readers that hold no cell. */
  currentRef: ShallowRef<Current<K>> = undefined!
  activeRef: ShallowRef<boolean> = undefined!
  /** Watches the source on first use (see `createKeyedSelector`). */
  pending: (() => void) | undefined = undefined
  /** `true` while `update` runs, and the source a call made meanwhile asked for. */
  updating = false
  queued: { next: Current<K> } | undefined = undefined

  constructor(readonly multiple: boolean, initial?: Current<K>) {
    if (arguments.length > 1)
      this.start(initial)
  }

  start(initial: Current<K>) {
    this.current = initial
    this.currentRef = shallowRef(initial)
    this.activeRef = shallowRef(this.isActive(initial))
  }

  /** Starts a lazy selector: its first reader pays for the watcher and refs. */
  init() {
    const pending = this.pending
    if (pending) {
      this.pending = undefined
      pending()
    }
  }

  isActive(value: K | ReadonlySet<K> | null | undefined): boolean {
    return this.multiple ? !!value && (value as ReadonlySet<K>).size > 0 : value != null
  }

  matches(value: K | ReadonlySet<K> | null | undefined, key: K): boolean {
    if (value == null)
      return false
    return this.multiple ? (value as ReadonlySet<K>).has(key) : value === key
  }

  cell(key: K): Cell | undefined {
    return (typeof key === 'object' || typeof key === 'function')
      ? this.weak?.get(key as K & object)
      : this.strong?.get(key)
  }

  get active(): boolean {
    this.init()
    return this.activeRef.value
  }

  is(key: K | null | undefined): boolean {
    if (key == null)
      return false
    this.init()
    const cell = this.cell(key)
    if (cell)
      return cell.ref.value
    return this.matches(this.currentRef.value, key)
  }

  hold(key: K): void {
    this.init()
    const existing = this.cell(key)
    if (existing) {
      existing.holders++
      return
    }
    const cell: Cell = { ref: shallowRef(this.matches(this.current, key)), holders: 1 }
    if (typeof key === 'object' || typeof key === 'function')
      (this.weak ??= new WeakMap()).set(key as K & object, cell)
    else
      (this.strong ??= new Map()).set(key, cell)
  }

  release(key: K): void {
    const cell = this.cell(key)
    if (!cell || --cell.holders > 0)
      return
    if (typeof key === 'object' || typeof key === 'function')
      this.weak!.delete(key as K & object)
    else
      this.strong!.delete(key)
  }

  flip(key: K | null | undefined, value: boolean): void {
    if (key == null)
      return
    const cell = this.cell(key)
    if (cell)
      cell.ref.value = value
  }

  /**
   * Moves the cells and refs from the current source to `next`.
   *
   * A reader that runs synchronously on a flip may change the source again, which calls this
   * again before the first call is done. That call only records its source: the running one
   * applies it once its own flips are out, so cells and refs always end on the latest source,
   * never on the one an interrupted call started with.
   */
  update(next: K | ReadonlySet<K> | null | undefined): void {
    this.queued = { next }
    if (this.updating)
      return
    this.updating = true
    try {
      let queued
      // eslint-disable-next-line no-cond-assign
      while (queued = this.queued) {
        this.queued = undefined
        this.apply(queued.next)
      }
    }
    finally {
      this.updating = false
      this.queued = undefined
    }
  }

  apply(next: K | ReadonlySet<K> | null | undefined): void {
    const prev = this.current
    this.current = next
    if (this.multiple) {
      const prevSet = (prev ?? EMPTY) as ReadonlySet<K>
      const nextSet = (next ?? EMPTY) as ReadonlySet<K>
      for (const key of prevSet) {
        if (!nextSet.has(key))
          this.flip(key, false)
      }
      for (const key of nextSet) {
        if (!prevSet.has(key))
          this.flip(key, true)
      }
    }
    else if (prev !== next) {
      this.flip(prev as K | null | undefined, false)
      // The comparison a new cell starts with: `NaN` is never the current key.
      this.flip(next as K | null | undefined, this.matches(next, next as K))
    }
    this.currentRef.value = next
    this.activeRef.value = this.isActive(next)
  }
}

/**
 * A selector over a single key: `is(key)` is `source() === key`.
 *
 * Call it in `setup`. It is lazy: the first reader starts its one sync
 * watcher (in the calling scope, stopped with it), so a list that never
 * renders items (a closed popup) pays nothing for it.
 *
 * @internal
 */
export function createKeyedSelector<K>(source: SelectorSource<K>): KeyedSelector<K> {
  return lazySelector(new KeyedSelectorImpl<K>(false), source)
}

/** Defers `selector`'s watcher on `source` to its first use, in the current scope. */
export function lazySelector<K, S extends Current<K>>(selector: KeyedSelectorImpl<K>, source: () => S, onUpdate?: (next: S) => void): KeyedSelectorImpl<K> {
  const scope: EffectScope | undefined = getCurrentScope()
  selector.pending = () => {
    // `immediate` reads the source inside the watcher, so the reader that
    // started it (possibly inside a render) does not track the source.
    let started = false
    const run = () => watch(source, (next) => {
      if (!started) {
        started = true
        selector.start(next)
        return
      }
      selector.update(next)
      // The source the selector ended on: an update made during this one may have replaced `next`.
      onUpdate?.(selector.current as S)
    }, { flush: 'sync', immediate: true })
    if (scope)
      scope.run(run)
    else
      run()
  }
  return selector
}

/**
 * A selector over a set of keys: `is(key)` is `source().has(key)`. The source
 * may return a new `Set` on every change or change one in place; only the keys
 * that entered or left it flip.
 *
 * @internal
 */
export function createKeyedSetSelector<K>(source: SetSelectorSource<K>): KeyedSelector<K> {
  // A copy, so that a set changed in place still has its previous members to tell what entered or
  // left. Reading `size` is what makes the watcher follow such a change; the members are copied
  // from the raw set, as a reactive one would hand out proxies of its object keys.
  return lazySelector(new KeyedSelectorImpl<K>(true), () => {
    const keys = source()
    return keys && keys.size >= 0 ? new Set(toRaw(keys)) : keys
  })
}

/**
 * What one reader (an item) holds in a selector: its current key. `read`
 * moves the hold when the key changed (an item whose element or value
 * changed) and returns the tracked answer. Call `release` when the reader
 * goes away.
 *
 * @internal
 */
export class SelectorHold<K> {
  key: K | null | undefined = undefined
  constructor(readonly selector: KeyedSelector<K>) {}

  read(key: K | null | undefined): boolean {
    this.set(key)
    return this.selector.is(key)
  }

  set(key: K | null | undefined): void {
    const held = this.key
    if (key === held)
      return
    if (key != null)
      this.selector.hold(key)
    if (held != null)
      this.selector.release(held)
    this.key = key
  }

  release(): void {
    this.set(undefined)
  }
}

/**
 * A reader's tracked "is my key the selected one?", for a key that is not
 * known at setup (an item's element). Holds the key in `selector` and releases
 * it with the calling scope.
 *
 * Until the reader holds a key, it tracks only whether the source holds
 * anything (`active`), not its own key: the element refs set while a long
 * list mounts then notify no reader while nothing is selected.
 *
 * @internal
 */
export function useSelectorKey<K>(selector: KeyedSelector<K>, key: () => K | null | undefined): () => boolean {
  const hold = new SelectorHold(selector)
  if (getCurrentScope())
    onScopeDispose(() => hold.release())
  return () => {
    if (hold.key == null && !selector.active)
      return false
    return hold.read(key() ?? null)
  }
}
