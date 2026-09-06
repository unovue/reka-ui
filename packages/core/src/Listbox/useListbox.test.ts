import type { ListboxRootContext } from './ListboxRoot.vue'
import type { UseListboxRootProps, UseListboxRootReturn } from './useListbox'
import type { AcceptableValue } from '@/shared/types'
import { fireEvent, render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, shallowReactive } from 'vue'
import * as Reka from '../index'
import { ListboxContent, ListboxItem, ListboxRoot } from './index'
import { injectListboxRootContext } from './ListboxRoot.vue'
import { useListboxRoot } from './useListbox'

function noDataAttrs(props: Record<string, any>) {
  return Object.keys(props).every(k => !k.startsWith('data-'))
}

/** `useListboxRoot` owns a watcher, so it runs inside a mounted component. */
function harness<T extends AcceptableValue = string>(props: UseListboxRootProps<T> = {}) {
  let api!: UseListboxRootReturn<T>
  mount(defineComponent({
    setup() {
      api = useListboxRoot<T>(props)
      return () => null
    },
  }))
  return api
}

/**
 * A fake collection: real, connected elements (Enter checks `isConnected`, the
 * select protocol dispatches the `listbox.select` token on the click target).
 */
function createItems(values: string[]) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const items = values.map((value) => {
    const el = document.createElement('div')
    el.textContent = value
    container.appendChild(el)
    return { ref: el, value }
  })
  return { items, getItems: () => items }
}

/** Binds an item surface's handlers to its element, as a template `v-bind` would. */
function bindItem(api: UseListboxRootReturn<string>, item: { ref: HTMLElement, value: string }, options: { disabled?: boolean, onSelect?: (event: CustomEvent) => void } = {}) {
  const surface = api.getItemSurface(item.value, options.disabled, { element: item.ref, onSelect: options.onSelect })
  item.ref.addEventListener('click', event => surface.props.value.onClick(event))
  item.ref.addEventListener('keydown', event => surface.props.value.onKeydown(event))
  return surface
}

function keydown(key: string, init: KeyboardEventInit = {}) {
  return new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true, ...init })
}

describe('useListboxRoot — state & selection', () => {
  it('defaults: single, undefined value, vertical, ltr, toggle, focusable, uncontrolled', () => {
    const api = harness()
    expect(api.modelValue.value).toBeUndefined()
    expect(api.isControlled.value).toBe(false)
    expect(api.lastChangeDetails.value.reason).toBe('none')
    expect(api.highlightedElement.value).toBeNull()
    expect(api.context.multiple.value).toBe(false)
    expect(api.context.orientation.value).toBe('vertical')
    expect(api.context.dir.value).toBe('ltr')
    expect(api.context.selectionBehavior?.value).toBe('toggle')
    expect(api.context.highlightOnHover.value).toBe(false)
    expect(api.context.disabled.value).toBe(false)
    expect(api.context.focusable.value).toBe(true)
    expect(api.context.isVirtual.value).toBe(false)
  })

  it('defaults to [] when multiple and honours defaultValue', () => {
    expect(harness({ multiple: true }).modelValue.value).toEqual([])
    expect(harness({ defaultValue: 'a' }).modelValue.value).toBe('a')
  })

  it('single toggle: select() selects and re-selecting clears; reason imperative-action', () => {
    const api = harness()
    expect(api.select('a')).toBe(true)
    expect(api.modelValue.value).toBe('a')
    expect(api.isSelected('a')).toBe(true)
    expect(api.lastChangeDetails.value.reason).toBe('imperative-action')
    expect(api.select('a')).toBe(true)
    expect(api.modelValue.value).toBeUndefined()
  })

  it('single replace never clears', () => {
    const api = harness({ selectionBehavior: 'replace' })
    api.select('a')
    expect(api.select('a')).toBe(false)
    expect(api.modelValue.value).toBe('a')
  })

  it('multiple toggle adds/removes; multiple replace selects [value] and sets the range anchor', () => {
    const toggle = harness({ multiple: true })
    toggle.select('a')
    toggle.select('b')
    toggle.select('a')
    expect(toggle.modelValue.value).toEqual(['b'])

    const replace = harness({ multiple: true, selectionBehavior: 'replace' })
    replace.select('a')
    replace.select('b')
    expect(replace.modelValue.value).toEqual(['b'])
    expect(replace.context.firstValue?.value).toBe('b')
  })

  it('matches object values with `by` (a plain value, never called as a getter)', () => {
    const by = vi.fn((a: { id: number }, b: { id: number }) => a.id === b.id)
    const api = harness<{ id: number }>({ by, defaultValue: { id: 1 } })
    expect(api.isSelected({ id: 1 })).toBe(true)
    expect(api.context.by).toBe(by)
    expect(by).toHaveBeenCalledWith({ id: 1 }, { id: 1 })
  })

  it('controlled getter + emit: emits beforeUpdate/update with details and does not write locally', () => {
    const emit = vi.fn()
    const api = harness({ modelValue: () => 'a', emit })
    expect(api.isControlled.value).toBe(true)
    api.select('b')
    expect(api.modelValue.value).toBe('a')
    expect(emit).toHaveBeenNthCalledWith(1, 'beforeUpdate:modelValue', 'b', expect.objectContaining({ reason: 'imperative-action' }))
    expect(emit).toHaveBeenNthCalledWith(2, 'update:modelValue', 'b', expect.objectContaining({ reason: 'imperative-action' }))
  })

  it('the context modelValue is writable and routes through the model (ListboxVirtualizer parity)', () => {
    const onUpdate = vi.fn()
    const api = harness({ multiple: true, onUpdate })
    api.context.modelValue.value = ['a', 'b']
    expect(api.modelValue.value).toEqual(['a', 'b'])
    expect(onUpdate).toHaveBeenCalledWith(['a', 'b'], expect.objectContaining({ reason: 'imperative-action' }))
  })
})

describe('useListboxRoot — reasons', () => {
  it('item-press: a click on an item selects it with the MouseEvent', () => {
    const onUpdate = vi.fn()
    const { items, getItems } = createItems(['a', 'b'])
    const api = harness({ getItems, onUpdate })
    bindItem(api, items[1])
    items[1].ref.click()
    expect(api.modelValue.value).toBe('b')
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ reason: 'item-press' })
    expect(onUpdate.mock.calls[0][1].event).toBeInstanceOf(MouseEvent)
    // The pressed item is highlighted too.
    expect(api.highlightedElement.value).toBe(items[1].ref)
  })

  it('item-keydown: Space on an item selects it and prevents the default; other keys are ignored', () => {
    const onUpdate = vi.fn()
    const { items, getItems } = createItems(['a', 'b'])
    const api = harness({ getItems, onUpdate })
    bindItem(api, items[0])
    const other = keydown('Enter')
    items[0].ref.dispatchEvent(other)
    expect(other.defaultPrevented).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()

    const space = keydown(' ')
    items[0].ref.dispatchEvent(space)
    expect(space.defaultPrevented).toBe(true)
    expect(api.modelValue.value).toBe('a')
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ reason: 'item-keydown', event: space })
  })

  it('Enter on the content synthesizes a click on the highlighted item, so it arrives as item-press', () => {
    const onUpdate = vi.fn()
    const { items, getItems } = createItems(['a', 'b'])
    const api = harness({ getItems, onUpdate })
    bindItem(api, items[0])
    api.highlightItem('a')
    const enter = keydown('Enter')
    api.content.props.value.onKeydown(enter)
    expect(enter.defaultPrevented).toBe(true)
    expect(api.modelValue.value).toBe('a')
    expect(onUpdate.mock.calls[0][1].reason).toBe('item-press')
    expect(onUpdate.mock.calls[0][1].event).toBeInstanceOf(MouseEvent)
  })

  it('Enter with a modifier bubbles through untouched (no selection, no preventDefault)', () => {
    const onUpdate = vi.fn()
    const { items, getItems } = createItems(['a'])
    const api = harness({ getItems, onUpdate })
    bindItem(api, items[0])
    api.highlightItem('a')
    const enter = keydown('Enter', { ctrlKey: true })
    api.content.props.value.onKeydown(enter)
    expect(enter.defaultPrevented).toBe(false)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('select-all: Meta/Ctrl+A in a multiple listbox selects every item and highlights the last', () => {
    const onUpdate = vi.fn()
    const { items, getItems } = createItems(['a', 'b', 'c'])
    const api = harness({ multiple: true, getItems, onUpdate })
    const event = keydown('a', { ctrlKey: true })
    api.content.props.value.onKeydown(event)
    expect(event.defaultPrevented).toBe(true)
    expect(api.modelValue.value).toEqual(['a', 'b', 'c'])
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ reason: 'select-all', event })
    expect(api.highlightedElement.value).toBe(items[2].ref)
  })

  it('select-all is ignored in single mode', () => {
    const onUpdate = vi.fn()
    const { getItems } = createItems(['a', 'b'])
    const api = harness({ getItems, onUpdate })
    api.content.props.value.onKeydown(keydown('a', { metaKey: true }))
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('range-select: Shift+arrow extends a multiple + replace selection from the anchor', () => {
    const onUpdate = vi.fn()
    const { items, getItems } = createItems(['a', 'b', 'c'])
    const api = harness({ multiple: true, selectionBehavior: 'replace', getItems, onUpdate })
    bindItem(api, items[0])
    items[0].ref.click()
    expect(api.modelValue.value).toEqual(['a'])

    const event = keydown('ArrowDown', { shiftKey: true })
    api.content.props.value.onKeydown(event)
    expect(event.defaultPrevented).toBe(true)
    expect(api.modelValue.value).toEqual(['a', 'b'])
    expect(onUpdate.mock.calls[1][1]).toMatchObject({ reason: 'range-select', event })
    expect(api.highlightedElement.value).toBe(items[1].ref)

    api.content.props.value.onKeydown(keydown('End', { shiftKey: true }))
    expect(api.modelValue.value).toEqual(['a', 'b', 'c'])
  })

  it('a cancelled item-press keeps the selection; the highlight still follows the press', () => {
    const onUpdate = vi.fn()
    const { items, getItems } = createItems(['a', 'b'])
    const api = harness({
      defaultValue: 'a',
      getItems,
      onBeforeUpdate: (_value, details) => details.cancel(),
      onUpdate,
    })
    const surface = bindItem(api, items[1])
    items[1].ref.click()
    expect(api.modelValue.value).toBe('a')
    expect(onUpdate).not.toHaveBeenCalled()
    expect(api.lastChangeDetails.value).toMatchObject({ reason: 'item-press', isCanceled: true })
    expect(surface.state.value.state).toBe('unchecked')
    // Highlight is not part of the model: the pressed item is highlighted as before.
    expect(api.highlightedElement.value).toBe(items[1].ref)
  })

  it('a prevented `select` custom event blocks the selection', () => {
    const onUpdate = vi.fn()
    const { items, getItems } = createItems(['a'])
    const api = harness({ getItems, onUpdate })
    const onSelect = vi.fn((event: CustomEvent) => event.preventDefault())
    bindItem(api, items[0], { onSelect })
    items[0].ref.click()
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0].detail).toMatchObject({ value: 'a' })
    expect(onUpdate).not.toHaveBeenCalled()
    expect(api.modelValue.value).toBeUndefined()
  })

  it('a disabled item does not select', () => {
    const onUpdate = vi.fn()
    const { items, getItems } = createItems(['a'])
    const api = harness({ getItems, onUpdate })
    bindItem(api, items[0], { disabled: true })
    items[0].ref.click()
    expect(onUpdate).not.toHaveBeenCalled()
  })
})

describe('useListboxRoot — navigation intent', () => {
  it('default mapping: arrows move the highlight, orientation/dir aware', () => {
    const { items, getItems } = createItems(['a', 'b', 'c'])
    const api = harness({ getItems })
    api.highlightItem('a')
    expect(api.context.onKeydownNavigation(keydown('ArrowDown'))).toBe(true)
    expect(api.highlightedElement.value).toBe(items[1].ref)
    // Left/right are not navigation keys in a vertical listbox.
    expect(api.context.onKeydownNavigation(keydown('ArrowRight'))).toBe(false)
    expect(api.highlightedElement.value).toBe(items[1].ref)
    expect(api.context.onKeydownNavigation(keydown('End'))).toBe(true)
    expect(api.highlightedElement.value).toBe(items[2].ref)
    expect(api.context.onKeydownNavigation(keydown('Home'))).toBe(true)
    expect(api.highlightedElement.value).toBe(items[0].ref)

    const rtl = harness({ orientation: 'horizontal', dir: 'rtl' })
    expect(rtl.context.getNavigationIntent(keydown('ArrowRight'))).toBe('prev')
    expect(rtl.context.getNavigationIntent(keydown('ArrowUp'))).toBeUndefined()
  })

  it('getNavigationIntent override: undefined falls through, null opts out, a move intent navigates', () => {
    const { items, getItems } = createItems(['a', 'b', 'c'])
    const api = harness({
      getItems,
      getNavigationIntent: (event) => {
        if (event.key === 'ArrowDown')
          return null
        if (event.key === 'j')
          return 'next'
        return undefined
      },
    })
    api.highlightItem('a')
    const down = keydown('ArrowDown')
    api.content.props.value.onKeydown(down)
    expect(down.defaultPrevented).toBe(false)
    expect(api.highlightedElement.value).toBe(items[0].ref)

    const j = keydown('j')
    api.content.props.value.onKeydown(j)
    expect(j.defaultPrevented).toBe(true)
    expect(api.highlightedElement.value).toBe(items[1].ref)

    // Untouched keys keep the default mapping.
    api.content.props.value.onKeydown(keydown('ArrowUp'))
    expect(api.highlightedElement.value).toBe(items[0].ref)
  })

  it('a `select` intent runs the Enter path exactly once', () => {
    const onUpdate = vi.fn()
    const { items, getItems } = createItems(['a', 'b'])
    const api = harness({ getItems, onUpdate, getNavigationIntent: event => event.key === 'x' ? 'select' : undefined })
    bindItem(api, items[0])
    api.highlightItem('a')
    const x = keydown('x')
    api.content.props.value.onKeydown(x)
    expect(x.defaultPrevented).toBe(true)
    expect(api.modelValue.value).toBe('a')
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][1].reason).toBe('item-press')
  })

  it('navigation is skipped while the content is not focusable (a filter owns the keyboard)', () => {
    const { items, getItems } = createItems(['a', 'b'])
    const api = harness({ getItems })
    api.highlightItem('a')
    api.context.focusable.value = false
    const down = keydown('ArrowDown')
    api.content.props.value.onKeydown(down)
    expect(down.defaultPrevented).toBe(false)
    expect(api.highlightedElement.value).toBe(items[0].ref)
  })

  it('highlightSelected targets the checked item, or the first one', async () => {
    const { items, getItems } = createItems(['a', 'b', 'c'])
    const api = harness({ getItems })
    items[1].ref.dataset.state = 'checked'
    await api.highlightSelected()
    expect(api.highlightedElement.value).toBe(items[1].ref)
  })
})

describe('useListboxRoot — label registry', () => {
  it('registers by identity, last write wins, and never removes an entry', () => {
    const api = harness<{ id: number, name: string }>({ by: 'id' })
    api.labels.register({ id: 1, name: 'one' }, 'One')
    api.labels.register({ id: 2, name: 'two' }, 'Two', true)
    expect(api.labels.get({ id: 1, name: 'whatever' })).toBe('One')
    expect(api.labels.get({ id: 3, name: 'three' })).toBeUndefined()

    api.labels.register({ id: 1, name: 'one' }, 'Uno')
    expect(api.labels.get({ id: 1, name: 'one' })).toBe('Uno')
    expect(api.labels.entries()).toEqual([
      { value: { id: 1, name: 'one' }, label: 'Uno', disabled: false },
      { value: { id: 2, name: 'two' }, label: 'Two', disabled: true },
    ])
    expect('unregister' in api.labels).toBe(false)
    expect(api.context.labels).toBe(api.labels)
  })

  it('honours a function `by` for string values', () => {
    const api = harness<string>({ by: (a, b) => a.toLowerCase() === b.toLowerCase() })
    api.labels.register('Apple', 'Apple')
    expect(api.labels.get('APPLE')).toBe('Apple')
    api.labels.register('apple', 'apple', true)
    expect(api.labels.entries()).toEqual([{ value: 'apple', label: 'apple', disabled: true }])
  })

  it('indexes primitive identities (plain values and a key `by`) without a scan', () => {
    const plain = harness<string>()
    plain.labels.register('a', 'A')
    plain.labels.register('b', 'B')
    plain.labels.register('a', 'A2')
    expect(plain.labels.get('a')).toBe('A2')
    expect(plain.labels.get('c')).toBeUndefined()
    expect(plain.labels.entries().map(i => i.label)).toEqual(['A2', 'B'])

    const keyed = harness<{ id: number }>({ by: 'id' })
    keyed.labels.register({ id: 1 }, 'One')
    keyed.labels.register({ id: 1 }, 'Uno')
    expect(keyed.labels.entries()).toEqual([{ value: { id: 1 }, label: 'Uno', disabled: false }])
  })

  it('is sticky through the SFCs: an unmounted ListboxItem keeps its label', async () => {
    let context!: ListboxRootContext<AcceptableValue>
    const Probe = defineComponent({
      setup() {
        context = injectListboxRootContext()
        return () => null
      },
    })
    const App = defineComponent({
      props: { showBanana: Boolean },
      setup(props) {
        return () => h(ListboxRoot, null, () => [
          h(ListboxItem, { value: 'apple', textValue: 'Apple label' }, () => 'Apple'),
          props.showBanana ? h(ListboxItem, { value: 'banana' }, () => 'Banana') : null,
          h(Probe),
        ])
      },
    })
    const wrapper = mount(App, { props: { showBanana: true }, attachTo: document.body })
    expect(context.labels.get('apple')).toBe('Apple label')
    expect(context.labels.get('banana')).toBe('Banana')
    await wrapper.setProps({ showBanana: false })
    expect(wrapper.findAll('[role=option]')).toHaveLength(1)
    expect(context.labels.get('banana')).toBe('Banana')
    wrapper.unmount()
  })

  it('follows `textValue`, slot text and `disabled` changes of a mounted ListboxItem', async () => {
    let context!: ListboxRootContext<AcceptableValue>
    const Probe = defineComponent({
      setup() {
        context = injectListboxRootContext()
        return () => null
      },
    })
    const App = defineComponent({
      props: { textValue: String, text: { type: String, default: 'Cherry' }, disabled: Boolean },
      setup(props) {
        return () => h(ListboxRoot, null, () => [
          h(ListboxItem, { value: 'cherry', textValue: props.textValue, disabled: props.disabled }, () => props.text),
          h(Probe),
        ])
      },
    })
    const wrapper = mount(App, { attachTo: document.body })
    expect(context.labels.entries()).toEqual([{ value: 'cherry', label: 'Cherry', disabled: false }])
    await wrapper.setProps({ text: 'Cerise' })
    expect(context.labels.get('cherry')).toBe('Cerise')
    await wrapper.setProps({ textValue: 'Cherry label' })
    expect(context.labels.get('cherry')).toBe('Cherry label')
    await wrapper.setProps({ disabled: true })
    expect(context.labels.entries()).toEqual([{ value: 'cherry', label: 'Cherry label', disabled: true }])
    wrapper.unmount()
  })
})

describe('useListboxRoot — surfaces', () => {
  it('item props carry role/tabindex/aria-selected/disabled/handlers and NO data-*; attrs add the state', () => {
    const { items, getItems } = createItems(['a', 'b'])
    const api = harness({ getItems, defaultValue: 'a' })
    const a = api.getItemSurface('a', undefined, { element: items[0].ref, id: 'item-a' })
    expect(a.props.value).toMatchObject({ 'id': 'item-a', 'role': 'option', 'tabindex': '-1', 'aria-selected': true, 'disabled': undefined })
    expect(noDataAttrs(a.props.value)).toBe(true)
    expect(typeof a.props.value.onClick).toBe('function')
    expect(typeof a.props.value.onKeydown).toBe('function')
    expect(typeof a.props.value.onPointermove).toBe('function')
    expect(a.state.value).toEqual({ state: 'checked', disabled: false, highlighted: false })
    expect(a.attrs.value['data-state']).toBe('checked')
    expect(a.attrs.value).not.toHaveProperty('data-highlighted')
    expect(a.attrs.value).not.toHaveProperty('data-disabled')

    api.highlightItem('a')
    expect(a.props.value.tabindex).toBe('0')
    expect(a.state.value.highlighted).toBe(true)
    expect(a.attrs.value['data-highlighted']).toBe('')

    const b = api.getItemSurface('b', true, { element: items[1].ref })
    expect(b.props.value).not.toHaveProperty('id')
    expect(b.props.value.disabled).toBe('')
    expect(b.attrs.value['data-disabled']).toBe('')
    expect(b.attrs.value['data-state']).toBe('unchecked')

    api.context.focusable.value = false
    expect(a.props.value.tabindex).toBe(-1)
  })

  it('a root `disabled` disables every item', () => {
    const api = harness({ disabled: true })
    expect(api.getItemSurface('a').state.value.disabled).toBe(true)
    expect(api.root.attrs.value['data-disabled']).toBe('')
    expect(noDataAttrs(api.root.props.value)).toBe(true)
    expect(api.root.props.value.dir).toBe('ltr')
  })

  it('onPointermove highlights on hover without focusing, only when highlightOnHover is on', () => {
    const onHighlight = vi.fn()
    const { items, getItems } = createItems(['a', 'b'])
    const off = harness({ getItems })
    off.getItemSurface('a', undefined, { element: items[0].ref }).props.value.onPointermove()
    expect(off.highlightedElement.value).toBeNull()

    const on = harness({ getItems, highlightOnHover: true, onHighlight })
    on.getItemSurface('b', undefined, { element: items[1].ref }).props.value.onPointermove()
    expect(on.highlightedElement.value).toBe(items[1].ref)
    expect(onHighlight).toHaveBeenCalledWith(items[1])
  })

  it('content props carry role/tabindex/aria and NO data-*; attrs add data-orientation', () => {
    const api = harness({ multiple: true, orientation: 'horizontal' })
    expect(api.content.props.value).toMatchObject({ 'role': 'listbox', 'tabindex': '0', 'aria-orientation': 'horizontal', 'aria-multiselectable': true })
    expect(noDataAttrs(api.content.props.value)).toBe(true)
    expect(api.content.attrs.value['data-orientation']).toBe('horizontal')
    expect(api.content.state.value).toEqual({ orientation: 'horizontal' })
  })

  it('a left mousedown suppresses the keyboard entry highlight of the focus that follows', () => {
    const onEntryFocus = vi.fn()
    const { getItems } = createItems(['a', 'b'])
    const api = harness({ getItems, onEntryFocus })
    api.content.props.value.onMousedown(new MouseEvent('mousedown', { button: 0 }))
    api.content.props.value.onFocus(new FocusEvent('focus'))
    expect(onEntryFocus).not.toHaveBeenCalled()
    expect(api.highlightedElement.value).toBeNull()
  })

  it('a keyboard focus dispatches the cancellable entryFocus event and highlights the first item', () => {
    const onEntryFocus = vi.fn()
    const { items, getItems } = createItems(['a', 'b'])
    const api = harness({ getItems, onEntryFocus })
    // A right-button mousedown is not a click focus (`.left` guard).
    api.content.props.value.onMousedown(new MouseEvent('mousedown', { button: 2 }))
    const el = document.createElement('div')
    el.addEventListener('focus', api.content.props.value.onFocus)
    document.body.appendChild(el)
    el.dispatchEvent(new FocusEvent('focus'))
    expect(onEntryFocus).toHaveBeenCalledTimes(1)
    expect(onEntryFocus.mock.calls[0][0].type).toBe('listbox.entryFocus')
    expect(api.highlightedElement.value).toBe(items[0].ref)
    expect(api.content.props.value.tabindex).toBe('-1')
  })

  it('a prevented entryFocus event keeps the highlight untouched', () => {
    const { getItems } = createItems(['a'])
    const api = harness({ getItems, onEntryFocus: event => event.preventDefault() })
    const el = document.createElement('div')
    el.addEventListener('focus', api.content.props.value.onFocus)
    document.body.appendChild(el)
    el.dispatchEvent(new FocusEvent('focus'))
    expect(api.highlightedElement.value).toBeNull()
  })

  it('onLeave clears the highlight and reports it', () => {
    const onLeave = vi.fn()
    const { items, getItems } = createItems(['a'])
    const api = harness({ getItems, onLeave })
    api.highlightItem('a')
    const event = new Event('pointerleave')
    api.root.props.value.onPointerleave(event)
    expect(api.highlightedElement.value).toBeNull()
    expect(onLeave).toHaveBeenCalledWith(event)
    expect(items[0].ref.isConnected).toBe(true)
  })
})

describe('useListboxRoot — rendered', () => {
  // A standalone consumer binding the surfaces to plain elements, handing in
  // its own item elements in place of the Collection wrappers.
  const Fixture = defineComponent({
    props: { multiple: Boolean },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const values = ['Apple', 'Banana', 'Cherry']
      const elements = shallowReactive<Record<string, HTMLElement | undefined>>({})
      const listbox = useListboxRoot<string>({
        multiple: () => props.multiple,
        getItems: () => values.flatMap(value => elements[value] ? [{ ref: elements[value]!, value }] : []),
        onUpdate: (value, details) => emit('update:modelValue', value, details),
      })
      const items = values.map(value => ({
        value,
        surface: listbox.getItemSurface(value, undefined, { element: () => elements[value], id: `item-${value}` }),
      }))
      function setElement(value: string, el: unknown) {
        elements[value] = (el as HTMLElement | null) ?? undefined
      }
      return { listbox, items, setElement }
    },
    template: `
      <div v-bind="listbox.root.attrs.value">
        <div v-bind="listbox.content.attrs.value" aria-label="Fruits">
          <div v-for="item in items" :key="item.value" :ref="el => setElement(item.value, el)" v-bind="item.surface.attrs.value">{{ item.value }}</div>
        </div>
      </div>
    `,
  })

  it('renders role/aria/data-*, selects on click and keyboard, and passes axe', async () => {
    const { container, getByRole, getAllByRole, emitted } = render(Fixture)
    // watcher → nextTick → highlightSelected (await nextTick) → changeHighlight → re-render
    await new Promise(resolve => setTimeout(resolve, 0))
    await nextTick()
    const listbox = getByRole('listbox')
    const [apple, banana, cherry] = getAllByRole('option')
    expect(apple.id).toBe('item-Apple')
    expect(apple.getAttribute('aria-selected')).toBe('false')
    expect(apple.getAttribute('data-state')).toBe('unchecked')
    // The mount highlight sets the roving target without focusing it.
    expect(apple.getAttribute('data-highlighted')).toBe('')
    expect(apple.getAttribute('tabindex')).toBe('0')
    expect(listbox.getAttribute('tabindex')).toBe('-1')
    expect(listbox.getAttribute('aria-multiselectable')).toBe('false')
    expect(listbox.getAttribute('data-orientation')).toBe('vertical')
    expect(document.activeElement).not.toBe(apple)
    expect(await axe(container)).toHaveNoViolations()

    await fireEvent.click(banana)
    expect(banana.getAttribute('aria-selected')).toBe('true')
    expect(banana.getAttribute('data-state')).toBe('checked')
    expect(banana.getAttribute('data-highlighted')).toBe('')
    expect(apple.getAttribute('data-highlighted')).toBeNull()
    expect(emitted('update:modelValue')?.[0]?.[0]).toBe('Banana')
    expect(emitted('update:modelValue')?.[0]?.[1]).toMatchObject({ reason: 'item-press' })

    await fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    expect(cherry.getAttribute('data-highlighted')).toBe('')
    await fireEvent.keyDown(listbox, { key: 'Enter' })
    expect(cherry.getAttribute('data-state')).toBe('checked')
    expect(banana.getAttribute('data-state')).toBe('unchecked')
    expect(emitted('update:modelValue')?.[1]?.[1]).toMatchObject({ reason: 'item-press' })
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('listboxRoot — change details through the SFCs', () => {
  const Group = defineComponent({
    components: { ListboxContent, ListboxItem, ListboxRoot },
    props: { modelValue: String, cancel: Boolean },
    emits: ['beforeUpdate:modelValue', 'update:modelValue'],
    template: `
      <ListboxRoot
        :model-value="modelValue"
        :get-navigation-intent="e => e.key === 'j' ? 'next' : undefined"
        @before-update:model-value="(v, d) => { $emit('beforeUpdate:modelValue', v, d); if (cancel) d.cancel() }"
        @update:model-value="(v, d) => $emit('update:modelValue', v, d)"
      >
        <ListboxContent aria-label="Letters">
          <ListboxItem value="a">A</ListboxItem>
          <ListboxItem value="b">B</ListboxItem>
        </ListboxContent>
      </ListboxRoot>
    `,
  })

  it('emits beforeUpdate then update with the reason and the native event', async () => {
    const wrapper = mount(Group, { attachTo: document.body })
    const items = wrapper.findAll('[role=option]')
    await items[1].trigger('click')
    expect(wrapper.emitted('beforeUpdate:modelValue')?.[0]?.[0]).toBe('b')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe('b')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[1]).toMatchObject({ reason: 'item-press' })
    expect(wrapper.emitted('update:modelValue')?.[0]?.[1].event).toBeInstanceOf(MouseEvent)
    expect(items[1].attributes('aria-selected')).toBe('true')
    wrapper.unmount()
  })

  it('cancel() in beforeUpdate keeps the current value', async () => {
    const wrapper = mount(Group, { props: { modelValue: 'a', cancel: true }, attachTo: document.body })
    const items = wrapper.findAll('[role=option]')
    await items[1].trigger('click')
    expect(wrapper.emitted('beforeUpdate:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(items[0].attributes('aria-selected')).toBe('true')
    expect(items[1].attributes('aria-selected')).toBe('false')
    wrapper.unmount()
  })

  it('the getNavigationIntent prop drives keyboard navigation', async () => {
    const wrapper = mount(Group, { attachTo: document.body })
    const content = wrapper.find('[role=listbox]')
    const items = wrapper.findAll('[role=option]')
    await content.trigger('focus')
    expect(items[0].attributes('data-highlighted')).toBe('')
    await content.trigger('keydown', { key: 'j' })
    expect(items[1].attributes('data-highlighted')).toBe('')
    expect(items[0].attributes('data-highlighted')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('useListboxRoot — public export', () => {
  it('is exported from the package barrel; the surface builders are internal', () => {
    expect(typeof Reka.useListboxRoot).toBe('function')
    expect('getListboxItemSurface' in Reka).toBe(false)
    expect('getListboxContentSurface' in Reka).toBe(false)
  })
})
