import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
import { FieldDescription, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract, providedContext } from '@/test/fieldControlContract'
import { ToggleGroupItem, ToggleGroupRoot } from '.'

const item = (wrapper: VueWrapper, label: string) => wrapper.find(`[aria-pressed][aria-label="${label}"]`)

for (const type of ['single', 'multiple'] as const) {
  const multiple = type === 'multiple'
  describeFieldControlContract({
    name: `ToggleGroup (${type})`,
    setProgrammatically: (wrapper, value) => providedContext(wrapper, ToggleGroupRoot, 'changeModelValue').changeModelValue(Array.isArray(value) ? value[0] : value),
    render: props => h(ToggleGroupRoot, { type, ...props }, () => [
      h(ToggleGroupItem, { 'value': 'a', 'aria-label': 'A' }),
      h(ToggleGroupItem, { 'value': 'b', 'aria-label': 'B' }),
    ]),
    control: wrapper => wrapper.find('[role="group"]').element as HTMLElement,
    disabledParts: wrapper => wrapper.findAll('button').map(item => item.element),
    // Nothing is pressed, so the first enabled item.
    focusTarget: wrapper => item(wrapper, 'A').element as HTMLElement,
    interact: wrapper => item(wrapper, 'B').trigger('click'),
    interactedValue: multiple ? ['b'] : 'b',
    emptyValue: multiple ? [] : null,
    filledValue: multiple ? ['a'] : 'a',
  })
}

describe('given a Field-wrapped ToggleGroup', () => {
  let wrapper: VueWrapper | undefined
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountGroup(options: { fieldProps?: Record<string, unknown>, groupProps?: Record<string, unknown>, onFormSubmit?: (values: Record<string, unknown>) => void, disabledFirst?: boolean } = {}) {
    wrapper = mount(defineComponent(() => () => h(FormRoot, { onFormSubmit: options.onFormSubmit }, () => [
      h(FieldRoot, { 'name': 'format', 'data-testid': 'field', ...options.fieldProps }, () => [
        h(FieldLabel, () => 'Format'),
        h(ToggleGroupRoot, { type: 'multiple', ...options.groupProps }, () => [
          h(ToggleGroupItem, { 'value': 'a', 'aria-label': 'A', 'disabled': options.disabledFirst }),
          h(ToggleGroupItem, { 'value': 'b', 'aria-label': 'B' }),
          h(ToggleGroupItem, { 'value': 'c', 'aria-label': 'C' }),
        ]),
        h(FieldDescription, () => 'Pick some'),
      ]),
      h('button', { type: 'submit' }, 'Submit'),
    ])), { attachTo: document.body })
    return wrapper
  }

  const field = () => wrapper!.find('[data-testid="field"]')

  it('gives the field id and label to the group, not to its items', async () => {
    mountGroup()
    await nextTick()
    const group = wrapper!.find('[role="group"]')
    expect(group.attributes('id')).toBe(wrapper!.find('label').attributes('for'))
    expect(group.attributes('aria-labelledby')).toBe(wrapper!.find('label').attributes('id'))
    for (const toggle of wrapper!.findAll('[aria-pressed]')) {
      expect(toggle.attributes('id')).toBeUndefined()
      expect(toggle.attributes('aria-labelledby')).toBeUndefined()
    }
  })

  it('keeps the consumer\'s id, aria ids and data attributes', async () => {
    mountGroup({ groupProps: { 'id': 'own', 'aria-describedby': 'extra', 'data-dirty': 'mine' } })
    await nextTick()
    const group = wrapper!.find('[role="group"]')
    expect(group.attributes('id')).toBe('own')
    expect(wrapper!.find('label').attributes('for')).toBe('own')
    expect(group.attributes('aria-describedby')).toBe(`extra ${wrapper!.find('p').attributes('id')}`)
    expect(group.attributes('data-dirty')).toBe('mine')
  })

  it('takes the field name and required for its form input', async () => {
    mountGroup({ fieldProps: { required: true } })
    await nextTick()
    const input = wrapper!.find('[role="group"] input[name="format"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('required')).toBeDefined()
  })

  it('focuses the first pressed item when invalid on submit', async () => {
    const onFormSubmit = vi.fn()
    mountGroup({ onFormSubmit, groupProps: { defaultValue: ['c'] }, fieldProps: { validate: () => 'Nope' } })
    await nextTick()
    await wrapper!.find('button[type="submit"]').trigger('submit')
    await nextTick()
    expect(onFormSubmit).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(item(wrapper!, 'C').element)
  })

  it('focuses the first enabled item when none is pressed', async () => {
    mountGroup({ fieldProps: { required: true }, disabledFirst: true })
    await nextTick()
    await wrapper!.find('button[type="submit"]').trigger('submit')
    await nextTick()
    expect(document.activeElement).toBe(item(wrapper!, 'B').element)
  })

  it('is touched only once focus leaves the group', async () => {
    mountGroup({ groupProps: { rovingFocus: false } })
    await nextTick()
    ;(item(wrapper!, 'A').element as HTMLElement).focus()
    await nextTick()
    expect(field().attributes('data-focused')).toBe('')

    ;(item(wrapper!, 'B').element as HTMLElement).focus()
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
    await item(wrapper!, 'A').trigger('click')
    ;(item(wrapper!, 'A').element as HTMLElement).focus()
    await nextTick()
    expect(field().attributes('data-invalid')).toBeUndefined()
    ;(wrapper!.find('button[type="submit"]').element as HTMLElement).focus()
    await flushPromises()
    expect(field().attributes('data-invalid')).toBe('')
  })

  it('has no axe violations while invalid', async () => {
    mountGroup({ fieldProps: { invalid: true } })
    await nextTick()
    expect(wrapper!.find('[role="group"]').attributes('aria-invalid')).toBe('true')
    expect(await axe(wrapper!.element)).toHaveNoViolations()
  })
})

describe('given a disabled ToggleGroup in a native form', () => {
  it('leaves its value out of the submission', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h('form', [
        h(ToggleGroupRoot, { name: 'align', type: 'single', disabled: true, defaultValue: 'left' }, () => [
          h(ToggleGroupItem, { value: 'left' }, () => 'Left'),
        ]),
      ]),
    }), { attachTo: document.body })
    await nextTick()
    expect([...new FormData(wrapper.find('form').element).keys()]).toEqual([])
    wrapper.unmount()
  })
})
