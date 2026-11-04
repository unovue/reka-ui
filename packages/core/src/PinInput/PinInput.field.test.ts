import type { VueWrapper } from '@vue/test-utils'
import userEvent from '@testing-library/user-event'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
import { FieldError, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract } from '@/test/fieldControlContract'
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
  render,
  control: wrapper => inputs(wrapper)[0].parentElement!,
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

  it('disables every input with the field', async () => {
    const { wrapper } = mountField({ disabled: true })
    await nextTick()
    expect(inputs(wrapper).every(input => input.disabled)).toBe(true)
    wrapper.unmount()
  })
})
