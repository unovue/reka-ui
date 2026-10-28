import type { ComputedRef, ShallowRef } from 'vue'
import type { AcceptableValue } from '@/shared/types'
import { computed, nextTick, shallowRef } from 'vue'

/** An entry the closed trigger's typeahead can select. */
export interface SelectTypeaheadItem<T = AcceptableValue> {
  value: T
  textValue: string
  disabled?: boolean
}

/** Nothing asked for the items yet. */
const IDLE = 0
/** Something needs the items: the closed content renders them once. */
const REQUESTED = 1
/** The items rendered once (closed or open); their labels are registered. */
const DONE = 2

/**
 * What a closed Select keeps of its items (Base UI's "a closed Select renders
 * no items").
 *
 * A closed `SelectContent` renders its items into a detached fragment only
 * while something needs them, so the item texts register in the sticky label
 * registry; once they did, the items unmount again. The items render when:
 * - a selected value has no label yet (the trigger must show it): right away,
 *   and again whenever the model gets a value the registry has not seen (a
 *   programmatic change, options that arrive after the mount);
 * - the closed trigger's typeahead needs them, on the first key typed;
 * - the hidden native `select` needs its options (the browser's autofill), in
 *   idle time after the mount.
 *
 * Nothing renders with `displayValue` or `items`, which resolve the labels
 * without the items.
 *
 * The closed trigger's typeahead reads the items that are mounted, else the
 * ones seen the last time they were (on the harvest, or when the content last
 * closed), in document order, with `textValue` and `disabled`. A change to the
 * items while closed (added, removed, new text) is seen on the next open.
 *
 * A class: one object per Select, its methods on the prototype.
 *
 * @internal
 */
export class SelectClosedItems<T = AcceptableValue> {
  private readonly state = shallowRef(IDLE)
  /** Client-only, past the root's mount: the server and the hydration render no items. */
  private readonly active = shallowRef(false)
  private snapshot: SelectTypeaheadItem<T>[] | undefined = undefined
  /** Whether the closed content renders its items. */
  readonly render: ComputedRef<boolean>
  /** The mounted items in document order; set by the root SFC (its collection). */
  liveItems: (() => SelectTypeaheadItem<T>[]) | undefined = undefined
  /**
   * The closed content's detached items, in render order: they skip the
   * collection (no element bookkeeping, no sort) and register here instead.
   */
  private readonly harvested: (() => SelectTypeaheadItem<T>)[] = []

  constructor(
    /** Whether the labels need the items at all (no `displayValue`, no `items`). */
    private readonly needsItems: () => boolean,
    /** Whether a selected value has no registered label. */
    hasUnlabelledSelection: () => boolean,
    /** The mounted `SelectVirtualizer`'s every-option typeahead source. */
    private readonly virtualItems: ShallowRef<(() => SelectTypeaheadItem<T>[]) | undefined> | undefined,
  ) {
    this.render = computed(() => this.active.value && needsItems() && (this.state.value === REQUESTED || hasUnlabelledSelection()))
  }

  /** The root mounted: the closed content may render its items from now on. */
  activate(): void {
    this.active.value = true
  }

  /** Asks the closed content to render its items once. */
  request(): void {
    if (this.state.value === IDLE && this.needsItems())
      this.state.value = REQUESTED
  }

  /** The items mounted (closed or open): their labels are registered. */
  itemsMounted(): void {
    this.state.value = DONE
  }

  /** A detached item mounts; returns its unregister. */
  addHarvested(entry: () => SelectTypeaheadItem<T>): () => void {
    this.harvested.push(entry)
    return () => {
      const index = this.harvested.indexOf(entry)
      if (index !== -1)
        this.harvested.splice(index, 1)
    }
  }

  /** Remembers the mounted items for the closed typeahead; call before they unmount. */
  capture(): void {
    const items = this.virtualItems?.value?.() ?? this.getMountedItems()
    if (items)
      this.snapshot = items
  }

  private getMountedItems(): SelectTypeaheadItem<T>[] | undefined {
    const live = this.liveItems?.()
    if (live?.length)
      return live
    if (this.harvested.length)
      return this.harvested.map(entry => entry())
    return live
  }

  /** Whether the closed typeahead has the items to match (or never will). */
  ready(): boolean {
    return !this.needsItems() || this.state.value === DONE || !!this.harvested.length || !!this.liveItems?.().length
  }

  /**
   * Makes the items ready for the closed typeahead: renders them if they never
   * did, then calls `callback` (right away when they are ready).
   */
  whenReady(callback: () => void): void {
    if (this.ready()) {
      callback()
      return
    }
    this.request()
    // The items mount in this flush; `nextTick` resolves once it is done.
    nextTick(callback)
  }

  /** The mounted items, else the last ones seen; `undefined` before any. */
  getTypeaheadItems(): SelectTypeaheadItem<T>[] | undefined {
    const mounted = this.getMountedItems()
    return mounted?.length ? mounted : this.snapshot
  }
}
