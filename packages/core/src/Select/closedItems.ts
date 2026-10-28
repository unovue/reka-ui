import type { ComputedRef, ShallowRef } from 'vue'
import type { AcceptableValue } from '@/shared/types'
import { computed, nextTick, shallowRef } from 'vue'

/** An entry the closed trigger's typeahead can select. */
export interface SelectTypeaheadItem<T = AcceptableValue> {
  value: T
  textValue: string
  disabled?: boolean
}

/**
 * The items of a closed Select (Base UI's "a closed Select renders no items",
 * without its "labels only through `items`").
 *
 * v2 kept every item of a closed Select mounted in full in a detached
 * fragment, so `SelectValue` could show the selected text. Here the closed
 * content renders its items into that fragment only once something needs
 * them, and then in a lean form (see `SelectContentHarvestContextValue`):
 * each item is its value, its `disabled`, and its text registered in the
 * sticky label registry, with no listeners, selection or focus state, and no
 * indicator. Once rendered they stay mounted while closed and stay live, as in
 * v2: a translated text, a replaced or refetched list, or a `disabled` change
 * reaches the trigger, the closed typeahead and the hidden native `select`.
 *
 * The closed items render when:
 * - the Select has a selected value (the trigger shows its text) and no
 *   `items` or `displayValue` resolves it;
 * - the closed trigger's typeahead needs them, from the first focus (or key);
 * - the hidden native `select` of a named Select in a form needs its options,
 *   in idle time after the mount.
 *
 * Nothing renders with `displayValue`, which resolves the text without the
 * items, nor on the server or during hydration.
 *
 * A class: one object per Select, its methods on the prototype.
 *
 * @internal
 */
export class SelectClosedItems<T = AcceptableValue> {
  /** Something asked for the items (typeahead, native options); sticky. */
  private readonly requested = shallowRef(false)
  /** Client-only, past the root's mount: the server and the hydration render no items. */
  private readonly active = shallowRef(false)
  /** Whether the lean items are mounted (in the closed content's fragment). */
  private harvestMounted = false
  /** Whether the closed content renders its lean items. */
  readonly render: ComputedRef<boolean>
  /** The open content's mounted items in document order; set by the root SFC (its collection). */
  liveItems: (() => SelectTypeaheadItem<T>[]) | undefined = undefined
  /**
   * The lean items, in render order: they skip the collection (no element
   * bookkeeping, no sort) and register here instead.
   */
  private readonly harvested: (() => SelectTypeaheadItem<T>)[] = []
  /** Each lean item text's label sync, run on any text mutation (one observer for all). */
  private readonly textSyncs = new Set<() => void>()
  private observer: MutationObserver | undefined = undefined

  constructor(
    /** Whether the labels may come from the items at all (no `displayValue`). */
    private readonly needsItems: () => boolean,
    /** Whether the trigger needs the items' texts for the selection (a value, no `items`). */
    needsSelectionLabels: () => boolean,
    /** Whether `items` lists the options: the typeahead needs not wait for the rendered ones. */
    private readonly hasItemsData: () => boolean,
    /** The mounted `SelectVirtualizer`'s every-option typeahead source. */
    private readonly virtualItems: ShallowRef<(() => SelectTypeaheadItem<T>[]) | undefined> | undefined,
  ) {
    this.render = computed(() => this.active.value && needsItems() && (this.requested.value || needsSelectionLabels()))
  }

  /** The root mounted: the closed content may render its items from now on. */
  activate(): void {
    this.active.value = true
  }

  /** Asks the closed content to render its items, from now on. */
  request(): void {
    if (!this.requested.value && this.needsItems())
      this.requested.value = true
  }

  /**
   * `request`, but in idle time: with `items`, the typeahead already has the
   * options, and the rendered ones only add those `items` does not list.
   */
  requestWhenIdle(): void {
    if (this.requested.value)
      return
    if (typeof requestIdleCallback === 'function')
      requestIdleCallback(() => this.request(), { timeout: 500 })
    else
      setTimeout(() => this.request(), 50)
  }

  /** The lean items mounted or unmounted (`SelectProvider`). */
  setHarvestMounted(mounted: boolean): void {
    this.harvestMounted = mounted
  }

  /** A lean item mounts; returns its unregister. */
  addHarvested(entry: () => SelectTypeaheadItem<T>): () => void {
    this.harvested.push(entry)
    return () => {
      const index = this.harvested.indexOf(entry)
      if (index !== -1)
        this.harvested.splice(index, 1)
    }
  }

  /**
   * A lean item text mounts: `sync` re-registers its label, and runs whenever
   * any lean text changes (a translated text, a slot that re-renders on its
   * own). One observer watches every lean text. Returns its unregister.
   */
  observeText(element: Node, sync: () => void): () => void {
    this.textSyncs.add(sync)
    if (typeof MutationObserver !== 'undefined') {
      this.observer ??= new MutationObserver(() => this.textSyncs.forEach(run => run()))
      this.observer.observe(element, { characterData: true, childList: true, subtree: true })
    }
    return () => {
      this.textSyncs.delete(sync)
      if (!this.textSyncs.size) {
        this.observer?.disconnect()
        this.observer = undefined
      }
    }
  }

  /** Whether the closed typeahead has the items to match (or never will). */
  ready(): boolean {
    // Inactive (the server, a headless `useSelectRoot` without the SFC), no items can render.
    return !this.active.value || !this.needsItems() || this.hasItemsData() || this.harvestMounted || !!this.liveItems?.().length
  }

  /**
   * Makes the items ready for the closed typeahead: renders them if they are
   * not, then calls `callback` (right away when they are ready).
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

  /** The mounted items (the open content's, else the lean ones); `undefined` when none are. */
  getTypeaheadItems(): SelectTypeaheadItem<T>[] | undefined {
    const virtual = this.virtualItems?.value
    if (virtual)
      return virtual()
    const live = this.liveItems?.()
    if (live?.length)
      return live
    if (this.harvestMounted)
      return this.harvested.map(entry => entry())
    return undefined
  }
}
