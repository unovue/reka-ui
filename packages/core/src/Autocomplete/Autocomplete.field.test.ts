import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { FieldControl, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { AutocompleteAnchor, AutocompleteContent, AutocompleteInput, AutocompleteItem, AutocompletePortal, AutocompleteRoot, AutocompleteTrigger, AutocompleteViewport } from '.'

const fruits = ['Apple', 'Banana', 'Cherry']

function renderAutocomplete(props: Record<string, unknown>) {
  return h(AutocompleteRoot, props, () => [
    h(AutocompleteAnchor, () => [
      h(AutocompleteInput, { 'data-testid': 'input' }),
      h(AutocompleteTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
    ]),
    h(AutocompletePortal, () => h(AutocompleteContent, () => h(AutocompleteViewport, () =>
      fruits.map(fruit => h(AutocompleteItem, { value: fruit }, () => fruit))))),
  ])
}

const input = (wrapper: VueWrapper) => wrapper.find('[data-testid="input"]').element as HTMLInputElement

describeFieldControlContract({
  name: 'Autocomplete',
  render: renderAutocomplete,
  control: input,
  // Typing is the value: the input text, selected or not.
  interact: wrapper => wrapper.find('[data-testid="input"]').setValue('Kiwi'),
  interactedValue: 'Kiwi',
  emptyValue: '',
  filledValue: 'Apple',
})

describe('given a Field-wrapped Autocomplete', () => {
  function mountInField(onFormSubmit: (values: Record<string, unknown>) => void) {
    const model = ref('')
    const Harness = defineComponent({
      setup: () => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { 'name': 'fruit', 'data-testid': 'field' }, () => [
          h(FieldLabel, () => 'Fruit'),
          renderAutocomplete({ 'modelValue': model.value, 'onUpdate:modelValue': (value: string) => { model.value = value } }),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    return { wrapper, field: () => wrapper.find('[data-testid="field"]') }
  }

  it('submits the selected item\'s text as user input', async () => {
    const onFormSubmit = vi.fn()
    const { wrapper, field } = mountInField(onFormSubmit)
    await nextTick()
    await wrapper.find('[data-testid="trigger"]').trigger('click')
    await flushPromises()
    const item = Array.from(document.querySelectorAll('[role="option"]')).find(option => option.textContent === 'Cherry') as HTMLElement
    item.click()
    await flushPromises()
    expect(field().attributes('data-dirty')).toBe('')

    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ fruit: 'Cherry' })
    wrapper.unmount()
  })

  it('isn\'t touched by opening the list, only once focus leaves the autocomplete', async () => {
    const { wrapper, field } = mountInField(vi.fn())
    await nextTick()
    input(wrapper).focus()
    await wrapper.find('[data-testid="input"]').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(input(wrapper).getAttribute('aria-expanded')).toBe('true')
    ;(wrapper.find('[data-testid="trigger"]').element as HTMLElement).focus()
    await nextTick()
    expect(field().attributes('data-touched')).toBeUndefined()
    expect(field().attributes('data-focused')).toBe('')

    ;(wrapper.find('[data-testid="trigger"]').element as HTMLElement).blur()
    await nextTick()
    expect(field().attributes('data-touched')).toBe('')
    wrapper.unmount()
  })
})

describe('given a required Field-wrapped Autocomplete whose input was removed', () => {
  it('leaves focus on submit to the next invalid field', async () => {
    const showInput = ref(true)
    const wrapper = mount(defineComponent({
      setup: () => () => h(FormRoot, null, () => [
        h(FieldRoot, { name: 'fruit', required: true }, () => h(AutocompleteRoot, null, () =>
          h(AutocompleteAnchor, () => showInput.value ? h(AutocompleteInput, { 'data-testid': 'input' }) : null))),
        h(FieldRoot, { name: 'other', required: true }, () => h(FieldControl, { 'data-testid': 'other' })),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    showInput.value = false
    await flushPromises()
    await wrapper.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.find('[data-testid="other"]').element)
    wrapper.unmount()
  })
})

describe('given a Field-wrapped Autocomplete whose focused input is removed while the popup is closed', () => {
  it('leaves the field: unfocused, touched and validated on blur', async () => {
    const showInput = ref(true)
    const validate = vi.fn(() => null)
    const wrapper = mount(defineComponent({
      setup: () => () => h(FieldRoot, { 'name': 'fruit', 'data-testid': 'field', validate, 'validationMode': 'onBlur' }, () =>
        h(AutocompleteRoot, null, () => h(AutocompleteAnchor, () => [
          showInput.value ? h(AutocompleteInput, { 'data-testid': 'input' }) : null,
          h(AutocompleteTrigger, () => 'Open'),
        ]))),
    }), { attachTo: document.body })
    await flushPromises()
    const field = () => wrapper.find('[data-testid="field"]')
    const inputEl = input(wrapper)
    inputEl.focus()
    await flushPromises()
    expect(field().attributes('data-focused')).toBe('')

    // jsdom, like Firefox and WebKit, fires no `blur` for the removed input.
    showInput.value = false
    await flushPromises()
    expect(inputEl.isConnected).toBe(false)
    expect(field().attributes('data-focused')).toBeUndefined()
    expect(field().attributes('data-touched')).toBe('')
    expect(validate).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
