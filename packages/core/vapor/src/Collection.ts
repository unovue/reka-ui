// Vapor `useCollection`. v2 already registers items by element and orders them by a DOM query
// on the collection root (`querySelectorAll('[data-reka-collection-item]')`), so only the two wrapper
// components were VDOM-specific: they render `h(Slot, …)` to clone the slot child with a ref and the
// item marker. Here they render the slot and take its first element, the same way the Vapor
// `Primitive` handles `asChild` (attrs adopted onto that element, the child's own attributes win).
import type { Ref, ShallowRef } from 'vue'
import { computed, inject, markRaw, onScopeDispose, provide, ref, watchEffect } from 'vue'
import { createCollectionOrder, ITEM_DATA_ATTR } from '@/Collection/collectionOrder'
import { renderAsChildSlot } from './Primitive'
import { defineVaporComponent } from './shared/internals'

type CollectionItemData<ItemData = {}> = { ref: HTMLElement, value?: any } & ItemData

type CollectionContext<ItemData = {}> = ReturnType<typeof createCollectionContext<ItemData>>

/**
 * Renders the default slot as `asChild` (slot `props` or DOM adoption). `root` follows its first
 * element, also when the slot replaces it while mounted.
 */
function renderSlotElement(attrs: Record<string, any>, extra: Record<string, any> = {}) {
  const { block, root } = renderAsChildSlot(() => ({ ...attrs, ...extra }))
  return { block, root: root as ShallowRef<HTMLElement | null> }
}

function createCollectionContext<ItemData>() {
  const itemMap = ref(new Map()) as Ref<Map<HTMLElement, CollectionItemData<ItemData>>>
  const collectionRef = ref<HTMLElement>()
  // The ordered list `getItems()` returns is cached there (shared with the VDOM `useCollection`).
  const order = createCollectionOrder(itemMap, collectionRef)

  const getItem = (element: HTMLElement, includeDisabledItem = false) => {
    if (!collectionRef.value)
      return undefined
    const item = itemMap.value.get(element)
    return item && (includeDisabledItem || item.ref.dataset.disabled !== '') ? item : undefined
  }

  const CollectionSlot = defineVaporComponent({
    name: 'CollectionSlot',
    inheritAttrs: false,
    setup(_, { attrs, expose }) {
      const { block, root } = renderSlotElement(attrs)
      expose({
        get $el() {
          return root.value
        },
      })
      watchEffect((cleanup) => {
        const el = root.value
        if (!el)
          return
        collectionRef.value = el
        order.reset()
        cleanup(() => {
          if (collectionRef.value === el) {
            collectionRef.value = undefined
            order.reset()
          }
        })
      }, { flush: 'sync' })
      return block
    },
  })

  const CollectionItem = defineVaporComponent({
    name: 'CollectionItem',
    inheritAttrs: false,
    props: { value: { validator: () => true } },
    setup(props, { attrs, expose }) {
      const { block, root } = renderSlotElement(attrs, { [ITEM_DATA_ATTR]: '' })
      expose({
        get $el() {
          return root.value
        },
      })
      watchEffect((cleanup) => {
        const node = root.value
        if (node) {
          const k = markRaw(node)
          // @ts-expect-error item data is filled by the caller's ItemData
          itemMap.value.set(k, { ref: node, value: props.value })
          order.invalidate()
          cleanup(() => {
            itemMap.value.delete(k)
            order.invalidate()
          })
        }
      })
      return block
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

  const { getItems, getItem, reactiveItems, itemMapSize, CollectionSlot, CollectionItem } = context.api
  return { getItems, getItem, reactiveItems, itemMapSize, CollectionSlot, CollectionItem }
}
