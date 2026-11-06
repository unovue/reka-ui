// #2328: as Base UI's Tabs, an uncontrolled root selects the first enabled tab
// when there is no `defaultValue`, and falls back to it when the selected tab
// is removed or disabled. A controlled root keeps its value; `null` selects none.
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '.'

interface Tab { value: string, disabled?: boolean }

function mountTabs(rootProps: Record<string, unknown> = {}, initialTabs: Tab[] = [{ value: 'one' }, { value: 'two' }, { value: 'three' }]) {
  const tabs = ref<Tab[]>(initialTabs)
  const wrapper = mount(defineComponent({
    setup: () => () => h(TabsRoot, rootProps, () => [
      h(TabsList, () => tabs.value.map(tab => h(TabsTrigger, { key: tab.value, value: tab.value, disabled: tab.disabled }, () => tab.value))),
      ...tabs.value.map(tab => h(TabsContent, { key: tab.value, value: tab.value }, () => `content ${tab.value}`)),
    ]),
  }), { attachTo: document.body })
  const selected = () => wrapper.find('[role=tab][aria-selected=true]').exists() ? wrapper.find('[role=tab][aria-selected=true]').text() : null
  const panel = () => wrapper.find('[role=tabpanel]:not([hidden])').exists() ? wrapper.find('[role=tabpanel]:not([hidden])').text() : null
  const emitted = () => (wrapper.findComponent(TabsRoot).emitted('update:modelValue') ?? []) as [string, { reason: string }][]
  return { wrapper, tabs, selected, panel, emitted }
}

let current: ReturnType<typeof mountTabs> | undefined
afterEach(() => {
  current?.wrapper.unmount()
  current = undefined
  document.body.innerHTML = ''
})

describe('given uncontrolled Tabs without a defaultValue', () => {
  it('selects the first tab on mount and reports `initial`', async () => {
    current = mountTabs()
    await nextTick()
    expect(current.selected()).toBe('one')
    await flushPromises()
    expect(current.panel()).toBe('content one')
    expect(current.emitted()).toHaveLength(1)
    expect(current.emitted()[0][0]).toBe('one')
    expect(current.emitted()[0][1].reason).toBe('initial')
  })

  it('skips disabled tabs', async () => {
    current = mountTabs({}, [{ value: 'one', disabled: true }, { value: 'two', disabled: true }, { value: 'three' }])
    await nextTick()
    expect(current.selected()).toBe('three')
    expect(current.emitted()[0][1].reason).toBe('initial')
  })

  it('selects nothing when every tab is disabled', async () => {
    current = mountTabs({}, [{ value: 'one', disabled: true }, { value: 'two', disabled: true }])
    await nextTick()
    expect(current.selected()).toBeNull()
    expect(current.emitted()).toHaveLength(0)
  })

  it('selects the first tab of a list rendered later', async () => {
    current = mountTabs({}, [])
    await nextTick()
    expect(current.selected()).toBeNull()
    current.tabs.value = [{ value: 'one' }, { value: 'two' }]
    await nextTick()
    await nextTick()
    expect(current.selected()).toBe('one')
  })

  it('writes the selection back through v-model bound to `undefined`', async () => {
    const model = ref<string>()
    const wrapper = mount(defineComponent({
      setup: () => () => h(TabsRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (v: any) => { model.value = v } }, () =>
        h(TabsList, () => ['one', 'two'].map(value => h(TabsTrigger, { key: value, value }, () => value)))),
    }), { attachTo: document.body })
    await nextTick()
    expect(model.value).toBe('one')
    wrapper.unmount()
  })
})

describe('given uncontrolled Tabs with a selected tab', () => {
  it('falls back to the first enabled tab when the selected one is removed (`missing`)', async () => {
    current = mountTabs({ defaultValue: 'two' })
    await nextTick()
    expect(current.selected()).toBe('two')
    expect(current.emitted()).toHaveLength(0)
    current.tabs.value = [{ value: 'one' }, { value: 'three' }]
    await nextTick()
    await nextTick()
    expect(current.selected()).toBe('one')
    expect(current.emitted().at(-1)).toEqual(['one', expect.objectContaining({ reason: 'missing' })])
  })

  it('falls back when the selected tab becomes disabled (`disabled`)', async () => {
    current = mountTabs({ defaultValue: 'one' })
    await nextTick()
    current.tabs.value = [{ value: 'one', disabled: true }, { value: 'two' }, { value: 'three' }]
    await nextTick()
    await nextTick()
    expect(current.selected()).toBe('two')
    expect(current.emitted().at(-1)).toEqual(['two', expect.objectContaining({ reason: 'disabled' })])
  })

  it('falls back when the defaultValue matches no tab (`missing`)', async () => {
    current = mountTabs({ defaultValue: 'nope' })
    await nextTick()
    expect(current.selected()).toBe('one')
    expect(current.emitted()[0][1].reason).toBe('missing')
  })

  it('honours an explicit defaultValue pointing at a disabled tab', async () => {
    current = mountTabs({ defaultValue: 'one' }, [{ value: 'one', disabled: true }, { value: 'two' }])
    await nextTick()
    expect(current.selected()).toBe('one')
    expect(current.emitted()).toHaveLength(0)
  })

  it('selects no tab with `defaultValue: null`', async () => {
    current = mountTabs({ defaultValue: null })
    await nextTick()
    expect(current.selected()).toBeNull()
    expect(current.panel()).toBeNull()
    expect(current.emitted()).toHaveLength(0)
  })
})

describe('given controlled Tabs', () => {
  it('keeps a value that matches no tab', async () => {
    current = mountTabs({ modelValue: 'nope' })
    await nextTick()
    expect(current.selected()).toBeNull()
    expect(current.emitted()).toHaveLength(0)
  })

  it('keeps a disabled selected tab', async () => {
    current = mountTabs({ modelValue: 'one' }, [{ value: 'one', disabled: true }, { value: 'two' }])
    await nextTick()
    expect(current.selected()).toBe('one')
    expect(current.emitted()).toHaveLength(0)
  })

  it('selects no tab with `modelValue: null`', async () => {
    current = mountTabs({ modelValue: null })
    await nextTick()
    expect(current.selected()).toBeNull()
    expect(current.emitted()).toHaveLength(0)
  })
})

describe('given uncontrolled Tabs with a trigger in a KeepAlive branch', () => {
  it('skips the trigger while it is deactivated and counts it again once active', async () => {
    const showCached = ref(true)
    const tabs = ref(['selected'])
    const Cached = defineComponent({ name: 'Cached', setup: () => () => h(TabsTrigger, { value: 'cached' }, () => 'cached') })
    const wrapper = mount(defineComponent({
      setup: () => () => h(TabsRoot, { defaultValue: 'selected' }, () => h(TabsList, () => [
        h(KeepAlive, null, [showCached.value ? h(Cached) : null]),
        ...tabs.value.map(value => h(TabsTrigger, { key: value, value }, () => value)),
      ])),
    }), { attachTo: document.body })
    const root = wrapper.findComponent(TabsRoot)
    const selected = () => wrapper.find('[role=tab][aria-selected=true]').exists() ? wrapper.find('[role=tab][aria-selected=true]').text() : null
    await nextTick()
    expect(selected()).toBe('selected')

    showCached.value = false
    await nextTick()
    tabs.value = []
    await nextTick()
    await nextTick()
    // The cached trigger is out of the document: it is no fallback.
    expect(wrapper.findAll('[role=tab]')).toHaveLength(0)
    expect(root.emitted('update:modelValue')).toBeUndefined()

    // Active again, it is a fallback candidate again.
    showCached.value = true
    await nextTick()
    await nextTick()
    expect(selected()).toBe('cached')
    expect(root.emitted('update:modelValue')?.at(-1)?.[0]).toBe('cached')
    wrapper.unmount()
  })
})
