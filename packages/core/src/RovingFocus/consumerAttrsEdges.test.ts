import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { MenubarContent, MenubarItem, MenubarMenu, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { ToolbarButton, ToolbarRoot } from '@/Toolbar'

// `consumerAttrs` edge cases: consumer attrs on a part that replaced its
// `<RovingFocusGroup as-child>` wrapper behave as they did on the wrapper.

async function press(key: string) {
  ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await nextTick()
  await nextTick()
}
afterEach(() => {
  document.body.innerHTML = ''
})

describe('roving consumer attrs: edge cases', () => {
  // `@entry-focus.once` compiles to `onEntryFocusOnce`. RovingFocusGroup
  // declared `entryFocus`, so Vue routed it to the emit, once.
  it('toolbarRoot @entry-focus.once is called on the first entry focus', async () => {
    let calls = 0
    const w = mount(defineComponent({
      setup: () => () => h(ToolbarRoot, { id: 'tb', onEntryFocusOnce: () => { calls++ } }, () => ['a', 'b'].map(v => h(ToolbarButton, null, () => v))),
    }), { attachTo: document.body })
    await nextTick()
    document.getElementById('tb')!.focus()
    await nextTick()
    expect(calls).toBe(1)
    w.unmount()
  })

  // MenubarRoot wrapped RovingFocusGroup in CollectionSlot, whose Slot merges
  // the consumer attrs UNDER the child's props: Menubar's own
  // `orientation="horizontal"` and `v-model:current-tab-stop-id` win.
  it('menubarRoot ignores a consumer orientation (ArrowRight still moves between triggers)', async () => {
    const w = mount(defineComponent({
      setup: () => () => h(MenubarRoot, { id: 'mb', orientation: 'vertical' }, () => ['a', 'b', 'c'].map(v =>
        h(MenubarMenu, { value: v }, () => [h(MenubarTrigger, null, () => v), h(MenubarContent, null, () => h(MenubarItem, null, () => `${v}1`))]))),
    }), { attachTo: document.body })
    await nextTick()
    expect(document.getElementById('mb')!.getAttribute('data-orientation')).toBe('horizontal')
    const triggers = [...document.querySelectorAll<HTMLElement>('[role=menuitem]')]
    triggers[0].focus()
    await press('ArrowRight')
    expect(document.activeElement).toBe(triggers[1])
    w.unmount()
  })

  it('menubarRoot keeps a tab stop when a consumer passes current-tab-stop-id=null', async () => {
    const w = mount(defineComponent({
      setup: () => () => h(MenubarRoot, { id: 'mb', currentTabStopId: null }, () => ['a', 'b', 'c'].map(v =>
        h(MenubarMenu, { value: v }, () => [h(MenubarTrigger, null, () => v), h(MenubarContent, null, () => h(MenubarItem, null, () => `${v}1`))]))),
    }), { attachTo: document.body })
    await nextTick()
    const triggers = [...document.querySelectorAll<HTMLElement>('[role=menuitem]')]
    triggers[2].focus()
    await nextTick()
    // Tab back into the menubar must land on a trigger: one of them is the tab stop.
    expect(triggers.map(t => t.getAttribute('tabindex'))).toContain('0')
    w.unmount()
  })

  // The wrapper's passive `v-model` emitted `update:currentTabStopId` only
  // when the tab stop changed.
  it('tabsList @update:current-tab-stop-id fires only when the tab stop changes', async () => {
    const values: unknown[] = []
    const w = mount(defineComponent({
      setup: () => () => h(TabsRoot, { defaultValue: 'a' }, () => [
        h(TabsList, { 'id': 'tl', 'onUpdate:currentTabStopId': (v: unknown) => values.push(v) }, () => ['a', 'b'].map(v => h(TabsTrigger, { value: v }, () => v))),
        h(TabsContent, { value: 'a' }, () => 'A'),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    const tabs = [...document.querySelectorAll<HTMLElement>('[role=tab]')]
    tabs[0].focus()
    await nextTick()
    tabs[0].blur()
    tabs[0].focus() // same tab again
    await nextTick()
    expect(values.length).toBe(1)
    w.unmount()
  })

  it('tabsList @update:current-tab-stop-id.once fires on the first change only', async () => {
    const values: unknown[] = []
    const w = mount(defineComponent({
      setup: () => () => h(TabsRoot, { defaultValue: 'a' }, () => [
        h(TabsList, { 'onUpdate:currentTabStopIdOnce': (v: unknown) => values.push(v) }, () => ['a', 'b'].map(v => h(TabsTrigger, { value: v }, () => v))),
        h(TabsContent, { value: 'a' }, () => 'A'),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    const tabs = [...document.querySelectorAll<HTMLElement>('[role=tab]')]
    tabs[0].focus()
    await nextTick()
    tabs[1].focus()
    await nextTick()
    expect(values.length).toBe(1)
    w.unmount()
  })

  // RovingFocusGroup's listeners ran through Vue's `emit`: one failing reaches
  // the app's errorHandler and stops neither the other listeners nor the group.
  describe.each([
    ['throws', () => {
      throw new Error('boom')
    }],
    ['rejects', () => Promise.reject(new Error('boom'))],
  ] as const)('a listener that %s', (_, fail) => {
    const options = (errors: string[]) => ({
      attachTo: document.body,
      global: { config: { errorHandler: (error: unknown) => errors.push((error as Error).message) } },
    })
    const settled = async () => {
      await nextTick()
      await nextTick()
    }

    it('toolbarRoot @entry-focus: focus still enters the group, `.once` still runs', async () => {
      const errors: string[] = []
      let once = 0
      const w = mount(defineComponent({
        setup: () => () => h(ToolbarRoot, { id: 'tb', onEntryFocus: fail, onEntryFocusOnce: () => { once++ } }, () => ['a', 'b'].map(v => h(ToolbarButton, { id: v }, () => v))),
      }), options(errors))
      await nextTick()
      document.getElementById('tb')!.focus()
      await settled()
      expect(document.activeElement).toBe(document.getElementById('a'))
      expect(once).toBe(1)
      expect(errors).toEqual(['boom'])
      w.unmount()
    })

    it('tabsList @update:current-tab-stop-id: `.once` still runs', async () => {
      const errors: string[] = []
      let once = 0
      const w = mount(defineComponent({
        setup: () => () => h(TabsRoot, { defaultValue: 'a' }, () => [
          h(TabsList, { 'onUpdate:currentTabStopId': fail, 'onUpdate:currentTabStopIdOnce': () => { once++ } }, () => ['a', 'b'].map(v => h(TabsTrigger, { value: v }, () => v))),
          h(TabsContent, { value: 'a' }, () => 'A'),
        ]),
      }), options(errors))
      await nextTick()
      document.querySelector<HTMLElement>('[role=tab]')!.focus()
      await settled()
      expect(once).toBe(1)
      expect(errors).toEqual(['boom'])
      w.unmount()
    })

    // MenubarRoot's consumer listeners run before the group's own work.
    it('menubarRoot @update:current-tab-stop-id: the tab stop still moves', async () => {
      const errors: string[] = []
      const w = mount(defineComponent({
        setup: () => () => h(MenubarRoot, { 'onUpdate:currentTabStopId': fail }, () => ['a', 'b', 'c'].map(v =>
          h(MenubarMenu, { value: v }, () => [h(MenubarTrigger, null, () => v), h(MenubarContent, null, () => h(MenubarItem, null, () => `${v}1`))]))),
      }), options(errors))
      await nextTick()
      const triggers = [...document.querySelectorAll<HTMLElement>('[role=menuitem]')]
      triggers[2].focus()
      await settled()
      expect(triggers[2].getAttribute('tabindex')).toBe('0')
      expect(errors).toEqual(['boom'])
      w.unmount()
    })
  })
})
