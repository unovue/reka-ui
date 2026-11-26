import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, inject, nextTick, reactive, ref, Teleport } from 'vue'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'
import { useCollection } from './Collection'

// Characterization tests for `useCollection`.
// These assert on the RETURNED values/order of `getItems()`, `reactiveItems`
// and `itemMapSize` so they act as a safety net for a future `getItems()`
// rewrite, rather than locking in implementation details.

interface ItemConfig {
  value: string
  disabled?: boolean
}

// Builds a parent component that acts as the collection provider and renders
// a `CollectionSlot` wrapping a `CollectionItem` per entry in `items`.
//
// Wiring notes:
// - `useCollection({ isProvider: true })` runs `provide()`, the renderless
//   `CollectionItem`s `inject()` the same context (same `setup`/`useCollection`
//   call here returns those components, so they share `context`).
// - `Slot` (used by both `CollectionSlot` and `CollectionItem`) requires a
//   single root element child to forward its ref onto, so:
//     * `CollectionSlot` wraps the items in a single `<div>` root.
//     * each `CollectionItem` renders a single `<div>` child.
// - `attachTo: document.body` is required because `getItems()` orders by DOM
//   order via `querySelectorAll`, which needs a connected document.
function createWrapper(initialItems: ItemConfig[]) {
  // Reactive so tests can mutate (e.g. remove an item) and re-render.
  const items = reactive<ItemConfig[]>([...initialItems])

  let collection!: ReturnType<typeof useCollection>

  const Parent = defineComponent({
    setup() {
      collection = useCollection({ key: 'test', isProvider: true })
      const { CollectionSlot, CollectionItem } = collection

      return () =>
        h(CollectionSlot, null, {
          default: () =>
            h(
              'div',
              { 'data-testid': 'collection-root' },
              items.map(item =>
                h(
                  CollectionItem,
                  { key: item.value, value: item.value },
                  {
                    default: () =>
                      h('div', {
                        'data-testid': item.value,
                        // When disabled, expose `data-disabled=""` on the real
                        // element so `ref.dataset.disabled === ''`.
                        ...(item.disabled ? { 'data-disabled': '' } : {}),
                      }, item.value),
                  },
                ),
              ),
            ),
        })
    },
  })

  const wrapper = mount(Parent, { attachTo: document.body })

  return {
    wrapper,
    items,
    getCollection: () => collection,
  }
}

describe('useCollection', () => {
  it('registers items into reactiveItems and itemMapSize reflects the count', async () => {
    const { getCollection, wrapper } = createWrapper([
      { value: 'a' },
      { value: 'b' },
      { value: 'c' },
    ])
    await nextTick()

    const { reactiveItems, itemMapSize } = getCollection()

    expect(itemMapSize.value).toBe(3)
    expect(reactiveItems.value).toHaveLength(3)
    expect(reactiveItems.value.map(i => i.value).sort()).toEqual(['a', 'b', 'c'])

    wrapper.unmount()
  })

  it('getItems() returns items in DOM order even when registration order differs', async () => {
    // Registration order (watchEffect firing) is not guaranteed to match DOM
    // order. `getItems()` sorts by `querySelectorAll` DOM order, so the result
    // must follow the template/DOM order regardless.
    const { getCollection, wrapper } = createWrapper([
      { value: 'first' },
      { value: 'second' },
      { value: 'third' },
    ])
    await nextTick()

    const { getItems } = getCollection()
    expect(getItems().map(i => i.value)).toEqual(['first', 'second', 'third'])

    // Sanity-check ordering reflects actual DOM order.
    const rendered = Array.from(
      document.querySelectorAll('[data-reka-collection-item]'),
    ).map(el => (el as HTMLElement).dataset.testid)
    expect(getItems().map(i => i.value)).toEqual(rendered)

    wrapper.unmount()
  })

  it('filters out items with data-disabled="" by default, includes them with getItems(true)', async () => {
    const { getCollection, wrapper } = createWrapper([
      { value: 'a' },
      { value: 'b', disabled: true },
      { value: 'c' },
    ])
    await nextTick()

    const { getItems } = getCollection()

    // Disabled item excluded by default.
    expect(getItems().map(i => i.value)).toEqual(['a', 'c'])

    // Included (in DOM order) when requested.
    expect(getItems(true).map(i => i.value)).toEqual(['a', 'b', 'c'])

    wrapper.unmount()
  })

  it('removes an item from the map when it unmounts', async () => {
    const { getCollection, items, wrapper } = createWrapper([
      { value: 'a' },
      { value: 'b' },
      { value: 'c' },
    ])
    await nextTick()

    const { getItems, itemMapSize } = getCollection()
    expect(itemMapSize.value).toBe(3)
    expect(getItems().map(i => i.value)).toEqual(['a', 'b', 'c'])

    // Remove the middle item, triggering CollectionItem unmount + cleanup.
    const idx = items.findIndex(i => i.value === 'b')
    items.splice(idx, 1)
    await nextTick()

    expect(itemMapSize.value).toBe(2)
    expect(getItems().map(i => i.value)).toEqual(['a', 'c'])

    wrapper.unmount()
  })

  it('looks up registered items by element and preserves disabled filtering', async () => {
    const { getCollection, wrapper } = createWrapper([
      { value: 'enabled' },
      { value: 'disabled', disabled: true },
    ])
    await nextTick()

    const { getItem, getItems } = getCollection()
    const enabled = wrapper.get<HTMLElement>('[data-testid=enabled]').element
    const disabled = wrapper.get<HTMLElement>('[data-testid=disabled]').element

    expect(getItem(enabled)).toBe(getItems().find(item => item.ref === enabled))
    expect(getItem(disabled)).toBeUndefined()
    expect(getItem(disabled, true)).toBe(getItems(true).find(item => item.ref === disabled))
    expect(getItem(document.createElement('div'))).toBeUndefined()

    wrapper.unmount()
  })

  it('finds detached registered items but not unmounted items', async () => {
    const { getCollection, items, wrapper } = createWrapper([{ value: 'item' }])
    await nextTick()

    const { getItem, getItems } = getCollection()
    const element = wrapper.get<HTMLElement>('[data-testid=item]').element
    const item = getItems()[0]
    element.remove()
    expect(getItem(element)).toBe(item)

    wrapper.element.appendChild(element)
    items.splice(0, 1)
    await nextTick()
    expect(getItem(element)).toBeUndefined()

    wrapper.unmount()
  })

  it('getItems() returns [] when no CollectionSlot element is mounted', async () => {
    // A provider context whose `collectionRef` is never set (no CollectionSlot
    // currentElement). `getItems()` short-circuits to `[]`.
    let collection!: ReturnType<typeof useCollection>

    const Parent = defineComponent({
      setup() {
        collection = useCollection({ key: 'empty', isProvider: true })
        // Render nothing collection-related: no CollectionSlot is mounted.
        return () => h('div', 'no-collection')
      },
    })

    const wrapper = mount(Parent, { attachTo: document.body })
    await nextTick()

    expect(collection.getItem(document.createElement('div'))).toBeUndefined()
    expect(collection.getItems()).toEqual([])
    expect(collection.getItems(true)).toEqual([])
    expect(collection.itemMapSize.value).toBe(0)

    wrapper.unmount()
  })
})

describe('given a Collection provider that outlives its CollectionSlot', () => {
  function mountCollection() {
    let context!: { collectionRef: { value: HTMLElement | undefined } }
    const show = ref({ first: true, second: false })
    const Slot = defineComponent({
      props: { name: String },
      setup(props) {
        const { CollectionSlot } = useCollection({ key: 'release' })
        context = inject('releaseCollectionProvider')!
        return () => h(CollectionSlot, () => h('ul', { 'data-testid': props.name }))
      },
    })
    const wrapper = mount(defineComponent({
      setup() {
        useCollection({ key: 'release', isProvider: true })
        return () => h('div', [
          show.value.first ? h(Slot, { key: 'first', name: 'first' }) : null,
          show.value.second ? h(Slot, { key: 'second', name: 'second' }) : null,
        ])
      },
    }), { attachTo: document.body })
    return { wrapper, show, context: () => context }
  }

  it('should release the element when the CollectionSlot unmounts', async () => {
    const { wrapper, show, context } = mountCollection()

    for (let cycle = 0; cycle < 2; cycle++) {
      await nextTick()
      expect(context().collectionRef.value).toBe(wrapper.get('[data-testid=first]').element)

      show.value.first = false
      await nextTick()
      expect(context().collectionRef.value).toBeUndefined()

      show.value.first = true
      await nextTick()
    }

    wrapper.unmount()
  })

  it('should keep a newer registration when an older CollectionSlot unmounts', async () => {
    const { wrapper, show, context } = mountCollection()
    await nextTick()

    show.value.second = true
    await nextTick()
    await nextTick()
    const second = wrapper.get('[data-testid=second]').element
    expect(context().collectionRef.value).toBe(second)

    show.value.first = false
    await nextTick()
    expect(context().collectionRef.value).toBe(second)

    wrapper.unmount()
  })
})

describe('given repeated getItems() calls', () => {
  const values = (items: { value?: any }[]) => items.map(i => i.value)

  function spyOnQuery(wrapper: ReturnType<typeof createWrapper>['wrapper']) {
    return vi.spyOn(wrapper.get('[data-testid=collection-root]').element, 'querySelectorAll')
  }

  it('should query the DOM once while nothing changes', async () => {
    const { getCollection, wrapper } = createWrapper([{ value: 'a' }, { value: 'b', disabled: true }, { value: 'c' }])
    await nextTick()
    const { getItems } = getCollection()
    const query = spyOnQuery(wrapper)

    for (let i = 0; i < 5; i++) {
      expect(values(getItems())).toEqual(['a', 'c'])
      expect(values(getItems(true))).toEqual(['a', 'b', 'c'])
    }
    expect(query).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('should hand out a new array on every call', async () => {
    const { getCollection, wrapper } = createWrapper([{ value: 'a' }, { value: 'b' }])
    await nextTick()
    const { getItems } = getCollection()

    getItems().reverse()
    getItems(true).length = 0
    expect(values(getItems())).toEqual(['a', 'b'])
    expect(values(getItems(true))).toEqual(['a', 'b'])
    // The items themselves are the registered ones.
    expect(getItems()[0]).toBe(getItems(true)[0])

    wrapper.unmount()
  })

  it('should follow a keyed reorder, before and after the DOM mutation is reported', async () => {
    const { getCollection, wrapper, items } = createWrapper([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
    await nextTick()
    const { getItems } = getCollection()
    expect(values(getItems())).toEqual(['a', 'b', 'c'])

    items.reverse()
    // Right after the patch: the MutationObserver callback has not run yet.
    await nextTick()
    expect(values(getItems())).toEqual(['c', 'b', 'a'])

    items.push(items.shift()!)
    await nextTick()
    await new Promise(resolve => setTimeout(resolve))
    expect(values(getItems())).toEqual(['b', 'a', 'c'])

    wrapper.unmount()
  })

  it('should follow an item moved by hand without any registration change', async () => {
    const { getCollection, wrapper } = createWrapper([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
    await nextTick()
    const { getItems } = getCollection()
    expect(values(getItems())).toEqual(['a', 'b', 'c'])

    const root = wrapper.get('[data-testid=collection-root]').element
    root.appendChild(wrapper.get('[data-testid=a]').element)
    expect(values(getItems())).toEqual(['b', 'c', 'a'])

    // A wrapper holding an item moves: the moved node is not an item itself.
    const group = document.createElement('div')
    root.appendChild(group)
    group.appendChild(wrapper.get('[data-testid=b]').element)
    expect(values(getItems())).toEqual(['c', 'a', 'b'])
    root.insertBefore(group, root.firstChild)
    expect(values(getItems())).toEqual(['b', 'c', 'a'])

    wrapper.unmount()
  })

  it('should follow inserted and removed items', async () => {
    const { getCollection, wrapper, items } = createWrapper([{ value: 'a' }, { value: 'c' }])
    await nextTick()
    const { getItems } = getCollection()
    expect(values(getItems())).toEqual(['a', 'c'])

    items.splice(1, 0, { value: 'b' })
    await nextTick()
    expect(values(getItems())).toEqual(['a', 'b', 'c'])

    items.splice(0, 1)
    await nextTick()
    expect(values(getItems())).toEqual(['b', 'c'])
    expect(values(getItems(true))).toEqual(['b', 'c'])

    wrapper.unmount()
  })

  it('should follow an item that becomes disabled or enabled', async () => {
    const { getCollection, wrapper, items } = createWrapper([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
    await nextTick()
    const { getItems } = getCollection()
    const query = spyOnQuery(wrapper)
    expect(values(getItems())).toEqual(['a', 'b', 'c'])

    items[1].disabled = true
    await nextTick()
    expect(values(getItems())).toEqual(['a', 'c'])
    expect(values(getItems(true))).toEqual(['a', 'b', 'c'])

    items[1].disabled = false
    await nextTick()
    await new Promise(resolve => setTimeout(resolve))
    expect(values(getItems())).toEqual(['a', 'b', 'c'])

    // `data-disabled` set by hand, any value but the empty string keeps the item.
    const last = document.querySelector('[data-testid=c]')!
    last.setAttribute('data-disabled', 'false')
    expect(values(getItems())).toEqual(['a', 'b', 'c'])
    last.setAttribute('data-disabled', '')
    expect(values(getItems())).toEqual(['a', 'b'])

    // The order did not change, so the DOM was queried once.
    expect(query).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('should not rebuild the order when an element without items is added inside an item', async () => {
    const { getCollection, wrapper } = createWrapper([{ value: 'a' }, { value: 'b' }])
    await nextTick()
    const { getItems } = getCollection()
    const query = spyOnQuery(wrapper)
    expect(values(getItems())).toEqual(['a', 'b'])

    document.querySelector('[data-testid=a]')!.appendChild(document.createElement('span'))
    document.querySelector('[data-testid=b]')!.appendChild(document.createTextNode('!'))
    expect(values(getItems())).toEqual(['a', 'b'])
    expect(query).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('should return the new value of an item whose value changes', async () => {
    const itemValue = ref('one')
    let collection!: ReturnType<typeof useCollection>
    const Parent = defineComponent({
      setup() {
        collection = useCollection({ key: 'value', isProvider: true })
        const { CollectionSlot, CollectionItem } = collection
        return () => h(CollectionSlot, null, () => h('div', [
          h(CollectionItem, { value: itemValue.value }, () => h('div')),
          h(CollectionItem, { value: 'last' }, () => h('div')),
        ]))
      },
    })
    const wrapper = mount(Parent, { attachTo: document.body })
    await nextTick()
    expect(values(collection.getItems())).toEqual(['one', 'last'])

    itemValue.value = 'two'
    await nextTick()
    expect(values(collection.getItems())).toEqual(['two', 'last'])

    wrapper.unmount()
  })

  it('should put items rendered outside the root first, in registration order, and track their disabled state', async () => {
    const outsideDisabled = ref(false)
    let collection!: ReturnType<typeof useCollection>
    const Parent = defineComponent({
      setup() {
        collection = useCollection({ key: 'teleport', isProvider: true })
        const { CollectionSlot, CollectionItem } = collection
        const item = (value: string, disabled = false) =>
          h(CollectionItem, { key: value, value }, () => h('div', disabled ? { 'data-disabled': '' } : {}))
        return () => h(CollectionSlot, null, () => h('div', [
          item('in-1'),
          h(Teleport, { to: 'body' }, [item('out-1', outsideDisabled.value), item('out-2')]),
          item('in-2'),
        ]))
      },
    })
    const wrapper = mount(Parent, { attachTo: document.body })
    await nextTick()
    const { getItems } = collection
    expect(values(getItems())).toEqual(['out-1', 'out-2', 'in-1', 'in-2'])

    // Outside the root no observer sees the attribute: it is read on every call.
    outsideDisabled.value = true
    await nextTick()
    expect(values(getItems())).toEqual(['out-2', 'in-1', 'in-2'])
    expect(values(getItems(true))).toEqual(['out-1', 'out-2', 'in-1', 'in-2'])

    wrapper.unmount()
  })

  it('should ignore the items of a nested collection', async () => {
    let outer!: ReturnType<typeof useCollection>
    let inner!: ReturnType<typeof useCollection>
    const showInner = ref(true)
    const Inner = defineComponent({
      setup() {
        inner = useCollection({ key: 'inner', isProvider: true })
        const { CollectionSlot, CollectionItem } = inner
        return () => h(CollectionSlot, null, () => h('div', [
          h(CollectionItem, { value: 'inner-1' }, () => h('div')),
          showInner.value ? h(CollectionItem, { value: 'inner-2' }, () => h('div')) : null,
        ]))
      },
    })
    const Outer = defineComponent({
      setup() {
        outer = useCollection({ key: 'outer', isProvider: true })
        const { CollectionSlot, CollectionItem } = outer
        return () => h(CollectionSlot, null, () => h('div', [
          h(CollectionItem, { value: 'outer-1' }, () => h('div', [h(Inner)])),
          h(CollectionItem, { value: 'outer-2' }, () => h('div')),
        ]))
      },
    })
    const wrapper = mount(Outer, { attachTo: document.body })
    await nextTick()
    expect(values(outer.getItems())).toEqual(['outer-1', 'outer-2'])
    expect(values(inner.getItems())).toEqual(['inner-1', 'inner-2'])

    showInner.value = false
    await nextTick()
    expect(values(outer.getItems())).toEqual(['outer-1', 'outer-2'])
    expect(values(inner.getItems())).toEqual(['inner-1'])

    wrapper.unmount()
  })

  it('should re-run a computed that reads the items when one registers or unregisters', async () => {
    const { getCollection, wrapper, items } = createWrapper([{ value: 'a' }, { value: 'b' }])
    await nextTick()
    const { getItems } = getCollection()
    const count = computed(() => getItems().length)
    expect(count.value).toBe(2)
    // Read again so the cached order is what the computed last saw.
    expect(count.value).toBe(2)

    items.push({ value: 'c' })
    await nextTick()
    expect(count.value).toBe(3)

    items.splice(0, 2)
    await nextTick()
    expect(count.value).toBe(1)

    wrapper.unmount()
  })

  it('should follow the root when the CollectionSlot element is replaced', async () => {
    const tag = ref('div')
    let collection!: ReturnType<typeof useCollection>
    const Parent = defineComponent({
      setup() {
        collection = useCollection({ key: 'swap', isProvider: true })
        const { CollectionSlot, CollectionItem } = collection
        return () => h(CollectionSlot, null, () => h(tag.value, { key: tag.value }, [
          h(CollectionItem, { value: 'a' }, () => h('div')),
          h(CollectionItem, { value: 'b' }, () => h('div')),
        ]))
      },
    })
    const wrapper = mount(Parent, { attachTo: document.body })
    await nextTick()
    expect(values(collection.getItems())).toEqual(['a', 'b'])

    tag.value = 'section'
    await nextTick()
    await nextTick()
    expect(wrapper.element.tagName).toBe('SECTION')
    expect(values(collection.getItems())).toEqual(['a', 'b'])
    expect(collection.getItems()[0].ref.parentElement).toBe(wrapper.element)

    wrapper.unmount()
    expect(collection.getItems()).toEqual([])
  })

  it('should share one CollectionItem definition between the callers under a provider', async () => {
    const seen = new Set<unknown>()
    let provided!: ReturnType<typeof useCollection>
    const Child = defineComponent({
      setup() {
        const { CollectionItem, getItems, reactiveItems } = useCollection({ key: 'shared' })
        seen.add(CollectionItem)
        expect(getItems).toBe(provided.getItems)
        expect(reactiveItems).toBe(provided.reactiveItems)
        return () => h(CollectionItem, null, () => h('div'))
      },
    })
    const Parent = defineComponent({
      setup() {
        provided = useCollection({ key: 'shared', isProvider: true })
        return () => h(provided.CollectionSlot, null, () => h('div', [h(Child), h(Child), h(Child)]))
      },
    })
    const wrapper = mount(Parent, { attachTo: document.body })
    await nextTick()
    expect(seen.size).toBe(1)
    expect(provided.getItems()).toHaveLength(3)

    wrapper.unmount()
  })
})

describe('given a MutationObserver that does not report', () => {
  const RealObserver = globalThis.MutationObserver
  const values = (items: { value?: any }[]) => items.map(i => i.value)

  afterEach(() => vi.unstubAllGlobals())

  const stubs = {
    'a no-op stub': class {
      observe() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    },
    'a stub without takeRecords': class {
      observe() {}
      disconnect() {}
    },
    'an observer whose takeRecords always returns nothing': class extends RealObserver {
      takeRecords() {
        return []
      }
    },
    'a constructor that throws': class {
      constructor() {
        throw new Error('not supported')
      }
    },
  }

  describe.each(Object.entries(stubs))('%s', (_, Stub) => {
    it('should follow a keyed reorder in getItems()', async () => {
      vi.stubGlobal('MutationObserver', Stub)
      const { getCollection, wrapper, items } = createWrapper([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
      await nextTick()
      const { getItems } = getCollection()
      expect(values(getItems())).toEqual(['a', 'b', 'c'])
      expect(values(getItems())).toEqual(['a', 'b', 'c'])

      items.reverse()
      await nextTick()
      expect(values(getItems())).toEqual(['c', 'b', 'a'])

      items[1].disabled = true
      await nextTick()
      expect(values(getItems())).toEqual(['c', 'a'])
      expect(values(getItems(true))).toEqual(['c', 'b', 'a'])

      wrapper.unmount()
    })

    it('should move with the arrow keys in the new order after a reorder', async () => {
      vi.stubGlobal('MutationObserver', Stub)
      const list = ref(['a', 'b', 'c'])
      const wrapper = mount(defineComponent({
        components: { ToggleGroupRoot, ToggleGroupItem },
        setup: () => ({ list }),
        template: `<ToggleGroupRoot type="single"><ToggleGroupItem v-for="i in list" :key="i" :value="i">{{ i }}</ToggleGroupItem></ToggleGroupRoot>`,
      }), { attachTo: document.body })
      await nextTick()
      const press = async (key: string) => {
        document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
        await nextTick()
        await nextTick()
      }
      const button = (text: string) => wrapper.findAll('button').find(b => b.text() === text)!.element as HTMLElement

      button('a').focus()
      await press('ArrowRight')
      expect(document.activeElement?.textContent).toBe('b')

      list.value = ['c', 'b', 'a']
      await nextTick()
      button('c').focus()
      await press('ArrowRight')
      expect(document.activeElement?.textContent).toBe('b')
      await press('ArrowRight')
      expect(document.activeElement?.textContent).toBe('a')

      wrapper.unmount()
    })
  })

  it('should stop caching when the global is stubbed after the order was cached, and cache again once restored', async () => {
    const { getCollection, wrapper, items } = createWrapper([{ value: 'a' }, { value: 'b' }, { value: 'c' }])
    await nextTick()
    const { getItems } = getCollection()
    const query = vi.spyOn(document.querySelector('[data-testid=collection-root]')!, 'querySelectorAll')
    expect(values(getItems())).toEqual(['a', 'b', 'c'])
    expect(values(getItems())).toEqual(['a', 'b', 'c'])
    expect(query).toHaveBeenCalledTimes(1)

    vi.stubGlobal('MutationObserver', stubs['a stub without takeRecords'])
    items.reverse()
    await nextTick()
    expect(values(getItems())).toEqual(['c', 'b', 'a'])
    items.reverse()
    await nextTick()
    expect(values(getItems())).toEqual(['a', 'b', 'c'])

    vi.unstubAllGlobals()
    query.mockClear()
    expect(values(getItems())).toEqual(['a', 'b', 'c'])
    expect(values(getItems())).toEqual(['a', 'b', 'c'])
    expect(query).toHaveBeenCalledTimes(1)
    items.reverse()
    await nextTick()
    expect(values(getItems())).toEqual(['c', 'b', 'a'])

    wrapper.unmount()
  })
})

describe('given an item that leaves a wrapper detached in the same task', () => {
  it('should put the item, now outside the root, first', async () => {
    let collection!: ReturnType<typeof useCollection>
    const Parent = defineComponent({
      setup() {
        collection = useCollection({ key: 'detached', isProvider: true })
        const { CollectionSlot, CollectionItem } = collection
        return () => h(CollectionSlot, null, () => h('div', [
          h(CollectionItem, { value: 'a' }, () => h('span')),
          h('section', [h(CollectionItem, { value: 'b' }, () => h('span', { id: 'detached-b' }))]),
          h(CollectionItem, { value: 'c' }, () => h('span')),
        ]))
      },
    })
    const wrapper = mount(Parent, { attachTo: document.body })
    await nextTick()
    const values = () => collection.getItems().map(i => i.value)
    expect(values()).toEqual(['a', 'b', 'c'])

    const section = wrapper.element.querySelector('section')!
    const item = document.getElementById('detached-b')!
    const next = section.nextSibling
    wrapper.element.removeChild(section)
    section.removeChild(item)
    document.body.appendChild(item)
    wrapper.element.insertBefore(section, next)

    expect(values()).toEqual(['b', 'a', 'c'])
    await new Promise(resolve => setTimeout(resolve))
    expect(values()).toEqual(['b', 'a', 'c'])

    item.remove()
    wrapper.unmount()
  })
})
