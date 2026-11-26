import type { Ref } from 'vue'
import { computed, defineComponent, h, inject, markRaw, onBeforeUnmount, onScopeDispose, provide, ref, watch, watchEffect } from 'vue'
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
    /** What `useCollection()` returns. Built once per provider and shared by every caller under it. */
    api: { getItems: order.getItems, getItem, reactiveItems, itemMapSize, CollectionSlot, CollectionItem },
  }
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
    // Without a provider the collection is empty and stays local to this caller.
    context = inject<CollectionContext<ItemData>>(injectionKey) ?? createCollectionContext<ItemData>()
  }

  // Shared by every caller under the provider: an item pays for one `inject`, not for two
  // component definitions and two computeds of its own.
  const { getItems, getItem, reactiveItems, itemMapSize, CollectionSlot, CollectionItem } = context.api
  return { getItems, getItem, reactiveItems, itemMapSize, CollectionSlot, CollectionItem }
}
