import type { Component } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { CheckboxGroupRoot, CheckboxRoot } from '@/Checkbox'
import { MenubarMenu, MenubarRoot, MenubarTrigger } from '@/Menubar'
import { RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { RovingFocusGroup, RovingFocusItem } from '@/RovingFocus'
import { TabsList, TabsRoot, TabsTrigger } from '@/Tabs'
import { TagGroupItem, TagGroupRoot } from '@/TagGroup'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'
import { ToolbarButton, ToolbarRoot } from '@/Toolbar'
import { TreeItem, TreeRoot } from '@/Tree'

const group = { 'data-testid': 'group' }
const item = { 'data-testid': 'item' }
const values = ['a', 'b', 'c']

// Each renders a roving focus group with three items and no active item; `disabled` marks
// items that are not focusable.
const fixtures: Record<string, (disabled: string[]) => () => ReturnType<typeof h>> = {
  Toolbar: disabled => () => h(ToolbarRoot, group, () =>
    values.map(value => h(ToolbarButton, { ...item, disabled: disabled.includes(value) }, () => value))),
  Menubar: disabled => () => h(MenubarRoot, group, () =>
    values.map(value => h(MenubarMenu, { value }, () =>
      h(MenubarTrigger, { ...item, disabled: disabled.includes(value) }, () => value)))),
  Tree: disabled => () => h(TreeRoot as Component, { ...group, items: values.map(title => ({ title })), getKey: (i: { title: string }) => i.title }, {
    default: ({ flattenItems }: any) => flattenItems.map((i: any) =>
      h(TreeItem as Component, { ...item, key: i._id, ...i.bind, disabled: disabled.includes(i._id) }, () => i.value.title)),
  }),
  TagGroup: disabled => () => h(TagGroupRoot as Component, { ...group, 'aria-label': 'Tags' }, () =>
    values.map(value => h(TagGroupItem as Component, { ...item, value, disabled: disabled.includes(value) }, () => value))),
  RadioGroup: disabled => () => h(RadioGroupRoot, group, () =>
    values.map(value => h(RadioGroupItem, { ...item, value, disabled: disabled.includes(value) }, () => value))),
  ToggleGroup: disabled => () => h(ToggleGroupRoot, { ...group, type: 'single' }, () =>
    values.map(value => h(ToggleGroupItem, { ...item, value, disabled: disabled.includes(value) }, () => value))),
  ToggleGroupMultiple: disabled => () => h(ToggleGroupRoot, { ...group, type: 'multiple' }, () =>
    values.map(value => h(ToggleGroupItem, { ...item, value, disabled: disabled.includes(value) }, () => value))),
  Tabs: disabled => () => h(TabsRoot, null, () => h(TabsList, group, () =>
    values.map(value => h(TabsTrigger, { ...item, value, disabled: disabled.includes(value) }, () => value)))),
  CheckboxGroup: disabled => () => h(CheckboxGroupRoot, group, () =>
    values.map(value => h(CheckboxRoot, { ...item, value, disabled: disabled.includes(value) }, () => value))),
}

function tabindexes(container: HTMLElement) {
  return [
    container.querySelector('[data-testid="group"]')?.getAttribute('tabindex'),
    ...Array.from(container.querySelectorAll('[data-testid="item"]'), el => el.getAttribute('tabindex')),
  ]
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

// TODO(v3-port): #3369 these roots are outside the lists lane and do not call
// `provideRovingFocusNoActiveItem` / pass `noActiveItem` yet.
const PENDING_ROOTS = new Set<string>()

describe.each(Object.keys(fixtures))('%s with no active item', (name) => {
  async function renderAndHydrate(disabled: string[] = []) {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Fixture = defineComponent({ setup: () => fixtures[name](disabled) })

    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Fixture))
    document.body.append(container)
    const server = tabindexes(container)

    createSSRApp(Fixture).mount(container)
    await nextTick()
    const hydrated = tabindexes(container)

    expect(warn.mock.calls.flat().join('\n')).not.toContain('Hydration')
    expect(error.mock.calls.flat().join('\n')).not.toContain('Hydration')
    return { server, hydrated }
  }

  it.skipIf(PENDING_ROOTS.has(name))('makes the first item the tab stop in the server HTML, then hands it to the group', async () => {
    const { server, hydrated } = await renderAndHydrate()
    expect(server).toEqual(['-1', '0', '-1', '-1'])
    expect(hydrated).toEqual(['0', '-1', '-1', '-1'])
  })

  it.skipIf(PENDING_ROOTS.has(name))('skips an item that is not focusable', async () => {
    const { server, hydrated } = await renderAndHydrate(['a'])
    expect(server).toEqual(['-1', '-1', '0', '-1'])
    expect(hydrated).toEqual(['0', '-1', '-1', '-1'])
  })

  it('renders the same tabindexes as before once mounted on the client', async () => {
    const wrapper = mount(defineComponent({ setup: () => fixtures[name]([]) }), { attachTo: document.body })
    await nextTick()
    expect(tabindexes(wrapper.element.parentElement as HTMLElement)).toEqual(['0', '-1', '-1', '-1'])
    wrapper.unmount()
  })
})

describe('a group with a value that matches a later item', () => {
  it.each([
    ['RadioGroup', () => h(RadioGroupRoot, { ...group, defaultValue: 'b' }, () =>
      values.map(value => h(RadioGroupItem, { ...item, value }, () => value)))],
    ['Tabs', () => h(TabsRoot, { defaultValue: 'b' }, () => h(TabsList, group, () =>
      values.map(value => h(TabsTrigger, { ...item, value }, () => value))))],
    ['ToggleGroup', () => h(ToggleGroupRoot, { ...group, type: 'multiple', defaultValue: ['b', 'c'] }, () =>
      values.map(value => h(ToggleGroupItem, { ...item, value }, () => value)))],
  ])('%s keeps the active item as the only tab stop in the server HTML', async (_, render) => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(defineComponent({ setup: () => render })))
    expect(tabindexes(container)).toEqual(['-1', '-1', '0', '-1'])
  })
})

describe('a root without roving focus', () => {
  const directGroup = () => h(RovingFocusGroup, group, () => [
    h(RovingFocusItem, item, () => 'a'),
    h(RovingFocusItem, { ...item, active: true }, () => 'b'),
  ])

  it.each([
    ['CheckboxGroup', () => h(CheckboxGroupRoot, { rovingFocus: false }, directGroup)],
    ['ToggleGroup', () => h(ToggleGroupRoot, { type: 'single', rovingFocus: false }, directGroup)],
  ])('%s does not pass its hint to a group below it', async (_, render) => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(defineComponent({ setup: () => render })))
    expect(tabindexes(container)).toEqual(['-1', '-1', '0'])
  })
})
