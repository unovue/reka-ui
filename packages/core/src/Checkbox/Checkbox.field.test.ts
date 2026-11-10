import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { FieldDescription, FieldLabel, FieldRoot } from '@/Field'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { CheckboxGroupRoot, CheckboxRoot } from '.'

describeFieldControlContract({
  name: 'Checkbox',
  render: props => h(CheckboxRoot, props),
  control: wrapper => wrapper.find('[role="checkbox"]').element as HTMLElement,
  interact: wrapper => wrapper.find('[role="checkbox"]').trigger('click'),
  interactedValue: true,
  emptyValue: false,
  filledValue: true,
})

describe('given a Checkbox and a Field', () => {
  let wrapper: VueWrapper | undefined
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  const checkbox = (label: string) => wrapper!.find(`[role="checkbox"][aria-label="${label}"]`)
  const field = (id = 'field') => wrapper!.find(`[data-testid="${id}"]`)

  it('a disabled checkbox is not marked invalid', async () => {
    wrapper = mount(defineComponent(() => () => h(FieldRoot, { 'invalid': true, 'data-testid': 'field' }, () => [
      h(CheckboxRoot, { 'aria-label': 'On' }),
    ])), { attachTo: document.body })
    await nextTick()
    expect(checkbox('On').attributes('aria-invalid')).toBe('true')
    wrapper.unmount()

    wrapper = mount(defineComponent(() => () => h(FieldRoot, { 'invalid': true, 'data-testid': 'field' }, () => [
      h(CheckboxRoot, { 'aria-label': 'Off', 'disabled': true }),
    ])), { attachTo: document.body })
    await nextTick()
    expect(checkbox('Off').attributes('aria-invalid')).toBeUndefined()
    // The field's state attributes still describe the field.
    expect(checkbox('Off').attributes('data-invalid')).toBe('')
  })

  describe('in a group that is the field\'s control', () => {
    function mountGroup(fieldProps: Record<string, unknown> = {}) {
      wrapper = mount(defineComponent(() => () => h('div', [
        h(FieldRoot, { 'name': 'fruits', 'data-testid': 'field', ...fieldProps }, () => [
          h(FieldLabel, () => 'Fruits'),
          h(CheckboxGroupRoot, { defaultValue: [] }, () => [
            h(CheckboxRoot, { 'value': 'a', 'aria-label': 'A' }),
            h(CheckboxRoot, { 'value': 'b', 'aria-label': 'B', 'disabled': true }),
          ]),
          h(FieldDescription, () => 'Pick some'),
        ]),
        h('button', { type: 'button' }, 'Outside'),
      ])), { attachTo: document.body })
      return wrapper
    }

    it('reads the field without taking its id or label', async () => {
      mountGroup({ invalid: true })
      await nextTick()
      const description = wrapper!.find('p').element
      const a = checkbox('A')
      expect(a.attributes('id')).toBeUndefined()
      expect(a.attributes('aria-labelledby')).toBeUndefined()
      expect(a.attributes('aria-describedby')).toBe(description.id)
      expect(a.attributes('aria-invalid')).toBe('true')
      expect(a.attributes('data-invalid')).toBe('')
      // A disabled one is not invalid.
      expect(checkbox('B').attributes('aria-invalid')).toBeUndefined()
    })

    it('is disabled and required by the field', async () => {
      mountGroup({ disabled: true, required: true })
      await nextTick()
      expect((checkbox('A').element as HTMLButtonElement).disabled).toBe(true)
      expect(checkbox('A').attributes('aria-required')).toBe('true')
    })

    it('leaves the field\'s value state to the group', async () => {
      mountGroup()
      await nextTick()
      await checkbox('A').trigger('click')
      await nextTick()
      // The group's value (an array), not the checkbox's `true`.
      expect(field().attributes('data-dirty')).toBe('')
      expect(field().attributes('data-filled')).toBe('')
      await checkbox('A').trigger('click')
      await nextTick()
      expect(field().attributes('data-filled')).toBeUndefined()
      expect(field().attributes('data-dirty')).toBeUndefined()
    })

    it('a focused checkbox that unmounts leaves the field unfocused', async () => {
      const Harness = defineComponent({
        props: { show: { type: Boolean, default: true } },
        setup: props => () => h(FieldRoot, { 'data-testid': 'field' }, () => [
          h(CheckboxGroupRoot, { defaultValue: [] }, () => [
            h(CheckboxRoot, { 'value': 'a', 'aria-label': 'A' }),
            props.show ? h(CheckboxRoot, { 'value': 'b', 'aria-label': 'B' }) : null,
          ]),
        ]),
      })
      wrapper = mount(Harness, { attachTo: document.body })
      await nextTick()
      ;(checkbox('B').element as HTMLElement).focus()
      await nextTick()
      expect(field().attributes('data-focused')).toBe('')

      await wrapper.setProps({ show: false })
      await nextTick()
      expect(field().attributes('data-focused')).toBeUndefined()
    })
  })

  describe('with its own field inside a group', () => {
    function mountNested() {
      wrapper = mount(defineComponent(() => () => h('div', [
        h(FieldRoot, { 'name': 'fruits', 'data-testid': 'outer' }, () => [
          h(CheckboxGroupRoot, { defaultValue: [] }, () => [
            h(FieldRoot, { 'data-testid': 'inner' }, () => [
              h(FieldLabel, () => 'Apple'),
              h(CheckboxRoot, { 'value': 'a', 'aria-label': 'A' }),
              h(FieldDescription, () => 'A fruit'),
            ]),
            h(CheckboxRoot, { 'value': 'b', 'aria-label': 'B' }),
          ]),
        ]),
        h('button', { type: 'button' }, 'Outside'),
      ])), { attachTo: document.body })
      return wrapper
    }

    it('reads that field without taking its id or label', async () => {
      mountNested()
      await nextTick()
      const a = checkbox('A')
      expect(a.attributes('id')).toBeUndefined()
      expect(a.attributes('aria-labelledby')).toBeUndefined()
      expect(a.attributes('aria-describedby')).toBe(wrapper!.find('p').element.id)
    })

    it('reports focus to that field, and touches it on blur', async () => {
      mountNested()
      await nextTick()
      ;(checkbox('A').element as HTMLElement).focus()
      await nextTick()
      expect(field('inner').attributes('data-focused')).toBe('')
      expect(field('inner').attributes('data-touched')).toBeUndefined()

      ;(wrapper!.find('button:not([role])').element as HTMLElement).focus()
      await nextTick()
      expect(field('inner').attributes('data-focused')).toBeUndefined()
      expect(field('inner').attributes('data-touched')).toBe('')
    })

    it('does not report its value to that field', async () => {
      mountNested()
      await nextTick()
      await checkbox('A').trigger('click')
      await nextTick()
      expect(checkbox('A').attributes('aria-checked')).toBe('true')
      expect(field('inner').attributes('data-dirty')).toBeUndefined()
      expect(field('inner').attributes('data-filled')).toBeUndefined()
      // The group reports to the field it is the control of.
      expect(field('outer').attributes('data-dirty')).toBe('')
    })

    it('unfocuses that field when it unmounts focused', async () => {
      const Harness = defineComponent({
        props: { show: { type: Boolean, default: true } },
        setup: props => () => h(CheckboxGroupRoot, { defaultValue: [] }, () => [
          h(FieldRoot, { 'data-testid': 'inner' }, () => [
            props.show ? h(CheckboxRoot, { 'value': 'a', 'aria-label': 'A' }) : null,
          ]),
        ]),
      })
      wrapper = mount(Harness, { attachTo: document.body })
      await nextTick()
      ;(checkbox('A').element as HTMLElement).focus()
      await nextTick()
      expect(field('inner').attributes('data-focused')).toBe('')

      await wrapper.setProps({ show: false })
      await nextTick()
      expect(field('inner').attributes('data-focused')).toBeUndefined()
    })
  })
})

describe('given a standalone Checkbox', () => {
  it('passes the consumer\'s aria ids through as they are', () => {
    const wrapper = mount(defineComponent(() => () => h(CheckboxRoot, { 'aria-labelledby': '', 'aria-describedby': 'hint' })))
    const checkbox = wrapper.find('[role="checkbox"]')
    expect(checkbox.attributes('aria-labelledby')).toBe('')
    expect(checkbox.attributes('aria-describedby')).toBe('hint')
    expect(checkbox.attributes('aria-invalid')).toBeUndefined()
    wrapper.unmount()
  })
})
