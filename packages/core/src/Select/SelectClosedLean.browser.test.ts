// Regression (#3111 review): the closed lean items in real Chromium: release, moves at any depth, the native
// select at the moment autofill can arrive, and what `items` learns from a rendered item.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createApp, defineAsyncComponent, defineComponent, h, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { SelectContent, SelectGroup, SelectItem, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'

let app: ReturnType<typeof createApp> | undefined
let host: HTMLElement | undefined
let alive = 0
const Probe = defineComponent({
  setup() {
    onMounted(() => alive++)
    onUnmounted(() => alive--)
    return () => null
  },
})

afterEach(() => {
  vi.restoreAllMocks()
  app?.unmount()
  host?.remove()
  app = undefined
  alive = 0
})

const wait = (ms = 40) => new Promise(resolve => setTimeout(resolve, ms))
const SEARCH_RESET = 1100
const trigger = () => document.getElementById('trigger') as HTMLElement
const value = () => document.getElementById('value')?.textContent?.trim()
const native = () => document.querySelector('select') as HTMLSelectElement
const optionTexts = () => Array.from(native().options).map(option => option.textContent!.trim()).filter(Boolean)

function item(text: string, itemValue: unknown = text, disabled = false) {
  return h(SelectItem, { key: text, value: itemValue, disabled } as any, () => h(SelectItemText, () => [text, h(Probe)]))
}

/** A Select with its content from `content`, and a button to move focus to. */
function mountSelect(content: () => unknown, root: () => Record<string, unknown> = () => ({}), { form = false, triggerSlot }: { form?: boolean, triggerSlot?: () => unknown } = {}) {
  const log: unknown[] = []
  host = document.createElement('div')
  document.body.appendChild(host)
  const select = () => h(SelectRoot, { 'onUpdate:modelValue': (v: unknown) => log.push(v), ...root() } as any, () => [
    triggerSlot ? triggerSlot() : h(SelectTrigger, { 'id': 'trigger', 'aria-label': 'x' }, () => h(SelectValue, { id: 'value', placeholder: 'Pick' })),
    h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, content as any))),
  ])
  app = createApp(defineComponent({ setup: () => () => h('div', [form ? h('form', [select()]) : select(), h('button', { id: 'after', type: 'button' }, 'after')]) }))
  app.mount(host)
  return log
}

describe('release', () => {
  it('a real blur unmounts the lean items a key rendered, and a focus alone does not bring them back', async () => {
    mountSelect(() => ['Apple', 'Banana'].map(text => item(text)))
    await nextTick()
    trigger().focus()
    await wait()
    expect(alive).toBe(0)
    await userEvent.keyboard('z')
    await wait()
    expect(alive).toBe(2)
    await userEvent.tab()
    await wait()
    expect(document.activeElement?.id).toBe('after')
    expect(alive).toBe(0)
    trigger().focus()
    await wait()
    expect(alive).toBe(0)
  })

  it('focus moving out of a button inside a div trigger releases them', async () => {
    mountSelect(() => ['Apple', 'Banana'].map(text => item(text)), () => ({}), {
      triggerSlot: () => h(SelectTrigger, { 'as': 'div', 'aria-label': 'x' } as any, () => h('button', { id: 'inner', type: 'button' }, 'inner')),
    })
    await nextTick()
    document.getElementById('inner')!.focus()
    await userEvent.keyboard('z')
    await wait()
    expect(alive).toBe(2)
    document.getElementById('after')!.focus()
    await wait()
    expect(alive).toBe(0)
  })

  it('focus moving within a div trigger keeps them', async () => {
    mountSelect(() => ['Apple', 'Banana'].map(text => item(text)), () => ({}), {
      triggerSlot: () => h(SelectTrigger, { 'as': 'div', 'aria-label': 'x' } as any, () => [
        h('button', { id: 'inner', type: 'button' }, 'inner'),
        h('button', { id: 'inner-2', type: 'button' }, 'inner 2'),
      ]),
    })
    await nextTick()
    document.getElementById('inner')!.focus()
    await userEvent.keyboard('z')
    await wait()
    expect(alive).toBe(2)
    document.getElementById('inner-2')!.focus()
    await wait()
    expect(alive).toBe(2)
  })

  it('removing the name releases what the form held', async () => {
    const name = ref<string | undefined>('fruit')
    mountSelect(() => ['Apple', 'Banana'].map(text => item(text)), () => ({ name: name.value }), { form: true })
    await wait()
    expect(alive).toBe(2)
    name.value = undefined
    await wait()
    expect(alive).toBe(0)
  })

  it('an empty string value holds nothing', async () => {
    mountSelect(() => ['Apple', 'Banana'].map(text => item(text)), () => ({ modelValue: '' }))
    await wait()
    expect(alive).toBe(0)
    expect(value()).toBe('Pick')
  })
})

describe('moves at any depth, while the lean items are mounted', () => {
  it('re-sorted groups: typeahead and native options follow', async () => {
    const order = ref(['first', 'second'])
    const groups: Record<string, string> = { first: 'Avocado', second: 'Apple' }
    mountSelect(() => order.value.map(group => h(SelectGroup, { key: group }, () => item(groups[group]))), () => ({ name: 'fruit' }), { form: true })
    await wait()
    expect(optionTexts()).toEqual(['Avocado', 'Apple'])
    order.value = ['second', 'first']
    await wait()
    expect(optionTexts()).toEqual(['Apple', 'Avocado'])
    trigger().focus()
    await userEvent.keyboard('a')
    await wait()
    expect(value()).toBe('Apple')
  })

  it('re-sorted per-option wrappers, after a first read', async () => {
    const order = ref(['Avocado', 'Apple'])
    mountSelect(() => order.value.map(text => h('div', { key: text }, item(text))))
    await nextTick()
    trigger().focus()
    await userEvent.keyboard('z')
    await wait()
    order.value = ['Apple', 'Avocado']
    await wait(SEARCH_RESET)
    await userEvent.keyboard('a')
    await wait()
    expect(value()).toBe('Apple')
  })
})

describe('the native select of a named form', () => {
  it('has its options right after the mount, and takes an autofill then', async () => {
    const log = mountSelect(() => ['Apple', 'Banana'].map(text => item(text)), () => ({ name: 'fruit' }), { form: true })
    await nextTick()
    await nextTick()
    expect(optionTexts()).toEqual(['Apple', 'Banana'])
    native().value = 'Banana'
    native().dispatchEvent(new Event('input', { bubbles: true }))
    await wait()
    expect(log).toEqual(['Banana'])
    expect(value()).toBe('Banana')
  })

  it('fills in when `displayValue` is removed at runtime', async () => {
    const displayValue = ref<((v: string) => string) | undefined>((v: string) => v)
    mountSelect(() => ['Apple', 'Banana'].map(text => item(text)), () => ({ name: 'fruit', displayValue: displayValue.value }), { form: true })
    await wait()
    expect(optionTexts()).toEqual([])
    displayValue.value = undefined
    await wait()
    expect(optionTexts()).toEqual(['Apple', 'Banana'])
  })

  it('with `items`, cancels the idle render on unmount', async () => {
    const request = vi.spyOn(window, 'requestIdleCallback').mockImplementation(() => 4242)
    const cancel = vi.spyOn(window, 'cancelIdleCallback')
    mountSelect(() => [item('Apple')], () => ({ name: 'fruit', items: { Apple: 'Apple' } }), { form: true })
    await nextTick()
    expect(request.mock.calls.filter(call => call[1]?.timeout === 500)).toHaveLength(1)
    app!.unmount()
    app = undefined
    expect(cancel).toHaveBeenCalledWith(4242)
  })

  it('with `items`, cancels the idle render when the name goes, and schedules it when it returns', async () => {
    const request = vi.spyOn(window, 'requestIdleCallback').mockImplementation(() => 7)
    const cancel = vi.spyOn(window, 'cancelIdleCallback')
    const name = ref<string | undefined>('fruit')
    mountSelect(() => [item('Apple')], () => ({ name: name.value, items: { Apple: 'Apple' } }), { form: true })
    await nextTick()
    name.value = undefined
    await wait(10)
    expect(cancel).toHaveBeenCalledWith(7)
    name.value = 'other'
    await wait(10)
    expect(request.mock.calls.filter(call => call[1]?.timeout === 500)).toHaveLength(2)
  })
})

describe('what `items` learns from a rendered item', () => {
  it('a record over number values: an autofill writes the number, shown as selected', async () => {
    const model = ref<unknown>(undefined)
    mountSelect(() => [item('One', 1), item('Two', 2)], () => ({ 'name': 'n', 'items': { 1: 'One', 2: 'Two' }, 'modelValue': model.value, 'onUpdate:modelValue': (v: unknown) => { model.value = v } }), { form: true })
    await wait(800)
    native().value = '2'
    native().dispatchEvent(new Event('input', { bubbles: true }))
    await wait()
    expect(model.value).toBe(2)
    trigger().focus()
    await userEvent.keyboard('{Enter}')
    await wait(100)
    expect(Array.from(document.querySelectorAll('[role=option][aria-selected=true]')).map(option => option.textContent)).toEqual(['Two'])
  })

  it('a `disabled` SelectItem disables its native option', async () => {
    mountSelect(() => [item('Apple'), item('Banana', 'Banana', true)], () => ({ name: 'n', items: { Apple: 'Apple', Banana: 'Banana' } }), { form: true })
    await wait(800)
    expect(Array.from(native().options).find(option => option.textContent!.trim() === 'Banana')!.disabled).toBe(true)
  })

  it('a `disabled` SelectItem seen once is skipped by the data-first key after its release', async () => {
    const log = mountSelect(() => [item('Apple'), item('Banana', 'Banana', true)], () => ({ items: { Apple: 'Apple', Banana: 'Banana' } }))
    await nextTick()
    trigger().focus()
    await userEvent.keyboard('z')
    await wait()
    expect(alive).toBe(2)
    await userEvent.tab()
    await wait(SEARCH_RESET)
    expect(alive).toBe(0)
    trigger().focus()
    await userEvent.keyboard('b')
    await wait()
    expect(log).toEqual([])
  })

  it('repeating a key reaches an option only a SelectItem has', async () => {
    const log = mountSelect(() => ['Apple', 'Apricot', 'Avocado'].map(text => item(text)), () => ({ items: [{ value: 'Apple', label: 'Apple' }, { value: 'Apricot', label: 'Apricot' }] }))
    await nextTick()
    trigger().focus()
    for (let i = 0; i < 3; i++) {
      await userEvent.keyboard('a')
      await wait(20)
    }
    expect(log).toEqual(['Apple', 'Apricot', 'Avocado'])
  })
})

describe('the first key', () => {
  it('matches items that need more than the render\'s flush (an async wrapper)', async () => {
    const Row = defineAsyncComponent(() => new Promise<any>((resolve) => {
      setTimeout(() => resolve(defineComponent({ props: ['text'], setup: props => () => item(props.text) })), 20)
    }))
    const log = mountSelect(() => ['Apple', 'Banana'].map(text => h(Row, { key: text, text })))
    await wait(100)
    trigger().focus()
    await userEvent.keyboard('b')
    await wait(150)
    expect(log).toEqual(['Banana'])
  })

  it('does not select what arrives after the search reset', async () => {
    const list = ref<string[]>([])
    const log = mountSelect(() => list.value.map(text => item(text)))
    await nextTick()
    trigger().focus()
    await userEvent.keyboard('b')
    await wait(SEARCH_RESET)
    list.value = ['Banana']
    await wait()
    expect(log).toEqual([])
  })
})
