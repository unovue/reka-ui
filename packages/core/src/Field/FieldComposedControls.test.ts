import { flushPromises, mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { CheckboxRoot } from '@/Checkbox'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '@/Combobox'
import { DateFieldInput, DateFieldRoot } from '@/DateField'
import { DatePickerContent, DatePickerField, DatePickerInput, DatePickerRoot } from '@/DatePicker'
import { FormRoot } from '@/Form'
import { ListboxContent, ListboxItem, ListboxRoot } from '@/Listbox'
import { SelectContent, SelectItem, SelectPortal, SelectRoot, SelectTrigger, SelectViewport } from '@/Select'
import { TagGroupItem, TagGroupRoot } from '@/TagGroup'
import { FieldLabel, FieldRoot } from '.'

// Older controls (Checkbox, Select, DateField, TagGroup) composed inside
// another control of the same field: the outer control owns the field, and
// the inner ones neither register nor take the field's id.

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  window.HTMLElement.prototype.releasePointerCapture ??= vi.fn()
  window.HTMLElement.prototype.hasPointerCapture ??= vi.fn()
  window.HTMLElement.prototype.scrollIntoView ??= vi.fn()
})

const fruits = ['a', 'b', 'c']

function mountInField(control: () => ReturnType<typeof h>) {
  const onFormSubmit = vi.fn()
  const wrapper = mount(defineComponent(() => () =>
    h(FormRoot, { onFormSubmit }, () => [
      h(FieldRoot, { 'name': 'fruits', 'data-testid': 'field' }, () => [h(FieldLabel, () => 'Fruits'), control()]),
      h('button', { type: 'submit' }, 'Submit'),
    ])), { attachTo: document.body })
  const fieldIdCount = () => {
    const id = document.querySelector('label')!.getAttribute('for')
    return document.querySelectorAll(`[id="${id}"]`).length
  }
  return { wrapper, onFormSubmit, fieldIdCount }
}

describe('a Checkbox inside each item of a Field-wrapped control', () => {
  it('leaves a multiple Combobox the field\'s control, after its items mount and unmount', async () => {
    const { wrapper, onFormSubmit, fieldIdCount } = mountInField(() =>
      h(ComboboxRoot, { multiple: true, defaultValue: ['a'] }, () => [
        h(ComboboxAnchor, () => [h(ComboboxInput), h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open')]),
        h(ComboboxPortal, () => h(ComboboxContent, () => h(ComboboxViewport, () =>
          fruits.map(fruit => h(ComboboxItem, { value: fruit }, () => [h(CheckboxRoot, { 'data-testid': `checkbox-${fruit}` }), fruit]))))),
      ]))
    await flushPromises()
    await wrapper.find('[data-testid="trigger"]').trigger('click')
    await flushPromises()
    expect(document.querySelectorAll('[role="checkbox"]').length).toBe(3)
    expect(fieldIdCount()).toBe(1)
    expect(Array.from(document.querySelectorAll('[role="checkbox"]')).every(checkbox => !checkbox.hasAttribute('aria-labelledby'))).toBe(true)

    await wrapper.find('[data-testid="trigger"]').trigger('click')
    await flushPromises()
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(onFormSubmit).toHaveBeenCalledTimes(1)
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ fruits: ['a'] })
    wrapper.unmount()
  })

  it('leaves a Listbox the field\'s control', async () => {
    const { wrapper, onFormSubmit, fieldIdCount } = mountInField(() =>
      h(ListboxRoot, { multiple: true, defaultValue: ['b'] }, () => h(ListboxContent, () =>
        fruits.map(fruit => h(ListboxItem, { value: fruit }, () => [h(CheckboxRoot), fruit])))))
    await flushPromises()
    expect(fieldIdCount()).toBe(1)
    expect(document.querySelector(`#${document.querySelector('label')!.getAttribute('for')}`)!.getAttribute('role')).toBe('listbox')
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ fruits: ['b'] })
    wrapper.unmount()
  })

  it('leaves a Select the field\'s control', async () => {
    const { wrapper, onFormSubmit, fieldIdCount } = mountInField(() =>
      h(SelectRoot, { defaultValue: 'c', defaultOpen: true }, () => [
        h(SelectTrigger, () => 'Fruit'),
        h(SelectPortal, () => h(SelectContent, () => h(SelectViewport, () =>
          fruits.map(fruit => h(SelectItem, { value: fruit }, () => [h(CheckboxRoot), fruit]))))),
      ]))
    await flushPromises()
    expect(fieldIdCount()).toBe(1)
    expect(document.querySelector(`#${document.querySelector('label')!.getAttribute('for')}`)!.getAttribute('role')).toBe('combobox')
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ fruits: 'c' })
    wrapper.unmount()
  })
})

describe('a Checkbox in a Field-wrapped DatePicker\'s calendar', () => {
  it('leaves the date field the field\'s control', async () => {
    const { wrapper, fieldIdCount } = mountInField(() =>
      h(DatePickerRoot, { defaultOpen: true, granularity: 'day' }, () => [
        h(DatePickerField, null, { default: ({ segments }: any) => segments.map((s: any) => h(DatePickerInput, { key: s.part, part: s.part }, () => s.value)) }),
        h(DatePickerContent, () => h(CheckboxRoot, { 'data-testid': 'in-calendar' })),
      ]))
    await flushPromises()
    expect(document.querySelector('[data-testid="in-calendar"]')).not.toBeNull()
    expect(fieldIdCount()).toBe(1)
    expect(document.querySelector('[data-testid="in-calendar"]')!.hasAttribute('aria-labelledby')).toBe(false)
    wrapper.unmount()
  })
})

describe('older controls composed inside a Field-wrapped Listbox', () => {
  it('a DateField or TagGroup in an item does not take over the field', async () => {
    const { wrapper, onFormSubmit, fieldIdCount } = mountInField(() =>
      h(ListboxRoot, { defaultValue: 'a' }, () => h(ListboxContent, () => [
        h(ListboxItem, { value: 'a' }, () => h(DateFieldRoot as any, { granularity: 'day' }, {
          default: ({ segments }: any) => segments.map((s: any) => h(DateFieldInput, { key: s.part, part: s.part }, () => s.value)),
        })),
        h(ListboxItem, { value: 'b' }, () => h(TagGroupRoot, { 'aria-label': 'Tags' }, () => h(TagGroupItem, { value: 'x' }, () => 'x'))),
      ])))
    await flushPromises()
    expect(fieldIdCount()).toBe(1)
    expect(document.querySelector('[role="group"]')!.hasAttribute('aria-labelledby')).toBe(false)
    expect(document.querySelectorAll('[name="fruits"]').length).toBe(1)
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ fruits: 'a' })
    wrapper.unmount()
  })
})
