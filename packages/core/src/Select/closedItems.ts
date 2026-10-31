import type { ComputedRef, ShallowRef } from 'vue'
import type { AcceptableValue } from '@/shared/types'
import { computed, nextTick, shallowRef, triggerRef } from 'vue'

/** An entry the closed trigger's typeahead can select. */
export interface SelectTypeaheadItem<T = AcceptableValue> {
  value: T
  textValue: string
  disabled?: boolean
}

/**
 * Why the closed lean items are wanted besides the selection's label:
 * - `'typeahead'`: a key on the closed trigger, until it blurs;
 * - `'form'`: a named Select in a form fills its hidden native `select`.
 */
export type SelectClosedItemsReason = 'typeahead' | 'form'

interface HarvestedItem<T> {
  entry: () => SelectTypeaheadItem<T>
  element: () => Element | undefined
}

/** Document order of two mounted elements (they share the fragment, or the document). */
function byDocumentPosition<T>(a: HarvestedItem<T>, b: HarvestedItem<T>): number {
  const ea = a.element()
  const eb = b.element()
  if (!ea || !eb || ea === eb)
    return 0
  return ea.compareDocumentPosition(eb) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1
}

/**
 * The items of a closed Select (Base UI's "a closed Select renders no items",
 * without its "labels only through `items`").
 *
 * v2 kept every item of a closed Select mounted in full in a detached
 * fragment, so `SelectValue` could show the selected text. Here the closed
 * content renders its items into that fragment only while something needs
 * them, and then in a lean form (see `SelectContentHarvestContextValue`):
 * each item is its value, its `disabled`, and its text registered in the
 * sticky label registry, with no listeners, focus state or indicator. While
 * mounted they stay live, as in v2: a translated text, a replaced, refetched
 * or re-sorted list, or a `disabled` change reaches the trigger, the closed
 * typeahead and the hidden native `select`.
 *
 * The closed items are mounted while:
 * - a selected value has no label from `items` (the trigger shows its text);
 * - a printable key on the closed trigger needs them for the typeahead, until
 *   the trigger blurs (a focus alone renders nothing: tabbing through a form
 *   must not pay for a render it does not use);
 * - a named Select in a form fills its hidden native `select` (idle time
 *   after the mount).
 * Once none holds, they unmount; the labels stay in the registry.
 *
 * Nothing renders with `displayValue`, which resolves the text without the
 * items, nor on the server or during hydration.
 *
 * A class: one object per Select, its methods on the prototype.
 *
 * @internal
 */
export class SelectClosedItems<T = AcceptableValue> {
  /** The reasons the items are wanted, besides the selection's label. */
  private readonly reasons = shallowRef(new Set<SelectClosedItemsReason>())
  /** Cancels the pending idle callback of `requestFormWhenIdle`. */
  private cancelIdle: (() => void) | undefined = undefined
  /** Client-only, past the root's mount: the server and the hydration render no items. */
  private readonly active = shallowRef(false)
  /** Whether the lean items are mounted (in the closed content's fragment). */
  private harvestMounted = false
  /** Whether the closed content renders its lean items. */
  readonly render: ComputedRef<boolean>
  /** The open content's mounted items in document order; set by the root SFC (its collection). */
  liveItems: (() => SelectTypeaheadItem<T>[]) | undefined = undefined
  /** The lean items, sorted into document order when read (see `version`). */
  private readonly harvested: HarvestedItem<T>[] = []
  private sortedAt = -1
  /**
   * Bumped whenever the lean items are added, removed or moved: the native
   * `select` options read it to follow the document order.
   */
  readonly version = shallowRef(0)
  /** Each lean item text's label sync, run on any text mutation (one observer for all). */
  private readonly textSyncs = new Set<() => void>()
  private observer: MutationObserver | undefined = undefined
  private observedParents = new WeakSet<Node>()

  constructor(
    /** Whether the labels may come from the items at all (no `displayValue`). */
    private readonly needsItems: () => boolean,
    /** Whether the trigger needs the items' texts for the selection (a value `items` does not label). */
    needsSelectionLabels: () => boolean,
    /** The mounted `SelectVirtualizer`'s every-option typeahead source. */
    private readonly virtualItems: ShallowRef<(() => SelectTypeaheadItem<T>[]) | undefined> | undefined,
  ) {
    this.render = computed(() => this.active.value && needsItems() && (this.reasons.value.size > 0 || needsSelectionLabels()))
  }

  /** The root mounted: the closed content may render its items from now on. */
  activate(): void {
    this.active.value = true
  }

  /** The root unmounts: drops a pending idle render. */
  dispose(): void {
    this.cancelIdle?.()
  }

  /** Renders the closed items now, for `reason`. */
  private request(reason: SelectClosedItemsReason): void {
    if (this.reasons.value.has(reason) || !this.needsItems())
      return
    this.reasons.value.add(reason)
    triggerRef(this.reasons)
  }

  /**
   * Renders the closed items for the native `select`, in idle time: the render
   * of many items is one long task, kept off the mount. Repeated calls share
   * one callback.
   */
  requestFormWhenIdle(): void {
    if (this.reasons.value.has('form') || this.cancelIdle || !this.needsItems())
      return
    const run = () => {
      this.cancelIdle = undefined
      this.request('form')
    }
    const idle = typeof requestIdleCallback === 'function' && typeof cancelIdleCallback === 'function'
    const handle = idle ? requestIdleCallback(run, { timeout: 500 }) : setTimeout(run, 50)
    this.cancelIdle = () => {
      if (idle)
        cancelIdleCallback(handle as number)
      else
        clearTimeout(handle)
      this.cancelIdle = undefined
    }
  }

  /** `reason` no longer needs the items (the trigger blurred, the form is gone). */
  release(reason: SelectClosedItemsReason): void {
    if (reason === 'form')
      this.cancelIdle?.()
    if (this.reasons.value.delete(reason))
      triggerRef(this.reasons)
  }

  /** The lean items mounted or unmounted (`SelectProvider`). */
  setHarvestMounted(mounted: boolean): void {
    this.harvestMounted = mounted
  }

  private bump(): void {
    this.version.value++
  }

  /**
   * A lean item mounts: `entry` reads its value, text and `disabled`, and
   * `element` places it in document order. Its parent is watched for moves (a
   * re-sorted or prepended list). Returns its unregister.
   */
  addHarvested(entry: () => SelectTypeaheadItem<T>, element: () => Element | undefined): () => void {
    const item: HarvestedItem<T> = { entry, element }
    this.harvested.push(item)
    const parent = element()?.parentNode
    if (parent && !this.observedParents.has(parent)) {
      this.observedParents.add(parent)
      this.getObserver()?.observe(parent, { childList: true })
    }
    this.bump()
    return () => {
      const index = this.harvested.indexOf(item)
      if (index !== -1)
        this.harvested.splice(index, 1)
      this.bump()
      this.disconnectWhenIdle()
    }
  }

  /** Nothing lean is mounted any more: drop the observer (and what it watched). */
  private disconnectWhenIdle(): void {
    if (this.textSyncs.size || this.harvested.length || !this.observer)
      return
    this.observer.disconnect()
    this.observer = undefined
    this.observedParents = new WeakSet()
  }

  private getObserver(): MutationObserver | undefined {
    if (typeof MutationObserver === 'undefined')
      return undefined
    return this.observer ??= new MutationObserver((records) => {
      if (records.some(record => record.type === 'childList'))
        this.bump()
      this.textSyncs.forEach(run => run())
    })
  }

  /**
   * A lean item text mounts: `sync` re-registers its label, and runs whenever
   * any lean text changes (a translated text, a slot that re-renders on its
   * own). One observer watches every lean text. Returns its unregister.
   */
  observeText(element: Node, sync: () => void): () => void {
    this.textSyncs.add(sync)
    this.getObserver()?.observe(element, { characterData: true, childList: true, subtree: true })
    return () => {
      this.textSyncs.delete(sync)
      this.disconnectWhenIdle()
    }
  }

  /** Whether any items are mounted (the open content's, or the lean ones). */
  hasRendered(): boolean {
    return this.harvestMounted || !!this.liveItems?.().length
  }

  /** Whether the closed items can be rendered at all (client, past the mount, no `displayValue`). */
  canRender(): boolean {
    return this.active.value && this.needsItems()
  }

  /** Renders the closed items now (for the typeahead), then calls `callback`. */
  renderThen(callback: () => void): void {
    this.request('typeahead')
    // The items mount in this flush; `nextTick` resolves once it is done.
    nextTick(callback)
  }

  /** The lean items in document order. */
  private getHarvested(): HarvestedItem<T>[] {
    if (this.sortedAt !== this.version.value) {
      this.harvested.sort(byDocumentPosition)
      this.sortedAt = this.version.value
    }
    return this.harvested
  }

  /** The mounted items (the open content's, else the lean ones), in document order; `undefined` when none are. */
  getTypeaheadItems(): SelectTypeaheadItem<T>[] | undefined {
    const virtual = this.virtualItems?.value
    if (virtual)
      return virtual()
    const live = this.liveItems?.()
    if (live?.length)
      return live
    if (this.harvestMounted)
      return this.getHarvested().map(item => item.entry())
    return undefined
  }

  /**
   * The mounted lean items' values in document order, tracked through
   * `version` (for the native `select`); empty while none are mounted.
   */
  getOrderedValues(): T[] {
    void this.version.value
    return this.getHarvested().map(item => item.entry().value)
  }
}
