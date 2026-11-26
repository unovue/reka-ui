import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { RovingFocusGroup, RovingFocusItem } from '.'

// An item registers itself in the group's collection without a `CollectionItem` wrapper. The
// collection caches its DOM order, so a keyed reorder has to reach the arrow keys at once.

async function press(element: Element, key: string) {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  // The move is deferred to the next tick.
  await nextTick()
  await nextTick()
}

describe('roving focus after a keyed reorder', () => {
  it('follows the new order of `RovingFocusItem`s', async () => {
    const order = ref(['a', 'b', 'c', 'd'])
    const wrapper = mount(defineComponent({
      components: { RovingFocusGroup, RovingFocusItem },
      setup: () => ({ order }),
      template: `
<RovingFocusGroup orientation="horizontal">
  <RovingFocusItem v-for="id in order" :key="id" as="button" :id="id">{{ id }}</RovingFocusItem>
</RovingFocusGroup>`,
    }), { attachTo: document.body })
    await nextTick()
    const item = (id: string) => wrapper.find(`#${id}`).element as HTMLElement

    // Read the order once, so a cached one exists before the reorder.
    item('a').focus()
    await press(item('a'), 'ArrowRight')
    expect(document.activeElement).toBe(item('b'))

    order.value = ['a', 'd', 'c', 'b']
    await nextTick()
    item('a').focus()
    await press(item('a'), 'ArrowRight')
    expect(document.activeElement).toBe(item('d'))
    await press(item('d'), 'ArrowRight')
    expect(document.activeElement).toBe(item('c'))
    await press(item('c'), 'End')
    expect(document.activeElement).toBe(item('b'))

    // An added and a removed item are seen as well.
    order.value = ['e', 'a', 'd', 'c']
    await nextTick()
    item('a').focus()
    await press(item('a'), 'ArrowLeft')
    expect(document.activeElement).toBe(item('e'))
    await press(item('e'), 'End')
    expect(document.activeElement).toBe(item('c'))
    wrapper.unmount()
  })

  it('follows the new order of tab triggers', async () => {
    const order = ref(['a', 'b', 'c'])
    const wrapper = mount(defineComponent({
      components: { TabsRoot, TabsList, TabsTrigger },
      setup: () => ({ order }),
      template: `
<TabsRoot default-value="a" activation-mode="manual">
  <TabsList :loop="false">
    <TabsTrigger v-for="id in order" :key="id" :value="id" :data-tab="id">{{ id }}</TabsTrigger>
  </TabsList>
</TabsRoot>`,
    }), { attachTo: document.body })
    await nextTick()
    const tab = (id: string) => wrapper.find(`[data-tab="${id}"]`).element as HTMLElement

    tab('a').focus()
    await press(tab('a'), 'ArrowRight')
    expect(document.activeElement).toBe(tab('b'))

    order.value = ['c', 'b', 'a']
    await nextTick()
    await press(tab('b'), 'ArrowRight')
    expect(document.activeElement).toBe(tab('a'))
    await press(tab('a'), 'Home')
    expect(document.activeElement).toBe(tab('c'))
    wrapper.unmount()
  })
})
