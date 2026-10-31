import type { ComputedRef, ShallowRef } from 'vue'
import type { AcceptableValue } from '@/shared/types'
import { computed, nextTick, shallowRef } from 'vue'

/** An entry the closed trigger's typeahead can select. */
export interface SelectTypeaheadItem<T = AcceptableValue> {
  value: T
  textValue: string
  disabled?: boolean
}

export interface HarvestedItem<T> {
  entry: () => SelectTypeaheadItem<T>
  element: () => Element | undefined
  /** The element registered in `itemElements`. */
  known: Element | undefined
}

const WATCH_SUBTREE: MutationObserverInit = { characterData: true, childList: true, subtree: true }

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
 * - a named Select in a form fills its hidden native `select`, which must hold
 *   its options whenever the browser's autofill arrives: from the mount, or in
 *   idle time with `items`, whose options are there without the render.
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
  /** A key on the closed trigger wants the items, until it blurs. */
  private readonly typeaheadWants = shallowRef(false)
  /** Past the idle time a named Select with `items` waits for. */
  private readonly formIdlePassed = shallowRef(false)
  /** Cancels the pending idle callback of `renderFormWhenIdle`. */
  private cancelIdle: (() => void) | undefined = undefined
  /** Client-only, past the root's mount: the server and the hydration render no items. */
  private readonly active = shallowRef(false)
  /** Whether the lean items are mounted (in the closed content's fragment). */
  private harvestMounted = false
  /** Whether the closed content renders its lean items. */
  readonly render: ComputedRef<boolean>
  /** The open content's mounted items in document order; set by the root SFC (its collection). */
  liveItems: (() => SelectTypeaheadItem<T>[]) | undefined = undefined
  /** Whether a named Select in a form has a hidden native `select`; set by the root SFC. */
  needsForm: (() => boolean) | undefined = undefined
  /** The lean items, sorted into document order when read (see `version`). */
  private readonly harvested: HarvestedItem<T>[] = []
  /** The lean items' elements: what a mutation must touch to change the order. */
  private readonly itemElements = new WeakSet<Node>()
  /**
   * Bumped whenever the lean items are added, removed or moved, at any depth:
   * the native `select` options read it to follow the document order.
   */
  readonly version = shallowRef(0)
  /** Each lean item text's element and label sync, run when a mutation touches that text. */
  private readonly textSyncs = new Map<Node, () => void>()
  private observer: MutationObserver | undefined = undefined
  /** The lowest common ancestor of the lean items of each tree they are in, by the tree's root. */
  private readonly anchors = new Map<Node, Node>()
  /** The nodes the observer watches with their whole subtree. */
  private readonly watched = new Set<Node>()

  constructor(
    /** Whether the labels may come from the items at all (no `displayValue`). */
    private readonly needsItems: () => boolean,
    /** Whether the trigger needs the items' texts for the selection (a value `items` does not label). */
    needsSelectionLabels: () => boolean,
    /** Whether `items` lists the options: the native `select` has them without the render. */
    hasItemsData: () => boolean,
    /** The mounted `SelectVirtualizer`'s every-option typeahead source. */
    private readonly virtualItems: ShallowRef<(() => SelectTypeaheadItem<T>[]) | undefined> | undefined,
  ) {
    this.render = computed(() => this.active.value && needsItems() && (
      this.typeaheadWants.value
      || needsSelectionLabels()
      || (!!this.needsForm?.() && (!hasItemsData() || this.formIdlePassed.value))
    ))
  }

  /** The root mounted: the closed content may render its items from now on. */
  activate(): void {
    this.active.value = true
  }

  /** The root unmounts: drops a pending idle render. */
  dispose(): void {
    this.cancelIdle?.()
  }

  /**
   * With `items`, a named Select's rendered items only refine its native
   * options (a typed value, a `disabled`, an option `items` does not list): the
   * render of many items is one long task, kept off the mount. Repeated calls
   * share one callback.
   */
  renderFormWhenIdle(): void {
    if (this.formIdlePassed.value || this.cancelIdle)
      return
    const run = () => {
      this.cancelIdle = undefined
      this.formIdlePassed.value = true
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

  /** The trigger blurred: the typeahead no longer needs the items. */
  releaseTypeahead(): void {
    this.typeaheadWants.value = false
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
   * `element` places it in document order.
   */
  addHarvested(entry: () => SelectTypeaheadItem<T>, element: () => Element | undefined): HarvestedItem<T> {
    const known = element()
    const item: HarvestedItem<T> = { entry, element, known }
    this.harvested.push(item)
    if (known)
      this.itemElements.add(known)
    this.observe(known)
    this.bump()
    return item
  }

  /** A lean item updated: follows its new element, if any (a dynamic `as`). */
  updateHarvested(item: HarvestedItem<T>): void {
    const current = item.element()
    if (current === item.known)
      return
    if (item.known)
      this.itemElements.delete(item.known)
    if (current)
      this.itemElements.add(current)
    item.known = current
    this.observe(current)
    this.bump()
  }

  /** A lean item unmounts. */
  removeHarvested(item: HarvestedItem<T>): void {
    const index = this.harvested.indexOf(item)
    if (index !== -1)
      this.harvested.splice(index, 1)
    if (item.known)
      this.itemElements.delete(item.known)
    this.bump()
    this.disconnectWhenIdle()
  }

  /**
   * Whether a mutation touched a lean item or a node holding one. The cost
   * follows what changed, not the number of items.
   */
  private holdsItem(nodes: NodeList): boolean {
    return Array.from(nodes).some(node => node.nodeType === Node.ELEMENT_NODE && (
      this.itemElements.has(node)
      || Array.from((node as Element).querySelectorAll('*')).some(element => this.itemElements.has(element))
    ))
  }

  /**
   * A consumer's own nodes can change next to the lean items (a badge, a live
   * counter): only a record that adds, removes or moves a lean item changes
   * the order, and only the texts a record touches re-register.
   */
  private onMutations(records: MutationRecord[]): void {
    let moved = false
    const syncs = new Set<() => void>()
    for (const record of records) {
      moved ||= record.type === 'childList' && (this.holdsItem(record.addedNodes) || this.holdsItem(record.removedNodes))
      for (let node: Node | null = record.target; node; node = node.parentNode) {
        const sync = this.textSyncs.get(node)
        if (sync) {
          syncs.add(sync)
          break
        }
      }
    }
    if (moved)
      this.bump()
    syncs.forEach(run => run())
  }

  /**
   * Widens the one observer to a node: in each tree the lean items are in (the
   * detached fragment; a shadow root, the page or a KeepAlive's storage when
   * something moved them there), it watches their lowest common ancestor with
   * its whole subtree, so a text change or a move at any depth reaches it. It
   * never watches the whole page or shadow root: when that is the common
   * ancestor, it watches the node and its parent's direct children instead.
   */
  private observe(node: Node | undefined): void {
    const parent = node?.parentNode
    if (!node || !parent || typeof MutationObserver === 'undefined')
      return
    this.observer ??= new MutationObserver(records => this.onMutations(records))
    const tree = node.getRootNode()
    const known = this.anchors.get(tree)
    let anchor: Node = known?.getRootNode() === tree ? known : parent
    while (!anchor.contains(parent))
      anchor = anchor.parentNode!
    const doc = node.ownerDocument!
    const inPage = tree === doc || !!(tree as ShadowRoot).host
    if ((inPage && anchor === tree) || anchor === doc.documentElement || anchor === doc.body) {
      this.watch(node)
      if (!this.watched.has(parent))
        this.observer.observe(parent, { childList: true })
      return
    }
    this.anchors.set(tree, anchor)
    this.watch(anchor)
  }

  private watch(node: Node): void {
    if (!this.watched.has(node)) {
      this.watched.add(node)
      this.observer!.observe(node, WATCH_SUBTREE)
    }
  }

  /** Nothing lean is mounted any more: drop the observer (and what it watched). */
  private disconnectWhenIdle(): void {
    if (this.textSyncs.size || this.harvested.length || !this.observer)
      return
    this.observer.disconnect()
    this.observer = undefined
    this.anchors.clear()
    this.watched.clear()
  }

  /**
   * A lean item text mounts: `sync` re-registers its label, and runs when a
   * mutation touches this text (a translated text, a slot that re-renders on
   * its own). Returns its unregister.
   */
  observeText(element: Node, sync: () => void): () => void {
    this.textSyncs.set(element, sync)
    this.observe(element)
    return () => {
      this.textSyncs.delete(element)
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
    this.typeaheadWants.value = true
    // The items mount in this flush; `nextTick` resolves once it is done.
    nextTick(callback)
  }

  /** The lean items in document order (n - 1 comparisons when already sorted). */
  private getHarvested(): HarvestedItem<T>[] {
    return this.harvested.sort(byDocumentPosition)
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
