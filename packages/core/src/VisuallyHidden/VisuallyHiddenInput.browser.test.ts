import type { VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ComboboxInput, ComboboxRoot } from '@/Combobox'
import { ListboxContent, ListboxItem, ListboxRoot } from '@/Listbox'
import { NumberFieldInput, NumberFieldRoot } from '@/NumberField'
import { RadioGroupItem, RadioGroupRoot } from '@/RadioGroup'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'

/** What the form would send, and whether the browser would let it submit. */
function submission(form: HTMLFormElement) {
  return {
    data: [...new FormData(form)],
    valid: form.checkValidity(),
    valueMissing: [...form.elements].filter((el): el is HTMLInputElement => el instanceof HTMLInputElement && !!el.name).map(el => el.validity.valueMissing),
  }
}

const empty = { data: [['field', '']], valid: false, valueMissing: [true] }
const filled = (value: string) => ({ data: [['field', value]], valid: true, valueMissing: [false] })

function mountForm(render: () => VNode | VNode[]) {
  const wrapper = mount(defineComponent({
    setup: () => () => h('form', { onSubmit: (event: Event) => event.preventDefault() }, [
      render(),
      h('button', { 'type': 'button', 'data-testid': 'outside' }, 'Outside'),
    ]),
  }), { attachTo: document.body })
  return wrapper.element as HTMLFormElement
}

describe('a required, named component whose value is emptied, in a real browser', () => {
  it('listbox: deselecting the selected item submits an empty value and fails validation', async () => {
    const form = mountForm(() => h(ListboxRoot, { name: 'field', required: true }, () => h(ListboxContent, () => [
      h(ListboxItem, { value: 'apple' }, () => 'Apple'),
      h(ListboxItem, { value: 'banana' }, () => 'Banana'),
    ])))
    const option = form.querySelector<HTMLElement>('[role="option"]')!
    expect(submission(form)).toEqual(empty)

    await userEvent.click(option)
    await expect.poll(() => submission(form)).toEqual(filled('apple'))

    await userEvent.click(option)
    await expect.poll(() => option.getAttribute('aria-selected')).toBe('false')
    await nextTick()
    expect(submission(form)).toEqual(empty)
  })

  it('toggleGroup: unpressing the pressed item submits an empty value and fails validation', async () => {
    const form = mountForm(() => h(ToggleGroupRoot, { name: 'field', required: true, type: 'single' }, () => [
      h(ToggleGroupItem, { value: 'bold' }, () => 'Bold'),
      h(ToggleGroupItem, { value: 'italic' }, () => 'Italic'),
    ]))
    const item = form.querySelector<HTMLElement>('button:not([data-testid])')!
    expect(submission(form)).toEqual(empty)

    await userEvent.click(item)
    await expect.poll(() => submission(form)).toEqual(filled('bold'))

    await userEvent.click(item)
    await expect.poll(() => item.getAttribute('data-state')).toBe('off')
    await nextTick()
    expect(submission(form)).toEqual(empty)
  })

  it('numberField: clearing the typed number submits an empty value and fails validation', async () => {
    const form = mountForm(() => h(NumberFieldRoot, { name: 'field', required: true }, () => h(NumberFieldInput, { 'data-testid': 'input' })))
    const input = form.querySelector<HTMLInputElement>('[data-testid="input"]')!
    const outside = form.querySelector<HTMLElement>('[data-testid="outside"]')!
    expect(submission(form)).toEqual(empty)

    await userEvent.fill(input, '5')
    await userEvent.click(outside)
    await expect.poll(() => submission(form)).toEqual(filled('5'))

    await userEvent.clear(input)
    await userEvent.click(outside)
    await expect.poll(() => submission(form).data).not.toEqual([['field', '5']])
    await nextTick()
    expect(submission(form)).toEqual(empty)
  })

  it.each([
    ['combobox', (model: unknown) => h(ComboboxRoot, { name: 'field', required: true, modelValue: model as string }, () => h(ComboboxInput))],
    ['radioGroup', (model: unknown) => h(RadioGroupRoot, { name: 'field', required: true, modelValue: model as string }, () => [
      h(RadioGroupItem, { 'value': 'apple', 'aria-label': 'Apple' }),
      h(RadioGroupItem, { 'value': 'banana', 'aria-label': 'Banana' }),
    ])],
  ])('%s: a model set to undefined or null submits an empty value and fails validation', async (_name, render) => {
    const model = ref<string | null | undefined>('apple')
    const form = mountForm(() => render(model.value))
    await expect.poll(() => submission(form)).toEqual(filled('apple'))

    for (const cleared of [undefined, null]) {
      model.value = cleared
      await nextTick()
      await nextTick()
      expect(submission(form)).toEqual(empty)

      model.value = 'apple'
      await nextTick()
      await nextTick()
      expect(submission(form)).toEqual(filled('apple'))
    }
  })
})
