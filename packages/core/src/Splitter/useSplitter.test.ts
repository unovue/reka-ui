import type { VueWrapper } from '@vue/test-utils'
import type { PanelGroupStorage } from '.'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, mergeProps, nextTick, ref } from 'vue'
import { SplitterGroup, SplitterPanel, SplitterResizeHandle, useSplitter, useSplitterPanel, useSplitterResizeHandle } from '.'
import * as Reka from '../index'

const axeRules = { rules: { 'label': { enabled: false }, 'nested-interactive': { enabled: false } } }

let wrapper: VueWrapper<any> | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function panelSize(id: string) {
  return document.querySelector(`[data-panel-id="${id}"]`)!.getAttribute('data-panel-size')
}

async function flush() {
  await nextTick()
  await nextTick()
}

describe('useSplitter — standalone', () => {
  const Standalone = defineComponent({
    props: { onUpdate: Function, onLayout: Function },
    setup(props) {
      const groupEl = ref<HTMLElement | null>(null)
      const handleEl = ref<HTMLElement | null>(null)
      const splitter = useSplitter({
        id: 'g',
        direction: 'horizontal',
        element: groupEl,
        onUpdate: (value, details) => props.onUpdate?.(value, details),
        onLayout: value => props.onLayout?.(value),
      })
      const a = useSplitterPanel(splitter.context, { id: 'a', minSize: 20 })
      const handle = useSplitterResizeHandle(splitter.context, { id: 'h', element: handleEl })
      const b = useSplitterPanel(splitter.context, { id: 'b' })
      return () => h('div', mergeProps(splitter.root.attrs.value, { ref: groupEl }), [
        h('div', a.root.attrs.value, 'A'),
        h('div', mergeProps(handle.root.attrs.value, { ref: handleEl })),
        h('div', b.root.attrs.value, 'B'),
      ])
    },
  })

  it('renders on plain elements and passes axe', async () => {
    wrapper = mount(Standalone, { attachTo: document.body })
    await flush()
    const group = wrapper.find('[data-panel-group]')
    expect(group.attributes('data-orientation')).toBe('horizontal')
    expect(group.attributes('data-panel-group-id')).toBe('g')
    expect(wrapper.find('#h').attributes()).toMatchObject({ 'role': 'separator', 'data-state': 'inactive', 'data-orientation': 'horizontal' })
    expect(panelSize('a')).toBe('50.0')
    expect(await axe(wrapper.element, axeRules)).toHaveNoViolations()
  })

  it('reports the initial layout as `panel-change` and resizes from the keyboard', async () => {
    const onUpdate = vi.fn()
    const onLayout = vi.fn()
    wrapper = mount(Standalone, { attachTo: document.body, props: { onUpdate, onLayout } })
    await flush()
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][0]).toEqual([50, 50])
    expect(onUpdate.mock.calls[0][1].reason).toBe('panel-change')
    expect(onLayout).toHaveBeenLastCalledWith([50, 50])

    await fireEvent.keyDown(wrapper.find('#h').element, { key: 'ArrowRight' })
    expect(onUpdate).toHaveBeenCalledTimes(2)
    const [value, details] = onUpdate.mock.calls[1]
    expect(value).toEqual([60, 40])
    expect(details.reason).toBe('keyboard')
    expect(details.event).toBeInstanceOf(KeyboardEvent)
    await nextTick()
    expect(panelSize('a')).toBe('60.0')
  })
})

describe('splitterGroup — layout model', () => {
  function mountGroup(groupProps: Record<string, any> = {}, panelA: Record<string, any> = {}) {
    const Test = defineComponent({
      setup() {
        return () => h(SplitterGroup, { direction: 'horizontal', ...groupProps }, () => [
          h(SplitterPanel, { id: 'a', minSize: 20, ...panelA }),
          h(SplitterResizeHandle, { id: 'h' }),
          h(SplitterPanel, { id: 'b' }),
        ])
      },
    })
    wrapper = mount(Test, { attachTo: document.body })
    return wrapper.findComponent(SplitterGroup)
  }
  const handle = () => document.getElementById('h')!

  it('emits beforeUpdate:layout then update:layout with details, and keeps @layout', async () => {
    const calls: string[] = []
    const group = mountGroup({
      'onBeforeUpdate:layout': () => calls.push('before'),
      'onUpdate:layout': () => calls.push('update'),
      'onLayout': () => calls.push('layout'),
    })
    await flush()
    expect(calls).toEqual(['before', 'update', 'layout'])

    await fireEvent.keyDown(handle(), { key: 'ArrowLeft' })
    expect(group.emitted('update:layout')!.at(-1)![0]).toEqual([40, 60])
    expect((group.emitted('update:layout')!.at(-1)![1] as any).reason).toBe('keyboard')
    expect(group.emitted('layout')!.at(-1)![0]).toEqual([40, 60])
  })

  it('does not emit when the layout does not change', async () => {
    const group = mountGroup()
    await flush()
    await fireEvent.keyDown(handle(), { key: 'Home' }) // a → minSize 20
    expect(group.emitted('update:layout')).toHaveLength(2)
    await fireEvent.keyDown(handle(), { key: 'Home' }) // already at min
    await fireEvent.keyDown(handle(), { key: 'ArrowLeft' })
    expect(group.emitted('update:layout')).toHaveLength(2)
    expect(group.emitted('layout')).toHaveLength(2)
  })

  it('details.cancel() in beforeUpdate:layout vetoes a keyboard resize', async () => {
    const group = mountGroup({
      'onBeforeUpdate:layout': (_value: number[], details: any) => {
        if (details.reason === 'keyboard')
          details.cancel()
      },
    })
    await flush()
    await fireEvent.keyDown(handle(), { key: 'ArrowRight' })
    await nextTick()
    expect(panelSize('a')).toBe('50.0')
    expect(group.emitted('update:layout')).toHaveLength(1)
    expect(group.emitted('layout')).toHaveLength(1)
  })

  it('controlled: the parent decides, and v-model:layout follows', async () => {
    const model = ref<number[] | undefined>([30, 70])
    const Test = defineComponent({
      setup() {
        return () => h(SplitterGroup, {
          'direction': 'horizontal',
          'layout': model.value,
          'onUpdate:layout': (value: number[]) => {
            model.value = value
          },
        }, () => [
          h(SplitterPanel, { id: 'a', minSize: 20 }),
          h(SplitterResizeHandle, { id: 'h' }),
          h(SplitterPanel, { id: 'b' }),
        ])
      },
    })
    wrapper = mount(Test, { attachTo: document.body })
    await flush()
    // The controlled layout wins over the panels' default sizes, without an emit.
    expect(panelSize('a')).toBe('30.0')
    expect(wrapper.findComponent(SplitterGroup).emitted('update:layout')).toBeUndefined()

    await fireEvent.keyDown(handle(), { key: 'ArrowRight' })
    await flush()
    expect(model.value).toEqual([40, 60])
    expect(panelSize('a')).toBe('40.0')

    // The parent moves the layout itself.
    model.value = [70, 30]
    await flush()
    expect(panelSize('a')).toBe('70.0')
  })

  it('controlled without an update handler does not move', async () => {
    const group = mountGroup({ layout: [30, 70] })
    await flush()
    await fireEvent.keyDown(handle(), { key: 'ArrowRight' })
    await flush()
    expect(group.emitted('update:layout')![0][0]).toEqual([40, 60])
    expect(panelSize('a')).toBe('30.0')
  })

  it('uncontrolled v-model:layout starting undefined takes the initial layout', async () => {
    const model = ref<number[]>()
    const Test = defineComponent({
      setup() {
        return () => h(SplitterGroup, {
          'direction': 'horizontal',
          'layout': model.value,
          'onUpdate:layout': (value: number[]) => {
            model.value = value
          },
        }, () => [h(SplitterPanel, { id: 'a' }), h(SplitterResizeHandle, { id: 'h' }), h(SplitterPanel, { id: 'b' })])
      },
    })
    wrapper = mount(Test, { attachTo: document.body })
    await flush()
    expect(model.value).toEqual([50, 50])
    await fireEvent.keyDown(handle(), { key: 'ArrowRight' })
    await flush()
    expect(model.value).toEqual([60, 40])
    expect(panelSize('a')).toBe('60.0')
  })
})

describe('splitterPanel — collapse', () => {
  function mountCollapsible(groupProps: Record<string, any> = {}) {
    const Test = defineComponent({
      setup() {
        return () => h(SplitterGroup, { direction: 'horizontal', ...groupProps }, () => [
          h(SplitterPanel, { id: 'a', ref: 'a', collapsible: true, collapsedSize: 5, minSize: 20, defaultSize: 40 }),
          h(SplitterResizeHandle, { id: 'h' }),
          h(SplitterPanel, { id: 'b' }),
        ])
      },
    })
    wrapper = mount(Test, { attachTo: document.body })
    return wrapper.findComponent(SplitterGroup)
  }

  it('collapse() / expand() report `imperative-action` and fire the panel events', async () => {
    const group = mountCollapsible()
    await flush()
    const panel = wrapper!.findAllComponents(SplitterPanel)[0]
    const exposed = wrapper!.vm.$refs.a as any

    exposed.collapse()
    await nextTick()
    expect(panelSize('a')).toBe('5.0')
    expect(document.getElementById('a')!.getAttribute('data-state')).toBe('closed')
    expect((group.emitted('update:layout')!.at(-1)![1] as any).reason).toBe('imperative-action')
    expect(panel.emitted('collapse')).toHaveLength(1)

    exposed.expand()
    await nextTick()
    expect(panelSize('a')).toBe('40.0')
    expect(panel.emitted('expand')).toHaveLength(2) // initial mount + expand
  })

  it('enter on the handle toggles the collapse as a keyboard change', async () => {
    const group = mountCollapsible()
    await flush()
    const panel = wrapper!.findAllComponents(SplitterPanel)[0]

    await fireEvent.keyDown(document.getElementById('h')!, { key: 'Enter' })
    await nextTick()
    expect(panelSize('a')).toBe('5.0')
    expect((group.emitted('update:layout')!.at(-1)![1] as any).reason).toBe('keyboard')
    expect(group.emitted('layout')!.at(-1)![0]).toEqual([5, 95])
    expect(panel.emitted('collapse')).toHaveLength(1)

    await fireEvent.keyDown(document.getElementById('h')!, { key: 'Enter' })
    await nextTick()
    expect(panelSize('a')).toBe('20.0')
  })

  it('a cancelled collapse leaves the panel open', async () => {
    mountCollapsible({ 'onBeforeUpdate:layout': (_v: number[], details: any) => details.reason === 'imperative-action' && details.cancel() })
    await flush()
    ;(wrapper!.vm.$refs.a as any).collapse()
    await nextTick()
    expect(panelSize('a')).toBe('40.0')
    expect(document.getElementById('a')!.getAttribute('data-state')).toBe('open')
  })
})

describe('splitterGroup — storage', () => {
  function createStorage(initial: Record<string, string> = {}): PanelGroupStorage & { data: Record<string, string> } {
    const data = { ...initial }
    return {
      data,
      getItem: name => data[name] ?? null,
      setItem: (name, value) => {
        data[name] = value
      },
    }
  }

  function mountPersisted(storage: PanelGroupStorage) {
    const Test = defineComponent({
      setup() {
        return () => h(SplitterGroup, { direction: 'horizontal', autoSaveId: 'persist', storage }, () => [
          h(SplitterPanel, { id: 'a', minSize: 20 }),
          h(SplitterResizeHandle, { id: 'h' }),
          h(SplitterPanel, { id: 'b' }),
        ])
      },
    })
    wrapper = mount(Test, { attachTo: document.body })
    return wrapper.findComponent(SplitterGroup)
  }

  it('saves the layout after a resize and restores it on the next mount', async () => {
    const storage = createStorage()
    mountPersisted(storage)
    await flush()
    await fireEvent.keyDown(document.getElementById('h')!, { key: 'ArrowRight' })
    await nextTick()

    await vi.waitFor(() => {
      expect(JSON.parse(storage.data['reka:persist'] ?? '{}')['a,b']?.layout).toEqual([60, 40])
    })

    wrapper!.unmount()
    wrapper = undefined
    document.body.innerHTML = ''

    const group = mountPersisted(storage)
    await flush()
    expect(panelSize('a')).toBe('60.0')
    const [value, details] = group.emitted('update:layout')![0] as [number[], any]
    expect(value).toEqual([60, 40])
    expect(details.reason).toBe('panel-change')
  })
})

describe('useSplitter — public export', () => {
  it('is exported from the package barrel', () => {
    expect(typeof Reka.useSplitter).toBe('function')
    expect(typeof Reka.useSplitterPanel).toBe('function')
    expect(typeof Reka.useSplitterResizeHandle).toBe('function')
  })
})
