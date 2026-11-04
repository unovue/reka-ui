import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
import { FieldDescription, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract, providedContext } from '@/test/fieldControlContract'
import { RadioGroupItem, RadioGroupRoot } from '.'

const radio = (wrapper: VueWrapper, value: string) => wrapper.find(`[role="radio"][value="${value}"]`)

describeFieldControlContract({
  name: 'RadioGroup',
  setProgrammatically: (wrapper, value) => providedContext(wrapper, RadioGroupRoot, 'changeModelValue').changeModelValue(value),
  render: props => h(RadioGroupRoot, props, () => [
    h(RadioGroupItem, { 'value': 'a', 'aria-label': 'A' }),
    h(RadioGroupItem, { 'value': 'b', 'aria-label': 'B' }),
  ]),
  control: wrapper => wrapper.find('[role="radiogroup"]').element as HTMLElement,
  disabledParts: wrapper => wrapper.findAll('[role="radio"]').map(item => item.element as HTMLElement),
  // Nothing is checked, so the first enabled radio.
  focusTarget: wrapper => radio(wrapper, 'a').element as HTMLElement,
  interact: wrapper => radio(wrapper, 'b').trigger('click'),
  interactedValue: 'b',
  emptyValue: null,
  filledValue: 'a',
})

describe('given a Field-wrapped RadioGroup', () => {
  let wrapper: VueWrapper | undefined
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountGroup(options: { fieldProps?: Record<string, unknown>, groupProps?: Record<string, unknown>, onFormSubmit?: (values: Record<string, unknown>) => void, disabledFirst?: boolean } = {}) {
    wrapper = mount(defineComponent(() => () => h(FormRoot, { onFormSubmit: options.onFormSubmit }, () => [
      h(FieldRoot, { 'name': 'fruit', 'data-testid': 'field', ...options.fieldProps }, () => [
        h(FieldLabel, () => 'Fruit'),
        h(RadioGroupRoot, { ...options.groupProps }, () => [
          h(RadioGroupItem, { 'value': 'a', 'aria-label': 'A', 'disabled': options.disabledFirst }),
          h(RadioGroupItem, { 'value': 'b', 'aria-label': 'B' }),
          h(RadioGroupItem, { 'value': 'c', 'aria-label': 'C' }),
        ]),
        h(FieldDescription, () => 'Pick one'),
      ]),
      h('button', { type: 'submit' }, 'Submit'),
    ])), { attachTo: document.body })
    return wrapper
  }

  const field = () => wrapper!.find('[data-testid="field"]')

  it('gives the field id and label to the group, not to its radios', async () => {
    mountGroup()
    await nextTick()
    const group = wrapper!.find('[role="radiogroup"]')
    expect(group.attributes('id')).toBe(wrapper!.find('label').attributes('for'))
    for (const item of wrapper!.findAll('[role="radio"]')) {
      expect(item.attributes('id')).toBeUndefined()
      expect(item.attributes('aria-labelledby')).toBeUndefined()
    }
  })

  it('keeps a consumer id on the group', async () => {
    mountGroup({ groupProps: { id: 'own' } })
    await nextTick()
    expect(wrapper!.find('[role="radiogroup"]').attributes('id')).toBe('own')
    expect(wrapper!.find('label').attributes('for')).toBe('own')
  })

  it('takes the field name and required for its form input', async () => {
    mountGroup({ fieldProps: { required: true } })
    await nextTick()
    const group = wrapper!.find('[role="radiogroup"]')
    expect(group.attributes('aria-required')).toBe('true')
    const input = group.find('input[name="fruit"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('required')).toBeDefined()
  })

  it('focuses the checked radio when invalid on submit', async () => {
    const onFormSubmit = vi.fn()
    mountGroup({ onFormSubmit, groupProps: { defaultValue: 'c' }, fieldProps: { validate: () => 'Nope' } })
    await nextTick()
    await wrapper!.find('button[type="submit"]').trigger('submit')
    await nextTick()
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(radio(wrapper!, 'c').element)
  })

  it('focuses the first enabled radio when none is checked', async () => {
    mountGroup({ fieldProps: { required: true }, disabledFirst: true })
    await nextTick()
    await wrapper!.find('button[type="submit"]').trigger('submit')
    await nextTick()
    expect(document.activeElement).toBe(radio(wrapper!, 'b').element)
  })

  it('is touched only once focus leaves the group', async () => {
    mountGroup()
    await nextTick()
    ;(radio(wrapper!, 'a').element as HTMLElement).focus()
    await nextTick()
    expect(field().attributes('data-focused')).toBe('')

    ;(radio(wrapper!, 'b').element as HTMLElement).focus()
    await nextTick()
    expect(field().attributes('data-touched')).toBeUndefined()
    expect(field().attributes('data-focused')).toBe('')

    ;(wrapper!.find('button[type="submit"]').element as HTMLElement).focus()
    await nextTick()
    expect(field().attributes('data-touched')).toBe('')
    expect(field().attributes('data-focused')).toBeUndefined()
  })

  it('validates on group blur in onBlur mode', async () => {
    mountGroup({ fieldProps: { required: true, validationMode: 'onBlur', validate: (value: unknown) => value === 'b' ? null : 'Pick b' } })
    await nextTick()
    await radio(wrapper!, 'a').trigger('click')
    ;(radio(wrapper!, 'a').element as HTMLElement).focus()
    await nextTick()
    expect(field().attributes('data-invalid')).toBeUndefined()
    ;(wrapper!.find('button[type="submit"]').element as HTMLElement).focus()
    await flushPromises()
    expect(field().attributes('data-invalid')).toBe('')
  })

  it('has no axe violations', async () => {
    mountGroup()
    await nextTick()
    expect(await axe(wrapper!.element)).toHaveNoViolations()
  })
})
