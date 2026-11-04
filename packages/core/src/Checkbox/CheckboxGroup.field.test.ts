import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
import { FieldDescription, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { CheckboxGroupRoot, CheckboxRoot } from '.'

const checkbox = (wrapper: VueWrapper, label: string) => wrapper.find(`[role="checkbox"][aria-label="${label}"]`)

describeFieldControlContract({
  name: 'CheckboxGroup',
  render: props => h(CheckboxGroupRoot, props, () => [
    h(CheckboxRoot, { 'value': 'a', 'aria-label': 'A' }),
    h(CheckboxRoot, { 'value': 'b', 'aria-label': 'B' }),
  ]),
  // The group element (a standalone group has no role to select it by).
  control: wrapper => wrapper.find('[role="checkbox"]').element.parentElement!,
  // Nothing is checked, so the first enabled checkbox.
  focusTarget: wrapper => checkbox(wrapper, 'A').element as HTMLElement,
  interact: wrapper => checkbox(wrapper, 'B').trigger('click'),
  interactedValue: ['b'],
  emptyValue: [],
  filledValue: ['a'],
})

describe('given a Field-wrapped CheckboxGroup', () => {
  let wrapper: VueWrapper | undefined
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountGroup(options: { fieldProps?: Record<string, unknown>, groupProps?: Record<string, unknown>, onFormSubmit?: (values: Record<string, unknown>) => void, disabledFirst?: boolean } = {}) {
    wrapper = mount(defineComponent(() => () => h(FormRoot, { onFormSubmit: options.onFormSubmit }, () => [
      h(FieldRoot, { 'name': 'fruits', 'data-testid': 'field', ...options.fieldProps }, () => [
        h(FieldLabel, () => 'Fruits'),
        h(CheckboxGroupRoot, { ...options.groupProps }, () => [
          h(CheckboxRoot, { 'value': 'a', 'aria-label': 'A', 'disabled': options.disabledFirst }),
          h(CheckboxRoot, { 'value': 'b', 'aria-label': 'B' }),
          h(CheckboxRoot, { 'value': 'c', 'aria-label': 'C' }),
        ]),
        h(FieldDescription, () => 'Pick some'),
      ]),
      h('button', { type: 'submit' }, 'Submit'),
    ])), { attachTo: document.body })
    return wrapper
  }

  const field = () => wrapper!.find('[data-testid="field"]')

  it('gives the field id and label to the group, not to its checkboxes', async () => {
    mountGroup()
    await nextTick()
    const group = wrapper!.find('[role="group"]')
    expect(group.attributes('id')).toBe(wrapper!.find('label').attributes('for'))
    expect(group.attributes('aria-labelledby')).toBe(wrapper!.find('label').attributes('id'))
    for (const item of wrapper!.findAll('[role="checkbox"]')) {
      expect(item.attributes('id')).toBeUndefined()
      expect(item.attributes('aria-labelledby')).toBeUndefined()
    }
  })

  it('keeps a consumer id and role on the group', async () => {
    mountGroup({ groupProps: { id: 'own', role: 'radiogroup' } })
    await nextTick()
    const group = wrapper!.find('#own')
    expect(group.attributes('role')).toBe('radiogroup')
    expect(wrapper!.find('label').attributes('for')).toBe('own')
  })

  it('takes the field name and required for its form input', async () => {
    mountGroup({ fieldProps: { required: true } })
    await nextTick()
    const input = wrapper!.find('[role="group"] input[name="fruits"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('required')).toBeDefined()
  })

  it('focuses the first checked checkbox when invalid on submit', async () => {
    const onFormSubmit = vi.fn()
    mountGroup({ onFormSubmit, groupProps: { defaultValue: ['c'] }, fieldProps: { validate: () => 'Nope' } })
    await nextTick()
    await wrapper!.find('button[type="submit"]').trigger('submit')
    await nextTick()
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(checkbox(wrapper!, 'C').element)
  })

  it('focuses the first enabled checkbox when none is checked', async () => {
    mountGroup({ fieldProps: { required: true }, disabledFirst: true })
    await nextTick()
    await wrapper!.find('button[type="submit"]').trigger('submit')
    await nextTick()
    expect(document.activeElement).toBe(checkbox(wrapper!, 'B').element)
  })

  it('is touched only once focus leaves the group', async () => {
    mountGroup()
    await nextTick()
    ;(checkbox(wrapper!, 'A').element as HTMLElement).focus()
    await nextTick()
    expect(field().attributes('data-focused')).toBe('')

    ;(checkbox(wrapper!, 'B').element as HTMLElement).focus()
    await nextTick()
    expect(field().attributes('data-touched')).toBeUndefined()
    expect(field().attributes('data-focused')).toBe('')

    ;(wrapper!.find('button[type="submit"]').element as HTMLElement).focus()
    await nextTick()
    expect(field().attributes('data-touched')).toBe('')
    expect(field().attributes('data-focused')).toBeUndefined()
  })

  it('validates on group blur in onBlur mode', async () => {
    mountGroup({ fieldProps: { validationMode: 'onBlur', validate: (value: unknown) => (value as string[]).includes('b') ? null : 'Pick b' } })
    await nextTick()
    await checkbox(wrapper!, 'A').trigger('click')
    ;(checkbox(wrapper!, 'A').element as HTMLElement).focus()
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

describe('given a disabled CheckboxGroup in a native form', () => {
  it('leaves its values out of the submission', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h('form', [
        h(CheckboxGroupRoot, { name: 'fruits', disabled: true, defaultValue: ['apple'] }, () => [
          h(CheckboxRoot, { value: 'apple' }),
        ]),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    expect([...new FormData(wrapper.find('form').element).keys()]).toEqual([])
    wrapper.unmount()
  })
})
