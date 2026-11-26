import type { Ref } from 'vue'
import { computed, defineComponent, h, inject, markRaw, onBeforeUnmount, onMounted, onScopeDispose, onUpdated, provide, ref, watch, watchEffect } from 'vue'
import { Slot, usePrimitiveElement } from '@/Primitive'
import { createCollectionOrder, ITEM_DATA_ATTR } from './collectionOrder'

type CollectionItemData<ItemData = {}> = { ref: HTMLElement, value?: any } & ItemData

type CollectionContext<ItemData = {}> = ReturnType<typeof createCollectionContext<ItemData>>

function createCollectionContext<ItemData>() {
  const itemMap = ref(new Map()) as Ref<Map<HTMLElement, CollectionItemData<ItemData>>>
  const collectionRef = ref<HTMLElement>()
  const order = createCollectionOrder(itemMap, collectionRef)

  const getItem = (element: HTMLElement, includeDisabledItem = false) => {
    if (!collectionRef.value)
      return undefined

    const item = itemMap.value.get(element)
    return item && (includeDisabledItem || item.ref.dataset.disabled !== '') ? item : undefined
  }

  const CollectionSlot = defineComponent({
    name: 'CollectionSlot',
    inheritAttrs: false,
    setup(_, { slots, attrs }) {
      const { primitiveElement, currentElement } = usePrimitiveElement()
      watch(currentElement, () => {
        collectionRef.value = currentElement.value
        order.reset()
      })
      // The watcher stops on unmount, before the element ref clears, so a provider that
      // outlives this slot would keep the detached element. Only clear our own registration.
      onBeforeUnmount(() => {
        if (collectionRef.value === currentElement.value) {
          collectionRef.value = undefined
          order.reset()
        }
      })
      return () => h(Slot, { ref: primitiveElement, ...attrs }, slots)
    },
  })

  /**
   * Keeps the calling component's `element` registered as an item, from its mount to its unmount.
   *
   * Driven by the lifecycle hooks rather than an effect: an effect per item is a queued job per
   * item right after a list mounts, and Vue scans the whole job queue for every component a parent
   * re-renders, so a long list pays for those jobs many times over.
   */
  function registerItem(element: Ref<HTMLElement | null | undefined>, getValue: () => unknown) {
    let registered: HTMLElement | undefined
    function unregister() {
      if (registered) {
        itemMap.value.delete(registered)
        order.invalidate()
        registered = undefined
      }
    }
    function sync() {
      const node = element.value ?? undefined
      if (node === registered)
        return
      unregister()
      if (node) {
        registered = markRaw(node)
        // `value` is read when asked for, so a changed value needs no new registration.
        itemMap.value.set(registered, {
          ref: node,
          get value() {
            return getValue()
          },
        } as CollectionItemData<ItemData>)
        order.invalidate()
      }
    }
    onMounted(sync)
    // The part can render another element later (`asChild` with a `v-if` child).
    onUpdated(sync)
    onBeforeUnmount(unregister)
  }

  const CollectionItem = defineComponent({
    name: 'CollectionItem',
    inheritAttrs: false,
    props: {
      value: {
        // It accepts any value
        validator: () => true,
      },
    },
    setup(props, { slots, attrs }) {
      const { primitiveElement, currentElement } = usePrimitiveElement()

      watchEffect((cleanupFn) => {
        if (currentElement.value) {
          const key = markRaw(currentElement.value)
          // @ts-expect-error ignore assignment of unknown to any
          itemMap.value.set(key, { ref: currentElement.value!, value: props.value })
          order.invalidate()
          cleanupFn(() => {
            itemMap.value.delete(key)
            order.invalidate()
          })
        }
      })

      return () => h(Slot, { ...attrs, [ITEM_DATA_ATTR]: '', ref: primitiveElement }, slots)
    },
  })

  const reactiveItems = computed(() => Array.from(itemMap.value.values()))
  const itemMapSize = computed(() => itemMap.value.size)

  return {
    collectionRef,
    itemMap,
    order,
    registerItem,
    /** What `useCollection()` returns. Built once per provider and shared by every caller under it. */
    api: { getItems: order.getItems, getItem, reactiveItems, itemMapSize, CollectionSlot, CollectionItem },
  }
}

function injectCollectionContext<ItemData>(key: string) {
  // Without a provider the collection is empty and stays local to this caller.
  return inject<CollectionContext<ItemData>>(`${key}CollectionProvider`) ?? createCollectionContext<ItemData>()
}

/**
 * Registers the calling part as an item of the nearest collection: what wrapping its element in
 * `CollectionItem` does, without the two wrapper components. The part renders the
 * `data-reka-collection-item` attribute on the element itself: `getItems()` orders by it.
 *
 * @param element The item's element (the `currentElement` of `useForwardExpose`).
 * @param getValue Reads the item's value. `getItems()[i].value` calls it on every read.
 */
export function useCollectionItem(element: Ref<HTMLElement | null | undefined>, getValue: () => unknown = () => undefined, options: { key?: string } = {}) {
  injectCollectionContext(options.key ?? '').registerItem(element, getValue)
}

export function useCollection<ItemData = {}>(options: { key?: string, isProvider?: boolean } = {}) {
  const { key = '', isProvider = false } = options
  const injectionKey = `${key}CollectionProvider`
  let context: CollectionContext<ItemData>

  if (isProvider) {
    context = createCollectionContext<ItemData>()
    provide(injectionKey, context)
    const { order } = context
    onScopeDispose(order.reset)
  }
  else {
    context = injectCollectionContext<ItemData>(key)
  }

  // Shared by every caller under the provider: an item pays for one `inject`, not for two
  // component definitions and two computeds of its own.
  const { getItems, getItem, reactiveItems, itemMapSize, CollectionSlot, CollectionItem } = context.api
  return { getItems, getItem, reactiveItems, itemMapSize, CollectionSlot, CollectionItem }
}
