import type { VueWrapper } from '@vue/test-utils'
import userEvent from '@testing-library/user-event'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { FieldError, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract, providedContext } from '@/test/fieldControlContract'
import { PinInputInput, PinInputRoot } from '.'

function render(props: Record<string, unknown>) {
  return h(PinInputRoot, props, () => [0, 1, 2].map(index => h(PinInputInput, { key: index, index })))
}

const inputs = (wrapper: VueWrapper) => wrapper.findAll('input:not([aria-hidden])').map(input => input.element as HTMLInputElement)

async function type(wrapper: VueWrapper, text: string) {
  const user = userEvent.setup()
  await user.click(inputs(wrapper)[0])
  await user.keyboard(text)
  await flushPromises()
}

describeFieldControlContract({
  name: 'PinInput',
  setProgrammatically: (wrapper, value) => providedContext(wrapper, PinInputRoot, 'setModelValue').setModelValue(value),
  render,
  control: wrapper => inputs(wrapper)[0].parentElement!,
  disabledParts: inputs,
  focusTarget: wrapper => inputs(wrapper)[0],
  idOnControl: false,
  labelTarget: wrapper => wrapper.find('input[aria-hidden="true"]').element as HTMLElement,
  parts: inputs,
  interact: wrapper => type(wrapper, '123'),
  interactedValue: ['1', '2', '3'],
  emptyValue: [],
  filledValue: ['4', '5', '6'],
})

describe('given a Field-wrapped PinInput', () => {
  function mountField(fieldProps: Record<string, unknown> = {}, rootProps: Record<string, unknown> = {}) {
    const onFormSubmit = vi.fn()
    const wrapper = mount(defineComponent({
      setup: () => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { 'name': 'code', 'data-testid': 'field', ...fieldProps }, () => [
          h(FieldLabel, () => 'Code'),
          render(rootProps),
          h(FieldError, { match: 'valueMissing' }, () => 'Required'),
        ]),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    }), { attachTo: document.body })
    const field = () => wrapper.find('[data-testid="field"]')
    const submit = () => wrapper.find('button[type="submit"]').trigger('submit')
    return { wrapper, field, submit, onFormSubmit }
  }

  it('points the label at the hidden input, which moves focus to the first input', async () => {
    const { wrapper } = mountField()
    await nextTick()
    const target = wrapper.find(`#${wrapper.find('label').attributes('for')}`)
    expect(target.attributes('aria-hidden')).toBe('true')
    expect(target.attributes('name')).toBe('code')
    ;(target.element as HTMLInputElement).focus()
    expect(document.activeElement).toBe(inputs(wrapper)[0])
    wrapper.unmount()
  })

  it('is a group that keeps each input\'s own name for screen readers', async () => {
    const { wrapper } = mountField()
    await nextTick()
    expect(inputs(wrapper)[0].parentElement!.getAttribute('role')).toBe('group')
    expect(inputs(wrapper)[0].getAttribute('aria-label')).toBe('pin input 1 of 3')
    expect(inputs(wrapper)[0].hasAttribute('aria-labelledby')).toBe(false)
    wrapper.unmount()
  })

  it('passes axe', async () => {
    const { wrapper } = mountField({ required: true })
    await nextTick()
    expect(await axe(wrapper.element)).toHaveNoViolations()
    wrapper.unmount()
  })

  it('treats a partly entered code as missing when required', async () => {
    const { wrapper, field, submit, onFormSubmit } = mountField({ required: true })
    await nextTick()
    await type(wrapper, '12')
    expect(field().attributes('data-dirty')).toBe('')
    expect(field().attributes('data-filled')).toBeUndefined()
    await submit()
    await nextTick()
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Required')

    await type(wrapper, '123')
    expect(field().attributes('data-filled')).toBe('')
    await submit()
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ code: ['1', '2', '3'] })
    wrapper.unmount()
  })

  it('collects numbers in number mode', async () => {
    const { wrapper, submit, onFormSubmit } = mountField({}, { type: 'number' })
    await nextTick()
    await type(wrapper, '102')
    await submit()
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ code: [1, 0, 2] })
    wrapper.unmount()
  })

  it.each(['text', 'number'])('is no longer dirty once every %s digit is cleared', async (type_) => {
    const { wrapper, field, submit, onFormSubmit } = mountField({}, { type: type_ })
    await nextTick()
    await type(wrapper, '123')
    expect(field().attributes('data-dirty')).toBe('')

    // Clear them out of order, so no clear is of the last entered digit.
    const user = userEvent.setup()
    for (const index of [0, 2, 1]) {
      await user.click(inputs(wrapper)[index])
      await user.keyboard('{Delete}')
    }
    await flushPromises()
    expect(inputs(wrapper).map(input => input.value)).toEqual(['', '', ''])
    expect(field().attributes('data-dirty')).toBeUndefined()
    expect(field().attributes('data-filled')).toBeUndefined()
    await submit()
    expect(onFormSubmit.mock.calls[0][0]).toEqual({ code: [] })
    wrapper.unmount()
  })

  it('disables every input with the field', async () => {
    const { wrapper } = mountField({ disabled: true })
    await nextTick()
    expect(inputs(wrapper).every(input => input.disabled)).toBe(true)
    wrapper.unmount()
  })
})

describe('given a required Field-wrapped PinInput with an empty slot', () => {
  it('is not filled even when the model has as many digits as there are inputs', async () => {
    const onFormSubmit = vi.fn()
    const wrapper = mount(defineComponent({
      setup: () => () => h(FormRoot, { onFormSubmit }, () => [
        h(FieldRoot, { 'name': 'code', 'required': true, 'data-testid': 'field' }, () => render({ modelValue: ['1', '', '3', '4'] })),
        h('button', { type: 'submit' }, 'Submit'),
      ]),
    }), { attachTo: document.body })
    await flushPromises()
    expect(wrapper.find('[data-testid="field"]').attributes('data-filled')).toBeUndefined()
    await wrapper.find('button[type="submit"]').trigger('submit')
    await flushPromises()
    expect(onFormSubmit).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('given a Field-wrapped PinInput whose as-child input is replaced while PinInputInput stays mounted', () => {
  it('focuses the replacement, not the detached input', async () => {
    const swapped = ref(false)
    const wrapper = mount(defineComponent({
      setup: () => () => h(FieldRoot, { name: 'code' }, () => [
        h(FieldLabel, { 'nativeLabel': false, 'as': 'div', 'data-testid': 'label' }, () => 'Code'),
        h(PinInputRoot, null, () => [
          h(PinInputInput, { index: 0, asChild: true }, () => h('input', { 'key': swapped.value ? 'b' : 'a', 'data-testid': swapped.value ? 'b' : 'a' })),
          h(PinInputInput, { index: 1 }),
        ]),
      ]),
    }), { attachTo: document.body })
    await flushPromises()
    const original = wrapper.find('[data-testid="a"]').element
    swapped.value = true
    await flushPromises()
    expect(original.isConnected).toBe(false)

    await wrapper.find('[data-testid="label"]').trigger('click')
    expect(document.activeElement).toBe(wrapper.find('[data-testid="b"]').element)
    wrapper.unmount()
  })
})

describe('given a Field-wrapped PinInput whose slots change', () => {
  it('refreshes filled when an empty slot is removed or added', async () => {
    const count = ref(4)
    const wrapper = mount(defineComponent({
      setup: () => () => h(FieldRoot, { 'name': 'code', 'data-testid': 'field' }, () =>
        h(PinInputRoot, { defaultValue: ['1', '2', '3'] }, () => Array.from({ length: count.value }, (_, index) => h(PinInputInput, { key: index, index })))),
    }), { attachTo: document.body })
    await flushPromises()
    const field = () => wrapper.find('[data-testid="field"]')
    expect(field().attributes('data-filled')).toBeUndefined()

    count.value = 3
    await flushPromises()
    expect(field().attributes('data-filled')).toBe('')

    count.value = 4
    await flushPromises()
    expect(field().attributes('data-filled')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('given a Field-wrapped PinInput with a nested PinInput', () => {
  it('counts only its own inputs toward filled', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(FieldRoot, { 'name': 'code', 'data-testid': 'field' }, () =>
        h(PinInputRoot, { defaultValue: ['1', '2'] }, () => [
          h(PinInputInput, { index: 0 }),
          h(PinInputInput, { index: 1 }),
          h(PinInputRoot, null, () => [0, 1, 2].map(index => h(PinInputInput, { key: index, index }))),
        ])),
    }), { attachTo: document.body })
    await flushPromises()
    expect(wrapper.find('[data-testid="field"]').attributes('data-filled')).toBe('')
    wrapper.unmount()
  })
})
