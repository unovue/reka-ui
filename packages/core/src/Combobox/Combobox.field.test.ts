import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { ComboboxAnchor, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxPortal, ComboboxRoot, ComboboxTrigger, ComboboxViewport } from '.'

const fruits = ['Apple', 'Banana', 'Cherry']

function renderCombobox(props: Record<string, unknown>) {
  return h(ComboboxRoot, props, () => [
    h(ComboboxAnchor, () => [
      h(ComboboxInput, { 'data-testid': 'input' }),
      h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
    ]),
    h(ComboboxPortal, () => h(ComboboxContent, { 'data-testid': 'content' }, () => h(ComboboxViewport, () =>
      fruits.map(fruit => h(ComboboxItem, { value: fruit }, () => fruit))))),
  ])
}

const input = (wrapper: VueWrapper) => wrapper.find('[data-testid="input"]').element as HTMLInputElement

async function selectItem(wrapper: VueWrapper, text: string) {
  await wrapper.find('[data-testid="trigger"]').trigger('click')
  await flushPromises()
  const item = Array.from(document.querySelectorAll('[role="option"]')).find(option => option.textContent === text) as HTMLElement
  item.click()
  await flushPromises()
}

describeFieldControlContract({
  name: 'Combobox',
  render: renderCombobox,
  control: input,
  interact: wrapper => selectItem(wrapper, 'Banana'),
  interactedValue: 'Banana',
  emptyValue: undefined,
  filledValue: 'Apple',
})

describeFieldControlContract({
  name: 'multiple Combobox',
  render: props => renderCombobox({ ...props, multiple: true }),
  control: input,
  interact: wrapper => selectItem(wrapper, 'Banana'),
  interactedValue: ['Banana'],
  emptyValue: [],
  filledValue: ['Apple'],
})

describe('given a Field-wrapped Combobox', () => {
  function mountInField(options: { form?: boolean, onFormSubmit?: (values: Record<string, unknown>) => void, inputAttrs?: Record<string, unknown> } = {}) {
    const model = ref<string | undefined>(undefined)
    const Harness = defineComponent({
      setup: () => () => {
        const field = h(FieldRoot, { 'name': 'fruit', 'data-testid': 'field' }, () => [
          h(FieldLabel, () => 'Fruit'),
          h(ComboboxRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (value: unknown) => { model.value = value as string | undefined } }, () => [
            h(ComboboxAnchor, () => [
              h(ComboboxInput, { 'data-testid': 'input', ...options.inputAttrs }),
              h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
            ]),
            h(ComboboxPortal, () => h(ComboboxContent, () => h(ComboboxViewport, () =>
              fruits.map(fruit => h(ComboboxItem, { value: fruit }, () => fruit))))),
          ]),
        ])
        return options.form ? h(FormRoot, { onFormSubmit: options.onFormSubmit }, () => [field, h('button', { type: 'submit' }, 'Submit')]) : field
      },
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    return { wrapper, model, field: () => wrapper.find('[data-testid="field"]') }
  }

  it('isn\'t dirtied by typing without selecting, and submits the selection rather than the text', async () => {
    const onFormSubmit = vi.fn()
    const { wrapper, field } = mountInField({ form: true, onFormSubmit })
    await nextTick()
    await wrapper.find('[data-testid="input"]').setValue('Ban')
    await flushPromises()
    expect(field().attributes('data-dirty')).toBeUndefined()

    const item = Array.from(document.querySelectorAll('[role="option"]')).find(option => option.textContent === 'Banana') as HTMLElement
    item.click()
    await flushPromises()
    expect(field().attributes('data-dirty')).toBe('')

    await wrapper.find('[data-testid="input"]').setValue('Che')
    await flushPromises()
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ fruit: 'Banana' })
    wrapper.unmount()
  })

  it('isn\'t touched by opening the list, only once focus leaves the combobox', async () => {
    const { wrapper, field } = mountInField()
    await nextTick()
    const inputEl = input(wrapper)
    inputEl.focus()
    await nextTick()
    expect(field().attributes('data-focused')).toBe('')

    await wrapper.find('[data-testid="input"]').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(inputEl.getAttribute('aria-expanded')).toBe('true')
    // Focus moving to another part of the combobox (the trigger, an item) stays inside.
    const trigger = wrapper.find('[data-testid="trigger"]').element as HTMLElement
    trigger.focus()
    await nextTick()
    const item = document.querySelector('[role="option"]') as HTMLElement
    item.focus()
    await nextTick()
    expect(field().attributes('data-touched')).toBeUndefined()
    expect(field().attributes('data-focused')).toBe('')

    item.blur()
    await nextTick()
    expect(field().attributes('data-touched')).toBe('')
    expect(field().attributes('data-focused')).toBeUndefined()
    wrapper.unmount()
  })

  it('merges a consumer id and aria ids with the field\'s', async () => {
    const { wrapper } = mountInField({ inputAttrs: { 'id': 'own', 'aria-describedby': 'hint' } })
    await nextTick()
    const inputEl = input(wrapper)
    expect(inputEl.id).toBe('own')
    expect(wrapper.find('label').attributes('for')).toBe('own')
    expect(inputEl.getAttribute('aria-describedby')).toBe('hint')
    expect(inputEl.getAttribute('aria-labelledby')).toBe(wrapper.find('label').attributes('id'))
    wrapper.unmount()
  })
})

describe('given a TagsInput composed into a Field-wrapped Combobox', () => {
  it('lets the Combobox own the field, wiring the shared input once', async () => {
    const { TagsInputInput, TagsInputRoot } = await import('@/TagsInput')
    const model = ref<string[]>([])
    const onFormSubmit = vi.fn()
    const Harness = defineComponent({
      setup: () => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { name: 'fruits' }, () => [
          h(FieldLabel, () => 'Fruits'),
          h(ComboboxRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (value: string[]) => { model.value = value }, 'multiple': true }, () => [
            h(ComboboxAnchor, () => [
              h(TagsInputRoot, { 'modelValue': model.value, 'onUpdate:modelValue': (value: string[]) => { model.value = value } }, () =>
                h(ComboboxInput, { asChild: true }, () => h(TagsInputInput, { 'data-testid': 'input' }))),
              h(ComboboxTrigger, { 'data-testid': 'trigger' }, () => 'Open'),
            ]),
            h(ComboboxPortal, () => h(ComboboxContent, () => h(ComboboxViewport, () =>
              fruits.map(fruit => h(ComboboxItem, { value: fruit }, () => fruit))))),
          ]),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    })
    const wrapper = mount(Harness, { attachTo: document.body })
    await nextTick()

    const label = wrapper.find('label').element
    expect(input(wrapper).getAttribute('aria-labelledby')).toBe(label.id)
    expect(label.getAttribute('for')).toBe(input(wrapper).id)

    await selectItem(wrapper, 'Banana')
    await wrapper.find('button[type="submit"]').trigger('submit')
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ fruits: ['Banana'] })
    wrapper.unmount()
  })
})
