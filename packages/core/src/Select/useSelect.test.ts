import type { UseSelectRootReturn } from './useSelect'
import { fireEvent } from '@testing-library/vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { SelectContent, SelectItem, SelectItemIndicator, SelectItemText, SelectPortal, SelectRoot, SelectTrigger, SelectValue, SelectViewport } from '.'
import * as Reka from '../index'
import { useSelectItem, useSelectItemIndicator, useSelectItemText, useSelectRoot, useSelectTrigger, useSelectValue } from './useSelect'

beforeAll(() => {
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

enableAutoUnmount(afterEach)

beforeEach(() => {
  document.body.innerHTML = ''
})

const fruits = ['Apple', 'Banana', 'Blueberry', 'Cherry']

function trigger() {
  return document.querySelector('[role=combobox]') as HTMLElement
}
function options() {
  return Array.from(document.querySelectorAll<HTMLElement>('[role=option]'))
}
function option(text: string) {
  return options().find(el => el.textContent?.includes(text))!
}
function valueText() {
  return document.querySelector('[data-testid=value]')!.textContent
}

async function open() {
  await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false })
  await flushPromises()
}

/** Releases the pointer on an item; the first `pointerup` after opening is swallowed by the content's guard. */
async function press(el: HTMLElement) {
  el.focus()
  await fireEvent.pointerUp(el)
  await fireEvent.pointerUp(el)
  await flushPromises()
}

async function keydownOn(el: Element, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  el.dispatchEvent(event)
  await flushPromises()
  return event
}

function isOpen() {
  return trigger().getAttribute('aria-expanded') === 'true'
}

/** A Select; `rootProps` (props and `on…` listeners) go on `SelectRoot`. */
function mountSelect(rootProps: Record<string, unknown> = {}, opts: { values?: string[], disabled?: string[], form?: boolean } = {}) {
  const select = () => h(SelectRoot, rootProps, () => [
    h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { 'data-testid': 'value', 'placeholder': 'Pick a fruit' })),
    h(SelectPortal, () => h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () =>
      (opts.values ?? fruits).map(value => h(SelectItem, { value, disabled: opts.disabled?.includes(value) }, () => [
        h(SelectItemText, () => value),
        h(SelectItemIndicator, () => '✓'),
      ]))))),
  ])
  return mount(defineComponent({
    setup: () => () => opts.form ? h('form', select()) : select(),
  }), { attachTo: document.body })
}

describe('useSelectRoot — standalone', () => {
  // A select built on the composables alone: plain elements, no Popper,
  // Presence or DismissableLayer, the surfaces bound with `v-bind`.
  function createStandalone(onUpdate = vi.fn()) {
    let api!: UseSelectRootReturn<string>
    const Item = defineComponent({
      props: { value: { type: String, required: true } },
      setup(props) {
        const { item, itemContext } = useSelectItem<string>({ context: api.context, value: () => props.value })
        const textEl = ref<HTMLElement>()
        const { itemText } = useSelectItemText<string>({ context: api.context, itemContext, element: textEl })
        const { indicator, present } = useSelectItemIndicator(itemContext)
        return () => h('div', item.attrs.value, [
          h('span', { ...itemText.attrs.value, ref: textEl }, props.value),
          present.value ? h('span', indicator.attrs.value, '✓') : null,
        ])
      },
    })
    const component = defineComponent({
      setup() {
        api = useSelectRoot<string>({ baseId: 'fruit', onUpdate })
        const { trigger } = useSelectTrigger({ context: api.context })
        const { value, text } = useSelectValue({ context: api.context, placeholder: 'Pick a fruit' })
        return () => h('div', [
          h('button', { ...trigger.attrs.value, 'type': 'button', 'aria-label': 'Fruit' }, h('span', value.attrs.value, text.value)),
          h('div', { 'id': api.context.contentId, 'role': 'listbox', 'aria-label': 'Fruits' }, fruits.map(value => h(Item, { value }))),
        ])
      },
    })
    const wrapper = mount(component, { attachTo: document.body })
    return { wrapper, api: () => api }
  }

  it('renders the parts and passes axe', async () => {
    const { wrapper } = createStandalone()
    await nextTick()
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    expect(trigger().hasAttribute('data-placeholder')).toBe(true)
    expect(options()[0].getAttribute('aria-labelledby')).toBe(options()[0].querySelector('span')!.id)
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('opens from the trigger and selects with an item press', async () => {
    const onUpdate = vi.fn()
    const { api } = createStandalone(onUpdate)
    await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false })
    expect(api().open.value).toBe(true)
    expect(trigger().getAttribute('aria-controls')).toBe('fruit-content')

    await fireEvent.pointerUp(option('Banana'))
    await flushPromises()
    expect(api().modelValue.value).toBe('Banana')
    expect(onUpdate).toHaveBeenCalledWith('Banana', expect.objectContaining({ reason: 'item-press' }))
    expect(api().open.value).toBe(false)
    expect(trigger().textContent).toBe('Banana')
    expect(option('Banana').getAttribute('data-state')).toBe('checked')
    expect(option('Banana').textContent).toContain('✓')
  })

  it('keeps labels after the item texts unmount (sticky registry)', async () => {
    const { api, wrapper } = createStandalone()
    await nextTick()
    api().setModelValue('Cherry')
    await nextTick()
    wrapper.unmount()
    expect(api().selectedLabels.value).toEqual(['Cherry'])
  })
})

describe('change reasons', () => {
  it('reports item-press, item-keydown and the matching open reasons', async () => {
    const onUpdate = vi.fn()
    const onOpen = vi.fn()
    mountSelect({ 'onUpdate:modelValue': onUpdate, 'onUpdate:open': onOpen })

    await open()
    expect(onOpen).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'trigger-press' }))
    await press(option('Banana'))
    expect(onUpdate).toHaveBeenLastCalledWith('Banana', expect.objectContaining({ reason: 'item-press' }))
    expect(onOpen).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'item-press' }))

    await keydownOn(trigger(), 'ArrowDown')
    expect(onOpen).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'list-navigation' }))
    await keydownOn(option('Cherry'), 'Enter')
    expect(onUpdate).toHaveBeenLastCalledWith('Cherry', expect.objectContaining({ reason: 'item-keydown' }))
    expect(onOpen).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'item-keydown' }))

    await keydownOn(trigger(), 'Enter')
    expect(onOpen).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'trigger-press' }))
    await keydownOn(option('Apple'), 'Escape')
    expect(onOpen).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'escape-key' }))
  })

  it('reports outside-press when the content is dismissed from outside', async () => {
    const onOpen = vi.fn()
    mountSelect({ 'onUpdate:open': onOpen })
    await open()
    // Wait for the dismissable layer to arm its outside listeners.
    await new Promise(resolve => setTimeout(resolve, 10))
    const outside = document.createElement('div')
    document.body.appendChild(outside)
    await fireEvent.pointerDown(outside)
    expect(onOpen).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'outside-press' }))
  })

  it('reports autofill when the native select changes', async () => {
    const onUpdate = vi.fn()
    mountSelect({ 'name': 'fruit', 'onUpdate:modelValue': onUpdate }, { form: true })
    await flushPromises()
    const select = document.querySelector('select')!
    select.value = 'Cherry'
    select.dispatchEvent(new Event('input', { bubbles: true }))
    expect(onUpdate).toHaveBeenLastCalledWith('Cherry', expect.objectContaining({ reason: 'autofill' }))
  })

  it('does not emit when the selected item is pressed again, but still closes', async () => {
    const onUpdate = vi.fn()
    mountSelect({ 'defaultValue': 'Banana', 'onUpdate:modelValue': onUpdate })
    await open()
    await press(option('Banana'))
    expect(onUpdate).not.toHaveBeenCalled()
    expect(isOpen()).toBe(false)
  })
})

describe('cancellation', () => {
  it('a cancelled beforeUpdate:modelValue keeps the value and the content open', async () => {
    const onBefore = vi.fn((_value, details) => details.cancel())
    const onUpdate = vi.fn()
    mountSelect({ 'onBeforeUpdate:modelValue': onBefore, 'onUpdate:modelValue': onUpdate })
    await open()
    await press(option('Banana'))
    expect(onBefore).toHaveBeenCalledWith('Banana', expect.objectContaining({ reason: 'item-press' }))
    expect(onUpdate).not.toHaveBeenCalled()
    expect(valueText()).toBe('Pick a fruit')
    expect(isOpen()).toBe(true)
  })

  it('a cancelled beforeUpdate:open keeps it closed, or open with the value committed', async () => {
    let cancelOpen = true
    const onBeforeOpen = vi.fn((value, details) => {
      if (value === cancelOpen)
        details.cancel()
    })
    mountSelect({ 'onBeforeUpdate:open': onBeforeOpen })
    await open()
    expect(isOpen()).toBe(false)

    cancelOpen = false
    await open()
    expect(isOpen()).toBe(true)
    await press(option('Cherry'))
    expect(valueText()).toBe('Cherry')
    expect(isOpen()).toBe(true)
  })
})

describe('controlled and uncontrolled', () => {
  it('uncontrolled: keeps its own value and seeds it from defaultValue', async () => {
    mountSelect({ defaultValue: 'Apple' })
    await flushPromises()
    expect(valueText()).toBe('Apple')
    await open()
    await press(option('Cherry'))
    expect(valueText()).toBe('Cherry')
  })

  it('controlled: shows the prop and only emits; the parent decides', async () => {
    const onUpdate = vi.fn()
    mountSelect({ 'modelValue': 'Apple', 'onUpdate:modelValue': onUpdate })
    await flushPromises()
    await open()
    await press(option('Cherry'))
    expect(onUpdate).toHaveBeenCalledWith('Cherry', expect.anything())
    expect(valueText()).toBe('Apple')
  })

  it('controlled with v-model: follows the parent', async () => {
    const model = ref('Apple')
    mount(defineComponent({
      setup: () => () => h(SelectRoot<string>, { 'modelValue': model.value, 'onUpdate:modelValue': (v: string) => model.value = v }, () => [
        h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { 'data-testid': 'value' })),
        h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => fruits.map(value => h(SelectItem, { value }, () => h(SelectItemText, () => value))))),
      ]),
    }), { attachTo: document.body })
    await flushPromises()
    await open()
    await press(option('Blueberry'))
    expect(model.value).toBe('Blueberry')
    expect(valueText()).toBe('Blueberry')
    model.value = 'Banana'
    await flushPromises()
    expect(valueText()).toBe('Banana')
  })
})

describe('multiple', () => {
  it('toggles values, emits arrays and stays open', async () => {
    const onUpdate = vi.fn()
    mountSelect({ 'multiple': true, 'onUpdate:modelValue': onUpdate })
    await open()
    await press(option('Banana'))
    expect(onUpdate).toHaveBeenLastCalledWith(['Banana'], expect.objectContaining({ reason: 'item-press' }))
    await fireEvent.pointerUp(option('Cherry'))
    await flushPromises()
    expect(onUpdate).toHaveBeenLastCalledWith(['Banana', 'Cherry'], expect.anything())
    expect(isOpen()).toBe(true)
    expect(valueText()).toBe('Banana, Cherry')

    await fireEvent.pointerUp(option('Banana'))
    await flushPromises()
    expect(onUpdate).toHaveBeenLastCalledWith(['Cherry'], expect.anything())
  })

  it('submits every selected value with the form', async () => {
    mountSelect({ name: 'fruit', multiple: true, defaultValue: ['Apple', 'Cherry'] }, { form: true })
    await flushPromises()
    const form = document.querySelector('form')!
    expect(new FormData(form).getAll('fruit')).toEqual(['Apple', 'Cherry'])
  })
})

describe('typeahead on the closed trigger', () => {
  it('selects the next matching item and cycles on a repeated key', async () => {
    const onUpdate = vi.fn()
    mountSelect({ 'onUpdate:modelValue': onUpdate })
    await flushPromises()
    trigger().focus()
    await keydownOn(trigger(), 'b')
    expect(onUpdate).toHaveBeenLastCalledWith('Banana', expect.objectContaining({ reason: 'typeahead' }))
    expect(valueText()).toBe('Banana')
    await keydownOn(trigger(), 'b')
    expect(valueText()).toBe('Blueberry')
    expect(isOpen()).toBe(false)
  })

  it('skips disabled items', async () => {
    mountSelect({}, { disabled: ['Banana'] })
    await flushPromises()
    await keydownOn(trigger(), 'b')
    expect(valueText()).toBe('Blueberry')
  })

  it('does nothing in a multiple select', async () => {
    const onUpdate = vi.fn()
    mountSelect({ 'multiple': true, 'onUpdate:modelValue': onUpdate })
    await flushPromises()
    await keydownOn(trigger(), 'b')
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('still focuses the matching item while open', async () => {
    mountSelect()
    await open()
    option('Apple').focus()
    await keydownOn(option('Apple'), 'c')
    expect(document.activeElement).toBe(option('Cherry'))
  })
})

describe('form', () => {
  it('bubbles change from the native select to the form', async () => {
    const onChange = vi.fn((event: Event) => (event.target as HTMLSelectElement).value)
    mount(defineComponent({
      setup: () => () => h('form', { onChange }, h(SelectRoot, { name: 'fruit' }, () => [
        h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue)),
        h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => fruits.map(value => h(SelectItem, { value }, () => h(SelectItemText, () => value))))),
      ])),
    }), { attachTo: document.body })
    await flushPromises()
    await open()
    await press(option('Cherry'))
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.results.at(-1)!.value).toBe('Cherry')
  })
})

describe('displayValue', () => {
  it('shows the value without rendering the closed content', async () => {
    const values = [{ id: 1, name: 'Apple' }, { id: 2, name: 'Banana' }]
    const itemText = vi.fn()
    mount(defineComponent({
      setup: () => () => h('form', h(SelectRoot<{ id: number, name: string }>, { name: 'fruit', by: 'id', defaultValue: { id: 2, name: 'Banana' }, displayValue: v => v.name }, () => [
        h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { 'data-testid': 'value' })),
        h(SelectContent, () => h(SelectViewport, () => values.map(value => h(SelectItem, { value }, () => h(SelectItemText, () => {
          itemText()
          return value.name
        }))))),
      ])),
    }), { attachTo: document.body })
    await flushPromises()
    expect(valueText()).toBe('Banana')
    expect(itemText).not.toHaveBeenCalled()
    expect(document.querySelector('select option[selected], select option:checked')?.textContent?.trim()).toBe('Banana')
  })
})

describe('getNavigationIntent', () => {
  it('maps extra keys to moves and opts Enter out of selecting', async () => {
    const onUpdate = vi.fn()
    mountSelect({
      'getNavigationIntent': (event: KeyboardEvent) => {
        if (event.ctrlKey && event.key === 'n')
          return 'next'
        if (event.key === 'Enter')
          return null
        if (event.key === 'x')
          return 'select'
      },
      'onUpdate:modelValue': onUpdate,
    })
    await open()
    option('Apple').focus()
    await keydownOn(option('Apple'), 'n', { ctrlKey: true })
    await new Promise(resolve => setTimeout(resolve))
    expect(document.activeElement).toBe(option('Banana'))

    await keydownOn(option('Banana'), 'Enter')
    expect(onUpdate).not.toHaveBeenCalled()

    await keydownOn(option('Banana'), 'x')
    expect(onUpdate).toHaveBeenCalledWith('Banana', expect.objectContaining({ reason: 'item-keydown' }))
  })
})

describe('review fixes (#3072)', () => {
  function nativeSelect() {
    return document.querySelector('select')!
  }
  function formValue() {
    return new FormData(document.querySelector('form')!).get('fruit')
  }
  function isScrollLocked() {
    return getComputedStyle(document.body).overflowY === 'hidden' || getComputedStyle(document.documentElement).overflowY === 'hidden'
  }
  async function autofill(value: string) {
    nativeSelect().value = value
    nativeSelect().dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
  }

  it('a cancelled autofill puts the native select back on the model', async () => {
    const onBefore = vi.fn((_value, details) => details.cancel())
    mountSelect({ 'name': 'fruit', 'defaultValue': 'Apple', 'onBeforeUpdate:modelValue': onBefore }, { form: true })
    await flushPromises()
    await autofill('Cherry')
    expect(onBefore).toHaveBeenCalledWith('Cherry', expect.objectContaining({ reason: 'autofill' }))
    expect(valueText()).toBe('Apple')
    expect(formValue()).toBe('Apple')
  })

  it('an autofill a controlled parent ignores puts the native select back on the model', async () => {
    const onUpdate = vi.fn()
    mountSelect({ 'name': 'fruit', 'modelValue': 'Apple', 'onUpdate:modelValue': onUpdate }, { form: true })
    await flushPromises()
    await autofill('Cherry')
    expect(onUpdate).toHaveBeenCalledWith('Cherry', expect.objectContaining({ reason: 'autofill' }))
    expect(formValue()).toBe('Apple')
  })

  for (const withDisplayValue of [false, true]) {
    it(`dispatches change on every programmatic model change${withDisplayValue ? ' with displayValue' : ''}`, async () => {
      const onChange = vi.fn()
      const model = ref<string>()
      mount(defineComponent({
        setup: () => () => h('form', { onChange }, h(SelectRoot<string>, {
          'name': 'fruit',
          'modelValue': model.value,
          'onUpdate:modelValue': (value: string) => model.value = value,
          'displayValue': withDisplayValue ? (value: string) => value : undefined,
        }, () => [
          h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { 'data-testid': 'value' })),
          h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => fruits.map(value => h(SelectItem, { value }, () => h(SelectItemText, () => value))))),
        ])),
      }), { attachTo: document.body })
      await flushPromises()
      model.value = 'Cherry'
      await flushPromises()
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(formValue()).toBe('Cherry')
      model.value = 'Apple'
      await flushPromises()
      expect(onChange).toHaveBeenCalledTimes(2)
      expect(formValue()).toBe('Apple')
    })
  }

  it('closed-trigger typeahead with displayValue falls back to the registered labels', async () => {
    const onUpdate = vi.fn()
    mountSelect({ 'displayValue': (value: string) => value.toUpperCase(), 'onUpdate:modelValue': onUpdate })
    await flushPromises()
    // Nothing rendered yet, so nothing to match.
    await keydownOn(trigger(), 'b')
    expect(onUpdate).not.toHaveBeenCalled()

    await open()
    await keydownOn(document.activeElement!, 'Escape')
    await flushPromises()
    expect(isOpen()).toBe(false)
    await keydownOn(trigger(), 'c')
    expect(onUpdate).toHaveBeenCalledWith('Cherry', expect.objectContaining({ reason: 'typeahead' }))
    expect(valueText()).toBe('CHERRY')
  })

  it('reacts to a new displayValue', async () => {
    const displayValue = ref((value: string) => value.toUpperCase())
    mount(defineComponent({
      setup: () => () => h(SelectRoot<string>, { defaultValue: 'Cherry', displayValue: displayValue.value }, () => [
        h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { 'data-testid': 'value' })),
        h(SelectContent, () => fruits.map(value => h(SelectItem, { value }, () => h(SelectItemText, () => value)))),
      ]),
    }), { attachTo: document.body })
    await flushPromises()
    expect(valueText()).toBe('CHERRY')
    displayValue.value = (value: string) => `${value}!`
    await flushPromises()
    expect(valueText()).toBe('Cherry!')
  })

  // `useHideOthers` is a no-op under vitest (MODE === "test"), so only the backdrop and the scroll lock are asserted.
  it('a closed forceMount content keeps no backdrop or scroll lock', async () => {
    const open = ref(false)
    mount(defineComponent({
      setup: () => () => h('div', [
        h(SelectRoot, { 'open': open.value, 'onUpdate:open': (value: boolean) => open.value = value }, () => [
          h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { 'data-testid': 'value' })),
          h(SelectPortal, () => h(SelectContent, { position: 'popper', forceMount: true }, () => h(SelectViewport, () =>
            fruits.map(value => h(SelectItem, { value }, () => h(SelectItemText, () => value)))))),
        ]),
      ]),
    }), { attachTo: document.body })
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(document.querySelector('[data-reka-internal-backdrop]')).toBeNull()
    expect(isScrollLocked()).toBe(false)

    open.value = true
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(document.querySelector('[data-reka-internal-backdrop]')).not.toBeNull()
    expect(isScrollLocked()).toBe(true)

    open.value = false
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(document.querySelector('[data-reka-internal-backdrop]')).toBeNull()
    expect(isScrollLocked()).toBe(false)
  })

  it('pressing the trigger of an open popper select closes it with trigger-press', async () => {
    const onOpen = vi.fn()
    mountSelect({ 'onUpdate:open': onOpen })
    await open()
    expect(isOpen()).toBe(true)
    await new Promise(resolve => setTimeout(resolve, 20))
    await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false })
    await flushPromises()
    expect(isOpen()).toBe(false)
    expect(onOpen).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'trigger-press' }))
  })

  it('a trigger press that closes the select leaves no pointer position for the next keyboard open', async () => {
    const onUpdate = vi.fn()
    mountSelect({ 'onUpdate:modelValue': onUpdate })
    await open()
    await new Promise(resolve => setTimeout(resolve, 20))
    await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false, pageX: 5, pageY: 5 })
    await flushPromises()
    expect(isOpen()).toBe(false)
    // The release of that press lands after the content is gone.
    await fireEvent.pointerUp(trigger())

    await keydownOn(trigger(), 'Enter')
    expect(isOpen()).toBe(true)
    const item = option('Banana')
    item.focus()
    // A single stationary release selects: no stale press position arms the guard.
    await fireEvent.pointerUp(item)
    await flushPromises()
    expect(onUpdate).toHaveBeenCalledWith('Banana', expect.objectContaining({ reason: 'item-press' }))
  })

  it('a drag released inside a web component in the content does not close it', async () => {
    mountSelect()
    await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false, pageX: 5, pageY: 5 })
    await flushPromises()
    // An icon web component in the content (outside any item): the composed
    // target is inside its shadow root.
    const icon = document.createElement('x-select-icon')
    const inner = document.createElement('span')
    icon.attachShadow({ mode: 'open' }).appendChild(inner)
    document.querySelector('[role=listbox]')!.appendChild(icon)

    document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 200, clientY: 200 }))
    inner.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, composed: true, clientX: 200, clientY: 200 }))
    await flushPromises()
    expect(isOpen()).toBe(true)
  })

  it('re-pressing the selected value matched with by does not emit', async () => {
    const items = [{ id: 1, name: 'Apple' }, { id: 2, name: 'Banana' }]
    const onUpdate = vi.fn()
    mount(defineComponent({
      setup: () => () => h(SelectRoot, { 'by': 'id', 'defaultValue': { id: 2, name: 'Banana' }, 'onUpdate:modelValue': onUpdate }, () => [
        h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { 'data-testid': 'value' })),
        h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => items.map(value => h(SelectItem, { value }, () => h(SelectItemText, () => value.name))))),
      ]),
    }), { attachTo: document.body })
    await flushPromises()
    await open()
    await press(option('Banana'))
    expect(onUpdate).not.toHaveBeenCalled()
    expect(isOpen()).toBe(false)
  })

  it('re-registers an item label when only its text or disabled state changes', async () => {
    const label = ref('Cherry')
    const disabled = ref(true)
    mount(defineComponent({
      setup: () => () => h('form', h(SelectRoot, { name: 'fruit', defaultValue: 'Cherry' }, () => [
        h(SelectTrigger, { 'aria-label': 'Fruit' }, () => h(SelectValue, { 'data-testid': 'value' })),
        h(SelectContent, { position: 'popper' }, () => h(SelectViewport, () => fruits.map(value =>
          h(SelectItem, { value, disabled: value === 'Cherry' && disabled.value }, () =>
            h(SelectItemText, () => value === 'Cherry' ? label.value : value))))),
      ])),
    }), { attachTo: document.body })
    await flushPromises()
    const nativeCherry = () => Array.from(nativeSelect().options).find(option => option.value === 'Cherry')!
    expect(nativeCherry().disabled).toBe(true)

    disabled.value = false
    await flushPromises()
    expect(nativeCherry().disabled).toBe(false)

    label.value = 'Cherry!'
    await flushPromises()
    expect(valueText()).toBe('Cherry!')
    expect(nativeCherry().textContent?.trim()).toBe('Cherry!')
  })

  describe('trigger press that does not open', () => {
    function mountTrigger(rootProps: Parameters<typeof useSelectRoot<string>>[0]) {
      let api!: UseSelectRootReturn<string>
      mount(defineComponent({
        setup() {
          api = useSelectRoot<string>(rootProps)
          const { trigger } = useSelectTrigger({ context: api.context })
          return () => h('button', { ...trigger.attrs.value, 'type': 'button', 'aria-label': 'Fruit' })
        },
      }), { attachTo: document.body })
      return () => api
    }

    it('drops the pointer position when beforeUpdate:open cancels', async () => {
      const api = mountTrigger({ onBeforeUpdateOpen: (_value, details) => details.cancel() })
      await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false, pageX: 10, pageY: 10 })
      expect(api().open.value).toBe(false)
      expect(api().context.triggerPointerDownPosRef.value).toBeNull()
    })

    it('drops the pointer position when a controlled parent keeps it closed', async () => {
      const onUpdateOpen = vi.fn()
      const api = mountTrigger({ open: () => false, onUpdateOpen })
      await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false, pageX: 10, pageY: 10 })
      expect(onUpdateOpen).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press' }))
      await nextTick()
      expect(api().context.triggerPointerDownPosRef.value).toBeNull()
    })

    it('keeps the pointer position for an open that took', async () => {
      const api = mountTrigger({})
      await fireEvent.pointerDown(trigger(), { button: 0, ctrlKey: false })
      await nextTick()
      expect(api().open.value).toBe(true)
      expect(api().context.triggerPointerDownPosRef.value).not.toBeNull()
    })
  })
})

describe('exports', () => {
  it('exposes the composables from the package root but not the surface builders', () => {
    expect(typeof Reka.useSelectRoot).toBe('function')
    expect(typeof Reka.useSelectTrigger).toBe('function')
    expect(typeof Reka.useSelectContent).toBe('function')
    expect('getSelectContentSurface' in Reka).toBe(false)
  })
})
