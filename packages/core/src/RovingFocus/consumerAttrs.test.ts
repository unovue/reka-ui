import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { TagGroupItem, TagGroupRoot } from '@/TagGroup'

// Attrs named after a RovingFocusGroup prop or event fell through to the
// `<RovingFocusGroup as-child>` wrapper the roots used to render, and
// configured it. The roots that call `useRovingFocusGroup` keep that.

async function press(key: string) {
  ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await nextTick()
  await nextTick()
}

describe('roving group props as consumer attrs', () => {
  it('tabsList dir="rtl" sets the list direction and flips the arrow keys', async () => {
    const w = mount(defineComponent({
      setup: () => () => h(TabsRoot, { defaultValue: 'a' }, () => [
        h(TabsList, { dir: 'rtl' }, () => ['a', 'b', 'c'].map(v => h(TabsTrigger, { value: v }, () => v))),
        h(TabsContent, { value: 'a' }, () => 'A'),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    expect(w.find('[role=tablist]').attributes('dir')).toBe('rtl')
    const tabs = [...document.querySelectorAll<HTMLElement>('[role=tab]')]
    tabs[0].focus()
    await press('ArrowLeft')
    expect(document.activeElement).toBe(tabs[1])
    w.unmount()
  })

  it('tagGroupRoot orientation="horizontal" stops ArrowDown from moving', async () => {
    const w = mount(defineComponent({
      setup: () => () => h(TagGroupRoot, { orientation: 'horizontal' }, () => ['a', 'b', 'c'].map(v => h(TagGroupItem, { value: v }, () => v))),
    }), { attachTo: document.body })
    await nextTick()
    const tags = [...document.querySelectorAll<HTMLElement>('[data-reka-collection-item]')]
    tags[0].focus()
    await press('ArrowDown')
    expect(document.activeElement).toBe(tags[0])
    w.unmount()
  })

  it('they configure the group without rendering on the element', async () => {
    const w = mount(defineComponent({
      setup: () => () => h(TabsRoot, { defaultValue: 'a' }, () => [
        h(TabsList, { 'orientation': 'vertical', 'loop': false, 'prevent-scroll-on-entry-focus': '' }, () => ['a', 'b'].map(v => h(TabsTrigger, { value: v }, () => v))),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    const list = w.find('[role=tablist]')
    expect(list.attributes('orientation')).toBeUndefined()
    expect(list.attributes('loop')).toBeUndefined()
    expect(list.attributes('prevent-scroll-on-entry-focus')).toBeUndefined()
    // The roving group's own `data-orientation` follows the consumer's.
    expect(list.attributes('data-orientation')).toBe('vertical')
    const tabs = [...document.querySelectorAll<HTMLElement>('[role=tab]')]
    tabs[1].focus()
    // `loop: false`: no wrap from the last tab.
    await press('ArrowDown')
    expect(document.activeElement).toBe(tabs[1])
    w.unmount()
  })

  it('a `v-model:current-tab-stop-id` and an `@entry-focus` reach the group', async () => {
    const stop = ref<string | null | undefined>()
    const onEntryFocus = vi.fn()
    const w = mount(defineComponent({
      setup: () => () => h(TabsRoot, { defaultValue: 'a' }, () => [
        h(TabsList, {
          'currentTabStopId': stop.value,
          'onUpdate:currentTabStopId': (value: string | null | undefined) => { stop.value = value },
          onEntryFocus,
        }, () => ['a', 'b'].map(v => h(TabsTrigger, { value: v }, () => v))),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    const tabs = [...document.querySelectorAll<HTMLElement>('[role=tab]')]
    tabs[1].focus()
    await nextTick()
    const second = stop.value
    expect(second).toEqual(expect.any(String))
    tabs[0].focus()
    await nextTick()
    expect(stop.value).toEqual(expect.any(String))
    expect(stop.value).not.toBe(second)
    const list = w.find('[role=tablist]').element as HTMLElement
    list.focus()
    expect(onEntryFocus).toHaveBeenCalledTimes(1)
    expect(list.getAttribute('currenttabstopid')).toBeNull()
    w.unmount()
  })
})
