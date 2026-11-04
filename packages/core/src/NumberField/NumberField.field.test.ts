import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { FieldError, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from '.'

function render(props: Record<string, unknown>) {
  return h(NumberFieldRoot, props, () => [
    h(NumberFieldDecrement, () => '-'),
    h(NumberFieldInput),
    h(NumberFieldIncrement, () => '+'),
  ])
}

const input = (wrapper: VueWrapper) => wrapper.find('[role="spinbutton"]')

async function type(wrapper: VueWrapper, text: string) {
  const element = input(wrapper).element as HTMLInputElement
  element.focus()
  await input(wrapper).setValue(text)
  element.blur()
  await flushPromises()
}

describeFieldControlContract({
  name: 'NumberField',
  render,
  control: wrapper => input(wrapper).element as HTMLElement,
  interact: wrapper => type(wrapper, '5'),
  interactedValue: 5,
  emptyValue: null,
  filledValue: 3,
})

describe('given a Field-wrapped NumberField', () => {
  function mountField(options: { fieldProps?: Record<string, unknown>, rootProps?: Record<string, unknown>, model?: number } = {}) {
    const onFormSubmit = vi.fn()
    const model = ref<number | null>(options.model ?? null)
    const wrapper = mount(defineComponent({
      setup: () => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { 'name': 'amount', 'data-testid': 'field', ...options.fieldProps }, () => [
          h(FieldLabel, () => 'Amount'),
          render({ 'modelValue': model.value, 'onUpdate:modelValue': (value: number | null) => { model.value = value }, ...options.rootProps }),
          h(FieldError, { match: 'rangeOverflow' }, () => 'Too large'),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    }), { attachTo: document.body })
    const field = () => wrapper.find('[data-testid="field"]')
    const submit = () => wrapper.find('button[type="submit"]').trigger('submit')
    return { wrapper, model, field, submit, onFormSubmit }
  }

  it('collects null while empty', async () => {
    const { wrapper, submit, onFormSubmit } = mountField()
    await nextTick()
    await submit()
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ amount: null })
    wrapper.unmount()
  })

  it('treats a step from the buttons as user input, even with focus elsewhere', async () => {
    const { wrapper, submit, field, onFormSubmit } = mountField({ model: 2, rootProps: { focusOnChange: false } })
    await nextTick()
    const pointer = (type: string) => Object.defineProperties(
      new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }),
      { pointerId: { value: 1 }, pointerType: { value: 'mouse' } },
    )
    wrapper.find('button[aria-label="Increase"]').element.dispatchEvent(pointer('pointerdown'))
    window.dispatchEvent(pointer('pointerup'))
    await flushPromises()
    expect(document.activeElement).not.toBe(input(wrapper).element)
    expect(field().attributes('data-dirty')).toBe('')
    await submit()
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ amount: 3 })
    wrapper.unmount()
  })

  it('validates min and max through the hidden input', async () => {
    const { wrapper, field, submit, onFormSubmit } = mountField({ rootProps: { max: 10, allowInvalid: true } })
    await nextTick()
    await type(wrapper, '50')
    await submit()
    await nextTick()
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect(field().attributes('data-invalid')).toBe('')
    expect(wrapper.text()).toContain('Too large')
    expect(document.activeElement).toBe(input(wrapper).element)
    wrapper.unmount()
  })

  it('validates the committed value on blur', async () => {
    const { wrapper, field } = mountField({ fieldProps: { validationMode: 'onBlur' }, rootProps: { max: 10, allowInvalid: true } })
    await nextTick()
    await type(wrapper, '50')
    expect(field().attributes('data-touched')).toBe('')
    expect(field().attributes('data-invalid')).toBe('')
    wrapper.unmount()
  })

  it('points the label at the input and keeps the hidden input out of reach', async () => {
    const { wrapper } = mountField({ fieldProps: { required: true } })
    await nextTick()
    expect(wrapper.find('label').attributes('for')).toBe(input(wrapper).attributes('id'))
    const hidden = wrapper.find('input[aria-hidden="true"]')
    expect(hidden.attributes('name')).toBe('amount')
    expect(hidden.attributes('tabindex')).toBe('-1')
    expect((hidden.element as HTMLInputElement).required).toBe(true)
    ;(hidden.element as HTMLInputElement).focus()
    expect(document.activeElement).toBe(input(wrapper).element)
    wrapper.unmount()
  })

  it('disables the input and buttons with the field', async () => {
    const { wrapper } = mountField({ fieldProps: { disabled: true } })
    await nextTick()
    expect(input(wrapper).attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('button[aria-label]').every(button => button.attributes('disabled') !== undefined)).toBe(true)
    wrapper.unmount()
  })
})

describe('given a Field-wrapped NumberField whose input has its own id', () => {
  it('points the label at the input', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(FieldRoot, { name: 'amount' }, () => [
        h(FieldLabel, () => 'Amount'),
        h(NumberFieldRoot, null, () => h(NumberFieldInput, { id: 'amount' })),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    expect(wrapper.find('label').attributes('for')).toBe('amount')
    expect(wrapper.find('input#amount').exists()).toBe(true)
    wrapper.unmount()
  })
})
