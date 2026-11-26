import type { Ref } from 'vue'
import { reactive, toRaw } from 'vue'

export const ITEM_DATA_ATTR = 'data-reka-collection-item'

const ITEM_SELECTOR = `[${ITEM_DATA_ATTR}]`
const DISABLED_ATTR = 'data-disabled'

function isEnabled(element: HTMLElement) {
  // Same test as `element.dataset.disabled !== ''`.
  return element.getAttribute(DISABLED_ATTR) !== ''
}

/** Whether one of the added / removed nodes is, or contains, a collection item. */
function hasItem(nodes: NodeList) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i] as Element
    if (node.nodeType === 1 && (node.hasAttribute(ITEM_DATA_ATTR) || node.querySelector(ITEM_SELECTOR)))
      return true
  }
  return false
}

function hasElement(nodes: NodeList) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].nodeType === 1)
      return true
  }
  return false
}

type ObserverConstructor = typeof MutationObserver

/** The last constructor checked, and whether it works. Checked once per constructor, not per collection. */
let checkedObserver: ObserverConstructor | undefined
let checkedObserverWorks = false

/**
 * Whether the environment's `MutationObserver` really reports mutations and can hand them over
 * synchronously. Test setups often replace the global with a stub that does neither (or that has
 * no `takeRecords`), and the cache would then never learn of a reorder. So the constructor is
 * tried once on a detached element: one child is added, and `takeRecords()` must return it.
 *
 * The answer is kept per constructor, so a global stubbed or restored later is checked again, and
 * every other call costs one comparison. Only called on the client, with an element in hand.
 */
function getWorkingObserver(root: HTMLElement): ObserverConstructor | undefined {
  const Observer = typeof MutationObserver === 'undefined' ? undefined : MutationObserver
  if (Observer !== checkedObserver) {
    checkedObserver = Observer
    checkedObserverWorks = false
    if (Observer) {
      try {
        const document = root.ownerDocument
        const probe = document.createElement('div')
        const observer = new Observer(() => {})
        observer.observe(probe, { childList: true })
        probe.appendChild(document.createElement('div'))
        const records = observer.takeRecords()
        observer.disconnect()
        checkedObserverWorks = records.length === 1 && records[0].addedNodes.length === 1
      }
      catch {
        checkedObserverWorks = false
      }
    }
  }
  return checkedObserverWorks ? Observer : undefined
}

export interface CollectionOrder<Item> {
  /** The registered items in DOM order (a new array on every call). */
  getItems: (includeDisabledItem?: boolean) => Item[]
  /** An item registered, unregistered or was replaced: drop the cached order. */
  invalidate: () => void
  /** The collection root changed or went away: drop the cache and stop observing the old root. */
  reset: () => void
}

/**
 * The ordered item list behind `getItems()`, shared by the VDOM and the Vapor `useCollection`.
 *
 * Building it costs a `querySelectorAll` over the collection root plus a pass over every registered
 * item, and keyboard navigation and typeahead ask for it on every key. So the result is kept until
 * something that can change it happens:
 * - an item registers, unregisters or is replaced (`invalidate`, called where `itemMap` is written),
 * - the root changes (`reset`, and checked on every read),
 * - an item element is inserted, removed or moved under the root (a `v-for` reorder, a `v-if`, a
 *   virtualized window), or a `data-disabled` attribute changes. A `MutationObserver` on the root
 *   reports those, and every read drains its pending records first, so a change is seen even before
 *   the observer callback has run.
 *
 * Without a `MutationObserver` that works (see `getWorkingObserver`) nothing is kept and every
 * call queries the DOM.
 */
export function createCollectionOrder<Item extends { ref: HTMLElement }>(
  itemMap: Ref<Map<HTMLElement, Item>>,
  collectionRef: Ref<HTMLElement | undefined>,
): CollectionOrder<Item> {
  /** Every registered item in DOM order, and its element; `null` when stale. */
  let all: Item[] | null = null
  let elements: HTMLElement[] = []
  /** The enabled items of `all`; `null` when stale. Only kept while `allInTree`. */
  let enabled: Item[] | null = null
  /** Whether every item element is under the root, where the observer sees its `data-disabled` change. */
  let allInTree = false
  let observer: MutationObserver | null = null
  /** The constructor `observer` was made with: a global replaced since then gets a new observer. */
  let observerType: ObserverConstructor | undefined
  let observed: HTMLElement | null = null

  function invalidate() {
    all = null
    enabled = null
    elements = []
  }

  function reset() {
    invalidate()
    if (observed) {
      try {
        observer!.disconnect()
      }
      catch {}
      observed = null
    }
  }

  function onMutations(records: MutationRecord[]) {
    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      if (record.type === 'attributes') {
        if (record.attributeName === DISABLED_ATTR) {
          enabled = null
          continue
        }
      }
      // A text node, or an added element without items (an item's indicator, say), leaves the order
      // as it is. A removed element always drops it: by the time the record is read an item may
      // have been moved out of the removed subtree, to a place this observer does not see.
      else if (!hasItem(record.addedNodes) && !hasElement(record.removedNodes)) {
        continue
      }
      invalidate()
      return
    }
  }

  function build(root: HTMLElement) {
    // Keys are the item elements. Read raw: the caller already tracks the map.
    const rawMap = toRaw(itemMap.value)
    const nodes = root.querySelectorAll<HTMLElement>(ITEM_SELECTOR)
    const inTree: HTMLElement[] = []
    for (let i = 0; i < nodes.length; i++) {
      // The root can hold items of other (nested) collections.
      if (rawMap.has(nodes[i]))
        inTree.push(nodes[i])
    }

    allInTree = inTree.length === rawMap.size
    if (allInTree) {
      elements = inTree
    }
    else {
      // Items rendered outside the root come first, in registration order.
      const found = new Set(inTree)
      elements = []
      for (const element of rawMap.keys()) {
        if (!found.has(element))
          elements.push(element)
      }
      for (let i = 0; i < inTree.length; i++)
        elements.push(inTree[i])
    }

    // Hand out the same reactive items that iterating the reactive map does.
    all = elements.map(element => reactive(rawMap.get(element)!) as Item)
    enabled = null
  }

  function filterEnabled() {
    const items: Item[] = []
    for (let i = 0; i < elements.length; i++) {
      if (isEnabled(elements[i]))
        items.push(all![i])
    }
    return items
  }

  function getItems(includeDisabledItem = false) {
    const root = collectionRef.value
    if (!root) {
      if (observed)
        reset()
      return []
    }
    // Tracks the map like iterating it does, so a computed that reads the items still re-runs
    // when one registers or unregisters.
    const size = itemMap.value.size

    const Observer = getWorkingObserver(root)
    if (!Observer) {
      // No observer, or one that does not report (a stub): nothing would tell a reorder, so
      // nothing is kept and every call queries the DOM.
      if (observed)
        reset()
      build(root)
      const items = includeDisabledItem ? all! : filterEnabled()
      invalidate()
      return items
    }

    if (observed !== root || observerType !== Observer) {
      reset()
      if (observerType !== Observer) {
        observer = new Observer(onMutations)
        observerType = Observer
      }
      observer!.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [ITEM_DATA_ATTR, DISABLED_ATTR],
      })
      observed = root
    }
    else {
      const pending = observer!.takeRecords()
      if (pending.length)
        onMutations(pending)
    }

    if (!all || all.length !== size)
      build(root)

    if (includeDisabledItem)
      return all!.slice()
    if (!allInTree)
      return filterEnabled()
    return (enabled ??= filterEnabled()).slice()
  }

  return { getItems, invalidate, reset }
}
