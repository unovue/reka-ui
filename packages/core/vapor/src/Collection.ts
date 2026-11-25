// SPIKE: Vapor `useCollection`. v2 already registers items by element and orders them by a DOM query
// on the collection root (`querySelectorAll('[data-reka-collection-item]')`), so only the two wrapper
// components were VDOM-specific: they render `h(Slot, …)` to clone the slot child with a ref and the
// item marker. Here they render the slot and take its first element, the same way the Vapor
// `Primitive` handles `asChild` (attrs adopted onto that element, the child's own attributes win).
import type { Ref } from 'vue'
import { computed, defineVaporComponent, inject, markRaw, onScopeDispose, provide, ref, shallowRef, watchEffect } from 'vue'
import { renderAsChildSlot } from './Primitive'

interface CollectionContext<ItemData = {}> {
  collectionRef: Ref<HTMLElement | undefined>
  itemMap: Ref<Map<HTMLElement, { ref: HTMLElement, value?: any } & ItemData>>
}

const ITEM_DATA_ATTR = 'data-reka-collection-item'

/** Renders the default slot as `asChild` (slot `props` or DOM adoption) and returns its first element. */
function renderSlotElement(attrs: Record<string, any>, extra: Record<string, any> = {}) {
  const { block, element } = renderAsChildSlot(() => ({ ...attrs, ...extra }))
  return { block, el: element as HTMLElement | null }
}

export function useCollection<ItemData = {}>(options: { key?: string, isProvider?: boolean } = {}) {
  const { key = '', isProvider = false } = options
  const injectionKey = `${key}CollectionProvider`
  let context: CollectionContext<ItemData>

  if (isProvider) {
    context = {
      collectionRef: ref<HTMLElement>(),
      itemMap: ref(new Map()),
    } as CollectionContext<ItemData>
    provide(injectionKey, context)
  }
  else {
    context = inject(injectionKey) as CollectionContext<ItemData>
  }

  const getItem = (element: HTMLElement, includeDisabledItem = false) => {
    if (!context.collectionRef.value)
      return undefined
    const item = context.itemMap.value.get(element)
    return item && (includeDisabledItem || item.ref.dataset.disabled !== '') ? item : undefined
  }

  const getItems = (includeDisabledItem = false) => {
    const collectionNode = context.collectionRef.value
    if (!collectionNode)
      return []
    const orderedNodes = Array.from(collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`))
    const orderMap = new Map(orderedNodes.map((node, index) => [node, index]))
    const orderedItems = Array.from(context.itemMap.value.values())
      .sort((a, b) => (orderMap.get(a.ref) ?? -1) - (orderMap.get(b.ref) ?? -1))
    return includeDisabledItem ? orderedItems : orderedItems.filter(i => i.ref.dataset.disabled !== '')
  }

  const CollectionSlot = defineVaporComponent({
    name: 'CollectionSlot',
    inheritAttrs: false,
    setup(_, { attrs, expose }) {
      const { block, el } = renderSlotElement(attrs)
      expose({ $el: el })
      if (el) {
        context.collectionRef.value = el
        onScopeDispose(() => {
          if (context.collectionRef.value === el)
            context.collectionRef.value = undefined
        })
      }
      return block
    },
  })

  const CollectionItem = defineVaporComponent({
    name: 'CollectionItem',
    inheritAttrs: false,
    props: { value: { validator: () => true } },
    setup(props, { attrs, expose }) {
      const { block, el } = renderSlotElement(attrs, { [ITEM_DATA_ATTR]: '' })
      expose({ $el: el })
      const element = shallowRef(el)
      watchEffect((cleanup) => {
        const node = element.value
        if (node) {
          const k = markRaw(node)
          // @ts-expect-error item data is filled by the caller's ItemData
          context.itemMap.value.set(k, { ref: node, value: props.value })
          cleanup(() => context.itemMap.value.delete(k))
        }
      })
      return block
    },
  })

  const reactiveItems = computed(() => Array.from(context.itemMap.value.values()))
  const itemMapSize = computed(() => context.itemMap.value.size)

  return { getItems, getItem, reactiveItems, itemMapSize, CollectionSlot, CollectionItem }
}
