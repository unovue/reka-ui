import type { Component, ComponentInternalInstance, ComputedRef, Ref } from 'vue'
import { defineComponent, getCurrentInstance, h, onScopeDispose, provide, shallowRef } from 'vue'
import { Slot } from '@/Primitive/Slot'
import { getterRef } from '@/shared/partSurface'
import { useForwardElement } from '@/shared/useForwardElement'

const ITEM_DATA_ATTR = 'data-reka-collection-item'

/**
 * The attribute every collection item renders, which `getItems()` orders by.
 * An item registered with `useCollectionItem` binds it on its own element.
 */
export const COLLECTION_ITEM_ATTRS: Readonly<Record<typeof ITEM_DATA_ATTR, ''>> = Object.freeze({ [ITEM_DATA_ATTR]: '' })

/** Anything holding an element in `.value`: a ref, a computed, `useForwardElement().currentElement`. */
export interface ElementSourceLike {
  readonly value: Element | null | undefined
}

/** One collection item, as `getItems()` / `getItem()` return it. */
export type CollectionEntry<ItemData = {}> = { ref: HTMLElement, value?: any } & ItemData

/** `getCollectionMeta`'s store: only items registered with a `meta` have one. */
const metaByEntry = new WeakMap<object, unknown>()

/**
 * A registered item. `ref` is the element it resolved to when the order was
 * last built. `entry` is the plain `{ ref, value }` object the collection
 * hands out (events emit it); its `value` reads the item's current value, so
 * a changed value never needs a re-registration and handing the entry out
 * costs nothing per item.
 */
class CollectionRecord {
  ref: HTMLElement = null!
  readonly entry: CollectionEntry
  constructor(
    readonly element: ElementSourceLike,
    source: (() => unknown) | undefined,
  ) {
    this.entry = {
      ref: null!,
      get value() {
        return source?.()
      },
    }
  }

  /** The entry, with its current element. */
  read(): CollectionEntry {
    this.entry.ref = this.ref
    return this.entry
  }
}

/**
 * The item registry of one collection provider, built like Base UI's
 * `CompositeList`: a plain set of records, no reactive Map and no effect per
 * item.
 *
 * Items register in `setup` and resolve their element lazily. The DOM order is
 * built on demand (one `querySelectorAll` over the root) and cached; it is
 * invalidated by a registration, an unregistration, or a child-list change
 * under the root (a `v-for` reorder, a `v-if`), which a `MutationObserver`
 * reports. Reading the order drains the observer's pending records
 * synchronously, so a reorder is seen even before its callback ran, and checks
 * each item's element, so a swapped item element is seen too.
 */
class CollectionContextImpl {
  records = new Set<CollectionRecord>()
  /** The root element source, set by `CollectionSlot` / `useCollectionSlot`. */
  root: ElementSourceLike | undefined = undefined
  /** Items in DOM order (elements resolved), or `null` when stale. */
  ordered: CollectionRecord[] | null = null
  /**
   * The `getItems()` / `getItems(true)` results for `ordered`, handed out as
   * copies: a keyboard move reads the items without touching each element.
   * Kept only while every item is under the root (so the observer sees its
   * element and `data-disabled` changes).
   */
  enabledItems: CollectionEntry[] | null = null
  allItems: CollectionEntry[] | null = null
  cacheable = false
  byElement = new Map<Element, CollectionRecord>()
  observer: MutationObserver | null = null
  observed: Element | null = null
  /** Bumped on every (un)registration; readers of the items track it. */
  version = shallowRef(0)
  reactiveItems: ComputedRef<CollectionEntry[]> | undefined = undefined
  itemMapSize: ComputedRef<number> | undefined = undefined

  readonly getItems = (includeDisabledItem = false): CollectionEntry[] => {
    // Tracked, so a computed reading the items re-runs when they change.
    void this.version.value
    let ordered = this.validate()
    if (!ordered)
      return []
    const cached = includeDisabledItem ? this.allItems : this.enabledItems
    if (cached)
      return cached.slice()
    // Catches an item whose element was swapped without a child-list change
    // under the root (an item rendered outside it).
    for (let i = 0; i < ordered.length; i++) {
      if (ordered[i].element.value !== ordered[i].ref) {
        ordered = this.rebuild(this.observed!)
        break
      }
    }
    const items = filterEnabled(ordered, includeDisabledItem)
    if (this.cacheable) {
      if (includeDisabledItem)
        this.allItems = items
      else
        this.enabledItems = items
      return items.slice()
    }
    return items
  }

  readonly getItem = (element: HTMLElement, includeDisabledItem = false): CollectionEntry | undefined => {
    void this.version.value
    if (!this.validate())
      return undefined
    const item = this.byElement.get(element)
    return item && (includeDisabledItem || item.ref.dataset.disabled !== '') ? item.read() : undefined
  }

  register(record: CollectionRecord) {
    this.records.add(record)
    this.invalidate()
  }

  unregister(record: CollectionRecord) {
    this.records.delete(record)
    if (this.byElement.get(record.ref) === record)
      this.byElement.delete(record.ref)
    this.invalidate()
  }

  invalidate() {
    this.stale()
    this.version.value++
  }

  stale() {
    this.ordered = null
    this.enabledItems = null
    this.allItems = null
  }

  /** The cached DOM order, rebuilt when stale; `null` when no root is mounted. */
  validate(): CollectionRecord[] | null {
    const root = this.root?.value
    if (!root)
      return null
    if (this.ordered && root === this.observed && !this.observer?.takeRecords().length)
      return this.ordered
    return this.rebuild(root)
  }

  rebuild(root: Element): CollectionRecord[] {
    const byElement = this.byElement
    byElement.clear()
    for (const record of this.records) {
      const element = record.element.value
      if (element) {
        record.ref = element as HTMLElement
        byElement.set(element, record)
      }
    }
    const ordered: CollectionRecord[] = []
    // Whether every item renders under the root with the attribute.
    let allInTree = true
    if (byElement.size) {
      for (const node of root.querySelectorAll(`[${ITEM_DATA_ATTR}]`)) {
        const record = byElement.get(node)
        if (record)
          ordered.push(record)
      }
      // Items outside the root's subtree (or rendered without the attribute)
      // come first, in registration order, as the previous index sort did.
      if (ordered.length !== byElement.size) {
        allInTree = false
        const inTree = new Set(ordered)
        const outside: CollectionRecord[] = []
        for (const record of byElement.values()) {
          if (!inTree.has(record))
            outside.push(record)
        }
        ordered.unshift(...outside)
      }
    }
    this.observe(root)
    this.stale()
    this.ordered = ordered
    this.cacheable = !!this.observer && allInTree
    return ordered
  }

  observe(root: Element) {
    if (typeof MutationObserver === 'undefined')
      return
    if (this.observed !== root) {
      this.observer?.disconnect()
      // A child-list change (reorder, v-if, a swapped item element) or a
      // `data-disabled` change makes the order and the item lists stale, and
      // notifies the readers that track the items.
      this.observer ??= new MutationObserver(() => {
        this.invalidate()
      })
      this.observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-disabled'] })
      this.observed = root
    }
    else {
      this.observer?.takeRecords()
    }
  }

  dispose() {
    this.observer?.disconnect()
    this.observer = null
    this.observed = null
  }

  /** The reactive views, created on first use and shared by every `useCollection()` of the provider. */
  getReactiveItems(): ComputedRef<CollectionEntry[]> {
    return this.reactiveItems ??= getterRef(() => {
      void this.version.value
      const items: CollectionEntry[] = []
      for (const record of this.records) {
        const element = record.element.value
        if (element) {
          record.ref = element as HTMLElement
          items.push(record.read())
        }
      }
      return items
    })
  }

  getItemMapSize(): ComputedRef<number> {
    return this.itemMapSize ??= getterRef(() => this.getReactiveItems().value.length)
  }
}

function filterEnabled(records: CollectionRecord[], includeDisabledItem: boolean): CollectionEntry[] {
  const items: CollectionEntry[] = []
  for (const record of records) {
    if (includeDisabledItem || record.ref.dataset.disabled !== '')
      items.push(record.read())
  }
  return items
}

function injectionKeyOf(key: string) {
  return `${key}CollectionProvider`
}

function provideCollection(key: string): CollectionContextImpl {
  const context = new CollectionContextImpl()
  provide(injectionKeyOf(key), context)
  onScopeDispose(() => context.dispose())
  return context
}

/**
 * The nearest provider, including one provided by the calling component
 * itself (`inject` only sees the ancestors'): a provider part can mark its own
 * element as the root with `useCollectionSlot`.
 */
function injectCollection(key: string): CollectionContextImpl | null {
  const instance = getCurrentInstance() as (ComponentInternalInstance & { provides: Record<string, unknown> }) | null
  if (!instance)
    return null
  return (instance.provides[injectionKeyOf(key)] as CollectionContextImpl | undefined) ?? null
}

/** What a `useCollection()` without a provider reads: always empty. */
let emptyContext: CollectionContextImpl | undefined

/**
 * Makes `element` the root of the nearest collection: `getItems()` returns the
 * registered items in the order they appear under it. The composable form of
 * `CollectionSlot`, for a part that renders the root element itself.
 *
 * @internal
 */
export function useCollectionSlot(element: ElementSourceLike, options: { key?: string } = {}): void {
  const context = injectCollection(options.key ?? '')
  if (!context)
    return
  context.root = element
  context.invalidate()
  onScopeDispose(() => {
    if (context.root === element)
      context.root = undefined
  })
}

/**
 * Registers the calling part as an item of the nearest collection. The
 * composable form of `CollectionItem`: no wrapper component and no effect. The
 * part binds `COLLECTION_ITEM_ATTRS` on the element `element` resolves to.
 *
 * @param element The item's element (its `useForwardElement().currentElement`).
 * @param value Reads the item's value (what `getItems()[i].value` returns).
 * `options.key` is the collection key (as given to `useCollection`);
 * `options.meta` is data for the provider, read back with `getCollectionMeta`.
 *
 * @returns Whether a collection was found.
 * @internal
 */
export function useCollectionItem(element: ElementSourceLike, value?: () => unknown, options: { key?: string, meta?: unknown } = {}): boolean {
  const context = injectCollection(options.key ?? '')
  if (!context)
    return false
  const record = new CollectionRecord(element, value)
  if (options.meta !== undefined)
    metaByEntry.set(record.entry, options.meta)
  context.register(record)
  onScopeDispose(() => context.unregister(record))
  return true
}

/** The `meta` an item registered with (see `useCollectionItem`). @internal */
export function getCollectionMeta<M>(item: CollectionEntry | undefined): M | undefined {
  return item && metaByEntry.get(item) as M | undefined
}

/**
 * The wrapper components, defined once per collection key (not per
 * `useCollection()` call). They read the nearest provider themselves.
 */
const components = new Map<string, { CollectionSlot: Component, CollectionItem: Component }>()

function getCollectionComponents(key: string) {
  let entry = components.get(key)
  if (entry)
    return entry

  const CollectionSlot = defineComponent({
    name: 'CollectionSlot',
    inheritAttrs: false,
    setup(_, { slots, attrs, expose }) {
      const { forwardRef, currentElement, expose: elementExpose } = useForwardElement()
      expose(elementExpose)
      useCollectionSlot(currentElement, { key })
      return () => h(Slot, { ref: forwardRef, ...attrs }, slots)
    },
  })

  const CollectionItem = defineComponent({
    name: 'CollectionItem',
    inheritAttrs: false,
    props: {
      value: {
        // It accepts any value
        validator: () => true,
      },
    },
    setup(props, { slots, attrs, expose }) {
      const { forwardRef, currentElement, expose: elementExpose } = useForwardElement()
      expose(elementExpose)
      useCollectionItem(currentElement, () => props.value, { key })
      return () => h(Slot, { ...attrs, [ITEM_DATA_ATTR]: '', ref: forwardRef }, slots)
    },
  })

  entry = { CollectionSlot, CollectionItem }
  components.set(key, entry)
  return entry
}

export interface UseCollectionReturn<ItemData = {}> {
  /** The registered items in DOM order; disabled items (`data-disabled=""`) are left out unless asked for. */
  getItems: (includeDisabledItem?: boolean) => CollectionEntry<ItemData>[]
  /** The registered item rendered as `element`. */
  getItem: (element: HTMLElement, includeDisabledItem?: boolean) => CollectionEntry<ItemData> | undefined
  /** The registered items with an element (registration order), tracked. */
  readonly reactiveItems: Readonly<Ref<CollectionEntry<ItemData>[]>>
  /** The number of registered items with an element, tracked. */
  readonly itemMapSize: Readonly<Ref<number>>
  CollectionSlot: Component
  CollectionItem: Component
}

/**
 * The item registry shared by the list families. A provider (`isProvider`)
 * owns the registry; its descendants register items into it (the
 * `CollectionItem` wrapper or `useCollectionItem`) and mark its root (the
 * `CollectionSlot` wrapper or `useCollectionSlot`).
 *
 * Everything returned is owned by the provider: calling it in every item
 * allocates nothing beyond the returned object.
 */
export function useCollection<ItemData = {}>(options: { key?: string, isProvider?: boolean } = {}): UseCollectionReturn<ItemData> {
  const { key = '', isProvider = false } = options
  const context = isProvider ? provideCollection(key) : (injectCollection(key) ?? (emptyContext ??= new CollectionContextImpl()))
  const { CollectionSlot, CollectionItem } = getCollectionComponents(key)

  return {
    getItems: context.getItems as UseCollectionReturn<ItemData>['getItems'],
    getItem: context.getItem as UseCollectionReturn<ItemData>['getItem'],
    get reactiveItems() {
      return context.getReactiveItems() as unknown as Ref<CollectionEntry<ItemData>[]>
    },
    get itemMapSize() {
      return context.getItemMapSize()
    },
    CollectionSlot,
    CollectionItem,
  }
}
