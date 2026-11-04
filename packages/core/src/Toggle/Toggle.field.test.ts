import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
import { FieldDescription, FieldLabel, FieldRoot } from '@/Field'
import { FormRoot } from '@/Form'
import { describeFieldControlContract } from '@/test/fieldControlContract'
import { ToggleGroupItem, ToggleGroupRoot } from '@/ToggleGroup'
import { Toggle } from '.'

const toggle = (wrapper: VueWrapper) => wrapper.find('[data-state]')

describeFieldControlContract({
  name: 'Toggle',
  render: props => h(Toggle, props, () => 'Bold'),
  control: wrapper => toggle(wrapper).element as HTMLElement,
  interact: wrapper => toggle(wrapper).trigger('click'),
  interactedValue: true,
  emptyValue: false,
  filledValue: true,
})

describe('given a Field-wrapped Toggle', () => {
  let wrapper: VueWrapper | undefined
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('takes the field name and required for its form input', async () => {
    wrapper = mount(defineComponent(() => () => h(FormRoot, () => h(FieldRoot, { name: 'bold', required: true }, () => [
      h(FieldLabel, () => 'Bold'),
      h(Toggle, () => 'B'),
    ]))), { attachTo: document.body })
    await nextTick()
    const input = wrapper.find('input[name="bold"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('required')).toBeDefined()
  })

  it('keeps a consumer id', async () => {
    wrapper = mount(defineComponent(() => () => h(FieldRoot, () => [
      h(FieldLabel, () => 'Bold'),
      h(Toggle, { id: 'own' }, () => 'B'),
    ])), { attachTo: document.body })
    await nextTick()
    expect(toggle(wrapper).attributes('id')).toBe('own')
    expect(wrapper.find('label').attributes('for')).toBe('own')
  })

  it('leaves a toggle inside a ToggleGroup to the group', async () => {
    wrapper = mount(defineComponent(() => () => h(FieldRoot, () => [
      h(FieldLabel, () => 'Format'),
      h(ToggleGroupRoot, { type: 'multiple' }, () => [
        h(ToggleGroupItem, { 'value': 'b', 'aria-label': 'Bold' }),
        h(ToggleGroupItem, { 'value': 'i', 'aria-label': 'Italic' }),
      ]),
      h(FieldDescription, () => 'Description'),
    ])), { attachTo: document.body })
    await nextTick()
    for (const item of wrapper.findAll('[aria-label]')) {
      expect(item.attributes('id')).toBeUndefined()
      expect(item.attributes('aria-labelledby')).toBeUndefined()
      expect(item.attributes('aria-describedby')).toBeUndefined()
    }
  })

  it('has no axe violations while invalid', async () => {
    wrapper = mount(defineComponent(() => () => h(FieldRoot, { invalid: true }, () => [
      h(FieldLabel, () => 'Bold'),
      h(Toggle, () => 'B'),
      h(FieldDescription, () => 'Description'),
    ])), { attachTo: document.body })
    await nextTick()
    expect(toggle(wrapper).attributes('aria-invalid')).toBe('true')
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })
})
