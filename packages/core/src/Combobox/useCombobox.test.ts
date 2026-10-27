import type { VueWrapper } from '@vue/test-utils'
import type { UseComboboxRootProps, UseComboboxRootReturn } from './useCombobox'
import type { ListboxFilterItem } from '@/Listbox/useListbox'
import { flushPromises, mount } from '@vue/test-utils'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { AutocompleteCancel, AutocompleteContent, AutocompleteInput, AutocompleteItem, AutocompleteRoot, AutocompleteViewport } from '@/Autocomplete'
import { sleep } from '@/test'
import { ComboboxAnchor, ComboboxCancel, ComboboxContent, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxRoot, ComboboxTrigger, ComboboxViewport, ComboboxVirtualizer } from '.'
import * as Reka from '../index'
import { useComboboxRoot } from './useCombobox'

window.HTMLElement.prototype.releasePointerCapture = vi.fn()
window.HTMLElement.prototype.hasPointerCapture = vi.fn()
window.HTMLElement.prototype.scrollIntoView = vi.fn()
window.HTMLElement.prototype.scrollTo = vi.fn()
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const fruits = ['Apple', 'Banana', 'Blueberry', 'Cherry', 'Grape']

async function settle() {
  await nextTick()
  await nextTick()
  await nextTick()
}

function optionTexts() {
  return Array.from(document.querySelectorAll('[role=option]'), el => el.textContent)
}

function keydown(target: Element, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

/** A plain Combobox; `rootProps` / `listeners` go on `ComboboxRoot`. */
function createCombobox(rootProps: Record<string, unknown> = {}, options: { cancel?: boolean, values?: string[] } = {}) {
  return defineComponent({
    setup() {
      return () => h(ComboboxRoot, rootProps, () => [
        h(ComboboxAnchor, null, () => [
          h(ComboboxInput, { 'aria-label': 'Fruit' }),
          h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
          options.cancel ? h(ComboboxCancel, { 'data-testid': 'cancel' }, () => 'Clear') : null,
        ]),
        h(ComboboxContent, null, () => h(ComboboxViewport, null, () => [
          h(ComboboxEmpty, null, () => 'Nothing'),
          ...(options.values ?? fruits).map(value => h(ComboboxItem, { value }, () => value)),
        ])),
      ])
    },
  })
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('useComboboxRoot — standalone', () => {
  /**
   * A combobox built on the composable alone: plain elements, the surfaces
   * bound with `v-bind`, the items registered with the shared filter by hand.
   */
  function createStandalone(props: UseComboboxRootProps<string> = {}) {
    let api!: UseComboboxRootReturn<string>
    const component = defineComponent({
      setup() {
        const items = ref<HTMLElement[]>([])
        api = useComboboxRoot<string>({
          baseId: 'fruit',
          getItems: () => items.value.map(ref => ({ ref, value: ref.dataset.value! })),
          ...props,
        })
        const text = ref('')
        const input = api.createInputSurface({ modelValue: text })
        fruits.forEach((value) => {
          const item: ListboxFilterItem<string> = { value: () => value, label: () => value }
          api.context.registerFilterItem(value, item)
        })
        return () => h('div', api.root.attrs.value, [
          h('input', { 'aria-label': 'Fruit', ...input.attrs.value }),
          h('button', { 'type': 'button', 'data-testid': 'trigger', ...api.trigger.attrs.value }, 'Open'),
          api.open.value
            ? h('div', { ...api.content.attrs.value, ...api.listbox.attrs.value, 'aria-label': 'Fruits' }, fruits
                .filter(value => !api.context.isFilteredOut(value))
                .map(value => h('div', {
                  'key': value,
                  'data-value': value,
                  'ref': (el: any) => {
                    if (el && !items.value.includes(el))
                      items.value.push(el)
                  },
                  ...api.getItemSurface(value).attrs.value,
                }, value)))
            : null,
        ])
      },
    })
    return { component, api: () => api }
  }

  it('is exported from the package root', () => {
    expect(Reka.useComboboxRoot).toBe(useComboboxRoot)
  })

  it('derives the content id from `baseId` up front and wires the input and trigger to it', async () => {
    const { component } = createStandalone()
    const wrapper = mount(component, { attachTo: document.body })
    const input = wrapper.find('input')
    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('aria-controls')).toBe('fruit-content')
    expect(input.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[data-testid=trigger]').attributes('aria-controls')).toBe('fruit-content')
    expect(wrapper.find('[data-testid=trigger]').attributes('data-state')).toBe('closed')

    await wrapper.find('[data-testid=trigger]').trigger('click')
    await settle()
    expect(input.attributes('aria-expanded')).toBe('true')
    expect(document.getElementById('fruit-content')?.getAttribute('role')).toBe('listbox')
    expect(document.getElementById('fruit-content')?.dataset.state).toBe('open')
    wrapper.unmount()
  })

  it('opens on typing and filters with the default `contains`', async () => {
    const { component, api } = createStandalone()
    const wrapper = mount(component, { attachTo: document.body })
    await wrapper.find('input').setValue('ber')
    await settle()
    expect(api().open.value).toBe(true)
    expect(api().lastOpenChangeDetails.value.reason).toBe('input-change')
    expect(api().filterState.value).toEqual({ search: 'ber', active: true, count: 1 })
    expect(optionTexts()).toEqual(['Blueberry'])
    wrapper.unmount()
  })

  it('passes axe while open', async () => {
    const { component } = createStandalone({ defaultOpen: true })
    const wrapper = mount(component, { attachTo: document.body })
    await settle()
    expect(await axe(wrapper.element)).toHaveNoViolations()
    wrapper.unmount()
  })

  it('selects through `select()` with a reason and replaces a single value', async () => {
    const onUpdate = vi.fn()
    const { component, api } = createStandalone({ onUpdate })
    mount(component)
    expect(api().select('Apple', 'item-press')).toBe(true)
    expect(api().select('Apple', 'item-press')).toBe(false)
    expect(api().modelValue.value).toBe('Apple')
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][1].reason).toBe('item-press')
  })

  it('cancels an open change from `onBeforeUpdateOpen` and skips its side effects', async () => {
    const { component, api } = createStandalone({ onBeforeUpdateOpen: (_value, details) => details.cancel() })
    mount(component)
    api().filterSearch.value = 'app'
    expect(api().onOpenChange(true, 'trigger-press')).toBe(false)
    expect(api().open.value).toBe(false)
    expect(api().lastOpenChangeDetails.value.isCanceled).toBe(true)
    expect(api().filterSearch.value).toBe('app')
  })
})

describe('comboboxRoot — change details', () => {
  it('reports `item-press` for a click and for Enter, with the event', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(createCombobox({ 'onUpdate:modelValue': onUpdate }), { attachTo: document.body })
    await wrapper.find('[data-testid=trigger]').trigger('click')
    await settle()
    ;(document.querySelectorAll('[role=option]')[1] as HTMLElement).click()
    await settle()
    expect(onUpdate).toHaveBeenLastCalledWith('Banana', expect.objectContaining({ reason: 'item-press', event: expect.any(MouseEvent) }))

    await wrapper.find('[data-testid=trigger]').trigger('click')
    await settle()
    keydown(wrapper.find('input').element, 'ArrowDown')
    await settle()
    keydown(wrapper.find('input').element, 'Enter')
    await settle()
    expect(onUpdate).toHaveBeenCalledTimes(2)
    expect(onUpdate.mock.calls[1][1].reason).toBe('item-press')
    wrapper.unmount()
  })

  it('reports `clear-press` from ComboboxCancel with `reset-model-value-on-clear`', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(createCombobox({ 'defaultValue': 'Apple', 'resetModelValueOnClear': true, 'onUpdate:modelValue': onUpdate }, { cancel: true }), { attachTo: document.body })
    await wrapper.find('[data-testid=cancel]').trigger('click')
    expect(onUpdate).toHaveBeenCalledWith(null, expect.objectContaining({ reason: 'clear-press' }))
    wrapper.unmount()
  })

  it('reports a toggle in a multiple combobox as `item-press`', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(createCombobox({ 'multiple': true, 'onUpdate:modelValue': onUpdate }), { attachTo: document.body })
    await wrapper.find('[data-testid=trigger]').trigger('click')
    await settle()
    ;(document.querySelectorAll('[role=option]')[0] as HTMLElement).click()
    ;(document.querySelectorAll('[role=option]')[2] as HTMLElement).click()
    ;(document.querySelectorAll('[role=option]')[0] as HTMLElement).click()
    expect(onUpdate.mock.calls.map(call => [call[0], call[1].reason])).toEqual([
      [['Apple'], 'item-press'],
      [['Apple', 'Blueberry'], 'item-press'],
      [['Blueberry'], 'item-press'],
    ])
    wrapper.unmount()
  })

  it('reports why the combobox opened and closed', async () => {
    const reasons: string[] = []
    const wrapper = mount(createCombobox({ 'openOnFocus': true, 'onUpdate:open': (_: boolean, details: { reason: string }) => reasons.push(details.reason) }), { attachTo: document.body })
    const input = wrapper.find('input')

    await wrapper.find('[data-testid=trigger]').trigger('click')
    await settle()
    keydown(input.element, 'Escape')
    await settle()
    keydown(input.element, 'ArrowDown')
    await settle()
    ;(document.querySelectorAll('[role=option]')[0] as HTMLElement).click()
    await settle()
    await input.setValue('b')
    await settle()
    // let the dismissable layer's outside-pointer subscriber arm
    await sleep(1)
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    document.body.click()
    await settle()
    input.element.blur()
    await input.trigger('focus')
    await settle()

    expect(reasons).toEqual(['trigger-press', 'escape-key', 'list-navigation', 'item-press', 'input-change', 'outside-press', 'input-focus'])
    wrapper.unmount()
  })

  it('reports `input-press` with `open-on-click`', async () => {
    const onOpen = vi.fn()
    const wrapper = mount(createCombobox({ 'openOnClick': true, 'onUpdate:open': onOpen }), { attachTo: document.body })
    await wrapper.find('input').trigger('click')
    expect(onOpen).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'input-press' }))
    wrapper.unmount()
  })
})

describe('comboboxRoot — cancellation', () => {
  it('keeps the value when `beforeUpdate:modelValue` cancels an item press', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(createCombobox({
      'defaultValue': 'Apple',
      'onBeforeUpdate:modelValue': (value: string, details: { reason: string, cancel: () => void }) => {
        if (value === 'Cherry' && details.reason === 'item-press')
          details.cancel()
      },
      'onUpdate:modelValue': onUpdate,
    }), { attachTo: document.body })
    await wrapper.find('[data-testid=trigger]').trigger('click')
    await settle()
    ;(document.querySelectorAll('[role=option]')[3] as HTMLElement).click()
    await settle()
    expect(onUpdate).not.toHaveBeenCalled()
    // A cancelled selection keeps the popup open.
    expect(document.querySelector('[role=listbox]')).not.toBeNull()
    expect(document.querySelector('[role=option][data-state=checked]')?.textContent).toBe('Apple')
    ;(document.querySelectorAll('[role=option]')[1] as HTMLElement).click()
    await settle()
    expect(onUpdate).toHaveBeenCalledWith('Banana', expect.objectContaining({ reason: 'item-press' }))
    expect(document.querySelector('[role=listbox]')).toBeNull()
    wrapper.unmount()
  })

  it('commits an item press but stays open when `beforeUpdate:open` cancels the close', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(createCombobox({
      'onBeforeUpdate:open': (value: boolean, details: { reason: string, cancel: () => void }) => {
        if (!value && details.reason === 'item-press')
          details.cancel()
      },
      'onUpdate:modelValue': onUpdate,
    }), { attachTo: document.body })
    await wrapper.find('[data-testid=trigger]').trigger('click')
    await settle()
    ;(document.querySelectorAll('[role=option]')[1] as HTMLElement).click()
    await settle()
    expect(onUpdate).toHaveBeenCalledWith('Banana', expect.objectContaining({ reason: 'item-press' }))
    expect(document.querySelector('[role=listbox]')).not.toBeNull()
    expect(document.querySelector('[role=option][data-state=checked]')?.textContent).toBe('Banana')
    wrapper.unmount()
  })

  it('closes when the selected item is pressed again (a no-op write, not a cancel)', async () => {
    const onOpen = vi.fn()
    const wrapper = mount(createCombobox({ 'defaultValue': 'Apple', 'onUpdate:open': onOpen }), { attachTo: document.body })
    await wrapper.find('[data-testid=trigger]').trigger('click')
    await settle()
    ;(document.querySelectorAll('[role=option]')[0] as HTMLElement).click()
    await settle()
    expect(onOpen).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'item-press' }))
    expect(document.querySelector('[role=listbox]')).toBeNull()
    wrapper.unmount()
  })

  it('keeps the value when `beforeUpdate:modelValue` cancels a clear', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(createCombobox({
      'defaultValue': 'Apple',
      'resetModelValueOnClear': true,
      'onBeforeUpdate:modelValue': (_: unknown, details: { cancel: () => void }) => details.cancel(),
      'onUpdate:modelValue': onUpdate,
    }, { cancel: true }), { attachTo: document.body })
    await wrapper.find('[data-testid=cancel]').trigger('click')
    expect(onUpdate).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('stays closed when `beforeUpdate:open` cancels', async () => {
    const wrapper = mount(createCombobox({
      'onBeforeUpdate:open': (value: boolean, details: { cancel: () => void }) => value && details.cancel(),
    }), { attachTo: document.body })
    await wrapper.find('[data-testid=trigger]').trigger('click')
    keydown(wrapper.find('input').element, 'ArrowDown')
    await wrapper.find('input').setValue('a')
    await settle()
    expect(document.querySelector('[role=listbox]')).toBeNull()
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('false')
    wrapper.unmount()
  })
})

describe('comboboxRoot — filter', () => {
  it('filters by `contains` (base sensitivity) by default and shows ComboboxEmpty with no match', async () => {
    const wrapper = mount(createCombobox(), { attachTo: document.body })
    await wrapper.find('input').setValue('BLUÉ')
    await settle()
    expect(optionTexts()).toEqual(['Blueberry'])
    expect(document.body.textContent).not.toContain('Nothing')
    await wrapper.find('input').setValue('xyz')
    await settle()
    expect(optionTexts()).toEqual([])
    expect(document.body.textContent).toContain('Nothing')
    expect(document.querySelector('[role=listbox]')?.hasAttribute('data-empty')).toBe(true)
    wrapper.unmount()
  })

  it('runs a custom `filter(text, search, value)`', async () => {
    const filter = vi.fn((text: string, search: string) => text.toLowerCase().startsWith(search.toLowerCase()))
    const wrapper = mount(createCombobox({ filter }), { attachTo: document.body })
    await wrapper.find('input').setValue('b')
    await settle()
    expect(optionTexts()).toEqual(['Banana', 'Blueberry'])
    expect(filter).toHaveBeenCalledWith('Apple', 'b', 'Apple')
    wrapper.unmount()
  })

  it('turns client filtering off with `:filter="null"`', async () => {
    const wrapper = mount(createCombobox({ filter: null }), { attachTo: document.body })
    await wrapper.find('input').setValue('xyz')
    await settle()
    expect(optionTexts()).toEqual(fruits)
    wrapper.unmount()
  })

  it('treats the deprecated `ignore-filter` as `:filter="null"`, over a custom filter', async () => {
    const filter = vi.fn(() => false)
    const wrapper = mount(createCombobox({ ignoreFilter: true, filter }), { attachTo: document.body })
    await wrapper.find('input').setValue('xyz')
    await settle()
    expect(optionTexts()).toEqual(fruits)
    expect(filter).not.toHaveBeenCalled()
    expect(document.body.textContent).not.toContain('Nothing')
    wrapper.unmount()
  })

  it('hides a group none of whose items match', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(ComboboxRoot, { open: true }, () => [
        h(ComboboxInput, { 'aria-label': 'Food' }),
        h(ComboboxContent, null, () => [
          h(ComboboxGroup, { 'data-testid': 'fruits' }, () => ['Apple', 'Banana'].map(value => h(ComboboxItem, { value }, () => value))),
          h(ComboboxGroup, { 'data-testid': 'vegetables' }, () => ['Carrot'].map(value => h(ComboboxItem, { value }, () => value))),
        ]),
      ]),
    }), { attachTo: document.body })
    await settle()
    await wrapper.find('input').setValue('car')
    await settle()
    expect(wrapper.find('[data-testid=fruits]').attributes('hidden')).toBeDefined()
    expect(wrapper.find('[data-testid=vegetables]').attributes('hidden')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('comboboxRoot — filter with ComboboxVirtualizer', () => {
  const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect
  beforeAll(() => {
    window.HTMLElement.prototype.getBoundingClientRect = function () {
      return { width: 200, height: 200, top: 0, left: 0, right: 200, bottom: 200, x: 0, y: 0, toJSON() {} }
    }
  })
  afterAll(() => {
    window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
  })

  const options = Array.from({ length: 100 }, (_, i) => ({ id: i, label: i % 10 === 0 ? `Match ${i}` : `Item ${i}` }))

  function mountVirtual(rootProps: Record<string, unknown> = {}) {
    return mount(defineComponent({
      setup: () => () => h(ComboboxRoot, { open: true, ...rootProps }, () => [
        h(ComboboxInput, { 'aria-label': 'Search' }),
        h(ComboboxContent, null, () => h(ComboboxViewport, { style: 'height: 200px; overflow: auto' }, () => [
          h(ComboboxEmpty, null, () => 'Nothing'),
          h(ComboboxVirtualizer, { options, estimateSize: 20, textContent: (o: any) => o.label }, {
            default: ({ option }: any) => h(ComboboxItem, { value: option }, () => option.label),
          }),
        ])),
      ]),
    }), { attachTo: document.body })
  }

  it('filters `options` before virtualizing them', async () => {
    const wrapper = mountVirtual()
    await flushPromises()
    expect(document.querySelectorAll('[role=option]').length).toBeGreaterThan(1)
    await wrapper.find('input').setValue('match')
    await flushPromises()
    await settle()
    const rows = Array.from(document.querySelectorAll('[role=option]'))
    expect(rows.map(row => row.textContent)).toEqual(options.filter(o => o.label.startsWith('Match')).map(o => o.label))
    expect(rows.map(row => row.getAttribute('aria-setsize'))).toEqual(Array.from({ length: 10 }).fill('10'))
    expect(rows.map(row => row.getAttribute('data-index'))).toEqual(Array.from({ length: 10 }, (_, i) => String(i)))
    expect(document.body.textContent).not.toContain('Nothing')
    wrapper.unmount()
  })

  it('shows ComboboxEmpty when no option matches', async () => {
    const wrapper = mountVirtual()
    await flushPromises()
    await wrapper.find('input').setValue('nope')
    await flushPromises()
    await settle()
    expect(document.querySelectorAll('[role=option]')).toHaveLength(0)
    expect(document.body.textContent).toContain('Nothing')
    wrapper.unmount()
  })

  it('selects a filtered option with ArrowDown + Enter', async () => {
    const onUpdate = vi.fn()
    const wrapper = mountVirtual({ 'onUpdate:modelValue': onUpdate })
    await flushPromises()
    await wrapper.find('input').setValue('match 2')
    await flushPromises()
    await settle()
    await new Promise(resolve => requestAnimationFrame(resolve))
    keydown(wrapper.find('input').element, 'Enter')
    expect(onUpdate).toHaveBeenCalledWith(options[20], expect.objectContaining({ reason: 'item-press' }))
    wrapper.unmount()
  })

  it('leaves `options` untouched with `ignore-filter`', async () => {
    const wrapper = mountVirtual({ ignoreFilter: true })
    await flushPromises()
    await wrapper.find('input').setValue('match')
    await flushPromises()
    await settle()
    expect(document.querySelector('[role=option]')?.getAttribute('aria-setsize')).toBe('100')
    wrapper.unmount()
  })
})

describe('comboboxRoot — navigation intent, display value and context', () => {
  it('routes the input keydown through `getNavigationIntent`', async () => {
    const getNavigationIntent = (event: KeyboardEvent) => event.ctrlKey && event.key === 'n' ? 'next' as const : undefined
    const wrapper = mount(createCombobox({ getNavigationIntent }), { attachTo: document.body })
    const input = wrapper.find('input').element
    const event = keydown(input, 'n', { ctrlKey: true })
    await settle()
    expect(event.defaultPrevented).toBe(true)
    expect(document.querySelector('[role=listbox]')).not.toBeNull()
    keydown(input, 'n', { ctrlKey: true })
    await settle()
    expect(document.querySelector('[role=option][data-highlighted]')?.textContent).toBe('Banana')
    wrapper.unmount()
  })

  it('shows the root `displayValue` in the input after a selection', async () => {
    const people = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }]
    const wrapper = mount(defineComponent({
      setup: () => () => h(ComboboxRoot<{ id: number, name: string }>, { by: 'id', displayValue: person => person.name }, () => [
        h(ComboboxInput, { 'aria-label': 'Person' }),
        h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
        h(ComboboxContent, null, () => people.map(person => h(ComboboxItem, { value: person }, () => person.name))),
      ]),
    }), { attachTo: document.body })
    await wrapper.find('[data-testid=trigger]').trigger('click')
    await settle()
    ;(document.querySelectorAll('[role=option]')[1] as HTMLElement).click()
    await sleep(1)
    expect(wrapper.find('input').element.value).toBe('Grace')
    wrapper.unmount()
  })

  it('drops a highlight whose item was replaced (async list with `:filter="null"`)', async () => {
    const items = ref(['Apple', 'Banana'])
    const wrapper = mount(defineComponent({
      setup: () => () => h(ComboboxRoot, { filter: null }, () => [
        h(ComboboxInput, { 'aria-label': 'Fruit' }),
        h(ComboboxContent, null, () => items.value.map(value => h(ComboboxItem, { key: value, value }, () => value))),
      ]),
    }), { attachTo: document.body })
    const input = wrapper.find('input')
    await input.setValue('a')
    await settle()
    keydown(input.element, 'ArrowDown')
    await settle()
    const highlighted = input.attributes('aria-activedescendant')
    expect(highlighted && document.getElementById(highlighted)).toBeTruthy()
    // The server answers with a new list while the search is active.
    items.value = ['Cherry', 'Date']
    await settle()
    const after = input.attributes('aria-activedescendant')
    expect(after === undefined || !!document.getElementById(after)).toBe(true)
    expect(after).not.toBe(highlighted)
    wrapper.unmount()
  })

  it('provides one object as the Combobox and the Listbox root context', async () => {
    let comboboxContext: any
    let listboxContext: any
    const Probe = defineComponent({
      setup() {
        comboboxContext = Reka.injectComboboxRootContext()
        listboxContext = Reka.injectListboxRootContext()
        return () => null
      },
    })
    mount(defineComponent({ setup: () => () => h(ComboboxRoot, null, () => h(Probe)) }))
    expect(comboboxContext).toBe(listboxContext)
    expect(comboboxContext.contentId).toMatch(/^reka-combobox-.+-content$/)
  })
})

// #2828: the input text carries details too, with Base UI's `onInputValueChange` reasons.
describe('comboboxInput — change details', () => {
  function createWithInput(rootProps: Record<string, unknown> | (() => Record<string, unknown>) = {}, inputProps: Record<string, unknown> = {}) {
    return defineComponent({
      setup: () => () => h(ComboboxRoot, typeof rootProps === 'function' ? rootProps() : rootProps, () => [
        h(ComboboxAnchor, null, () => [
          h(ComboboxInput, { 'aria-label': 'Fruit', ...inputProps }),
          h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
          h(ComboboxCancel, { 'data-testid': 'cancel' }, () => 'Clear'),
        ]),
        h(ComboboxContent, null, () => h(ComboboxViewport, null, () => fruits.map(value => h(ComboboxItem, { value }, () => value)))),
      ]),
    })
  }
  const reasons = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.map(call => [call[0], call[1].reason])

  it('reports `input-change`, `item-press` and `clear-press`', async () => {
    const onInput = vi.fn()
    const wrapper = mount(createWithInput({}, { 'onUpdate:modelValue': onInput }), { attachTo: document.body })
    await wrapper.find('input').setValue('bl')
    await settle()
    ;(document.querySelector('[role=option]') as HTMLElement).click()
    await sleep(10)
    await settle()
    await wrapper.find('[data-testid=cancel]').trigger('click')
    expect(reasons(onInput)).toEqual([
      ['bl', 'input-change'],
      ['Blueberry', 'item-press'],
      ['', 'clear-press'],
    ])
    expect(onInput.mock.calls[0][1].event).toBeInstanceOf(Event)
    wrapper.unmount()
  })

  it('reports `escape-key` when Escape closes the popup and resets the text', async () => {
    const onInput = vi.fn()
    const wrapper = mount(createWithInput({}, { 'onUpdate:modelValue': onInput }), { attachTo: document.body })
    await wrapper.find('input').setValue('ch')
    await settle()
    keydown(wrapper.find('input').element, 'Escape')
    await sleep(10)
    await settle()
    expect(reasons(onInput)).toEqual([['ch', 'input-change'], ['', 'escape-key']])
    wrapper.unmount()
  })

  it('reports `input-clear` when another close resets the text to empty', async () => {
    const onInput = vi.fn()
    const wrapper = mount(createWithInput({}, { 'onUpdate:modelValue': onInput }), { attachTo: document.body })
    await wrapper.find('input').setValue('ch')
    await settle()
    await wrapper.find('[data-testid=trigger]').trigger('click')
    await sleep(10)
    await settle()
    expect(reasons(onInput)).toEqual([['ch', 'input-change'], ['', 'input-clear']])
    wrapper.unmount()
  })

  it('reports `none` when the text follows a value the parent sets', async () => {
    const onInput = vi.fn()
    const model = ref<string>()
    const wrapper = mount(createWithInput(() => ({ modelValue: model.value }), { 'onUpdate:modelValue': onInput }), { attachTo: document.body })
    model.value = 'Cherry'
    await settle()
    expect(reasons(onInput)).toEqual([['Cherry', 'none']])
    wrapper.unmount()
  })

  it('keeps the text when `beforeUpdate:modelValue` cancels typing', async () => {
    const onInput = vi.fn()
    const wrapper = mount(createWithInput({}, {
      'onBeforeUpdate:modelValue': (value: string, details: { reason: string, cancel: () => void }) => value.length > 2 && details.cancel(),
      'onUpdate:modelValue': onInput,
    }), { attachTo: document.body })
    await wrapper.find('input').setValue('bl')
    await wrapper.find('input').setValue('blu')
    await settle()
    expect(reasons(onInput)).toEqual([['bl', 'input-change']])
    // The vetoed text is taken back out of the input, and the filter keeps the accepted search.
    expect(wrapper.find('input').element.value).toBe('bl')
    expect(optionTexts()).toEqual(['Blueberry'])
    wrapper.unmount()
  })
})

describe('autocompleteRoot — change details', () => {
  function createAutocomplete(rootProps: Record<string, unknown> | (() => Record<string, unknown>) = {}) {
    return defineComponent({
      setup: () => () => h(AutocompleteRoot, typeof rootProps === 'function' ? rootProps() : rootProps, () => [
        h(AutocompleteInput, { 'aria-label': 'Fruit' }),
        h(AutocompleteCancel, { 'data-testid': 'cancel' }, () => 'Clear'),
        h(AutocompleteContent, null, () => h(AutocompleteViewport, null, () => fruits.map(value => h(AutocompleteItem, { value }, () => value)))),
      ]),
    })
  }

  it('reports `input-change`, `item-press` and `clear-press`', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(createAutocomplete({ 'onUpdate:modelValue': onUpdate }), { attachTo: document.body })
    await wrapper.find('input').setValue('bl')
    await settle()
    ;(document.querySelector('[role=option]') as HTMLElement).click()
    await settle()
    await wrapper.find('[data-testid=cancel]').trigger('click')
    expect(onUpdate.mock.calls.map(call => [call[0], call[1].reason])).toEqual([
      ['bl', 'input-change'],
      ['Blueberry', 'item-press'],
      ['', 'clear-press'],
    ])
    wrapper.unmount()
  })

  it('cancels typed text of a controlled value from `beforeUpdate:modelValue`', async () => {
    const onUpdate = vi.fn()
    const model = ref('')
    const wrapper = mount(createAutocomplete(() => ({
      'modelValue': model.value,
      'onBeforeUpdate:modelValue': (value: string, details: { cancel: () => void }) => value.length > 2 && details.cancel(),
      'onUpdate:modelValue': (value: string, details: unknown) => {
        model.value = value
        onUpdate(value, details)
      },
    })), { attachTo: document.body })
    await wrapper.find('input').setValue('bl')
    await wrapper.find('input').setValue('blu')
    await settle()
    expect(onUpdate.mock.calls.map(call => call[0])).toEqual(['bl'])
    // The vetoed text is taken back out of the input, and the filter keeps the accepted search.
    expect(wrapper.find('input').element.value).toBe('bl')
    expect(optionTexts()).toEqual(['Blueberry'])
    wrapper.unmount()
  })

  // Base UI parity (`AutocompleteRoot.tsx` writes an uncontrolled value before `onValueChange`).
  it('ignores `cancel()` on an uncontrolled value', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(createAutocomplete({
      'onBeforeUpdate:modelValue': (_value: string, details: { cancel: () => void }) => details.cancel(),
      'onUpdate:modelValue': onUpdate,
    }), { attachTo: document.body })
    await wrapper.find('input').setValue('bl')
    await settle()
    expect(onUpdate.mock.calls.map(call => [call[0], call[1].reason])).toEqual([['bl', 'input-change']])
    expect(wrapper.find('input').element.value).toBe('bl')
    wrapper.unmount()
  })

  it('reports the input text changes on `AutocompleteInput`', async () => {
    const onInput = vi.fn()
    const wrapper = mount(defineComponent({
      setup: () => () => h(AutocompleteRoot, null, () => [
        h(AutocompleteInput, { 'aria-label': 'Fruit', 'onUpdate:modelValue': onInput }),
        h(AutocompleteCancel, { 'data-testid': 'cancel' }, () => 'Clear'),
        h(AutocompleteContent, null, () => h(AutocompleteViewport, null, () => fruits.map(value => h(AutocompleteItem, { value }, () => value)))),
      ]),
    }), { attachTo: document.body })
    await wrapper.find('input').setValue('bl')
    await settle()
    ;(document.querySelector('[role=option]') as HTMLElement).click()
    await settle()
    await wrapper.find('[data-testid=cancel]').trigger('click')
    await settle()
    expect(onInput.mock.calls.map(call => [call[0], call[1].reason])).toEqual([
      ['bl', 'input-change'],
      ['Blueberry', 'item-press'],
      ['', 'clear-press'],
    ])
    expect(onInput.mock.calls[0][1].event).toBeInstanceOf(Event)
    wrapper.unmount()
  })

  it('writes the root `displayValue` of a selected item into the value', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(createAutocomplete({ 'displayValue': (value: string) => value.toUpperCase(), 'onUpdate:modelValue': onUpdate }), { attachTo: document.body })
    await wrapper.find('input').setValue('ch')
    await settle()
    ;(document.querySelector('[role=option]') as HTMLElement).click()
    await settle()
    expect(onUpdate).toHaveBeenLastCalledWith('CHERRY', expect.objectContaining({ reason: 'item-press' }))
    expect(wrapper.find('input').element.value).toBe('CHERRY')
    wrapper.unmount()
  })

  it('filters with `filter` and treats `ignore-filter` as `:filter="null"`', async () => {
    let wrapper: VueWrapper = mount(createAutocomplete({ filter: (text: string, search: string) => text.endsWith(search) }), { attachTo: document.body })
    await wrapper.find('input').setValue('rry')
    await settle()
    expect(optionTexts()).toEqual(['Blueberry', 'Cherry'])
    wrapper.unmount()

    wrapper = mount(createAutocomplete({ ignoreFilter: true }), { attachTo: document.body })
    await wrapper.find('input').setValue('rry')
    await settle()
    expect(optionTexts()).toEqual(fruits)
    wrapper.unmount()
  })
})

describe('combobox SSR', () => {
  function createSSRCombobox(open: boolean) {
    return defineComponent({
      setup: () => () => h(ComboboxRoot, { defaultOpen: open, defaultValue: 'Banana', name: 'fruit' }, () => [
        h(ComboboxAnchor, null, () => [
          h(ComboboxInput, { 'aria-label': 'Fruit' }),
          h(ComboboxTrigger, null, () => 'Open'),
        ]),
        h(ComboboxContent, null, () => h(ComboboxViewport, null, () => [
          h(ComboboxEmpty, null, () => 'Nothing'),
          ...fruits.map(value => h(ComboboxItem, { value }, () => value)),
        ])),
      ]),
    })
  }

  it.each([false, true])('renders on the server and hydrates without mismatches (open: %s)', async (open) => {
    const html = await renderToString(createSSRApp(createSSRCombobox(open)))
    const controls = html.match(/role="combobox"[^>]*aria-controls="([^"]+)"|aria-controls="([^"]+)"[^>]*role="combobox"/)
    const contentId = controls?.[1] ?? controls?.[2]
    expect(contentId).toMatch(/^reka-combobox-.+-content$/)
    if (open) {
      expect(html).toContain(`id="${contentId}"`)
      expect(html).toContain('Blueberry')
    }

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.append(container)
    const app = createSSRApp(createSSRCombobox(open))
    app.mount(container)
    await settle()
    const messages = [...warn.mock.calls, ...error.mock.calls].map(call => String(call[0]))
    warn.mockRestore()
    error.mockRestore()
    expect(messages.filter(message => /hydration/i.test(message))).toEqual([])
    expect(container.querySelector('[role=combobox]')?.getAttribute('aria-controls')).toBe(contentId)
    app.unmount()
  })
})
