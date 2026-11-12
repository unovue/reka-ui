import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { h, nextTick, ref } from 'vue'
import { CheckboxGroupRoot, CheckboxRoot } from '@/Checkbox'
import { DateFieldRoot } from '@/DateField'
import { DateRangeFieldRoot } from '@/DateRangeField'
import { PinInputInput, PinInputRoot } from '@/PinInput'
import { SelectRoot, SelectTrigger } from '@/Select'
import BubbleSelect from '@/Select/BubbleSelect.vue'
import { hiddenNativeFamilies, twinNames, twinsOf } from '@/test/hiddenNativeFamilies'
import { TimeFieldRoot } from '@/TimeField'
import { TimeRangeFieldRoot } from '@/TimeRangeField'
import VisuallyHidden from './VisuallyHidden.vue'
import VisuallyHiddenInput from './VisuallyHiddenInput.vue'

// jsdom lacks ResizeObserver, which the slider thumbs measure with.
globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

enableAutoUnmount(afterEach)

describe('hidden native controls in labelled forms', () => {
  it('names the hidden select when the visible trigger has a native label', async () => {
    const wrapper = mount(() => h('form', [
      h('label', { for: 'topic-trigger' }, 'Topic'),
      h(SelectRoot, { name: 'topic' }, () => h(SelectTrigger, { id: 'topic-trigger' }, () => 'Choose a topic')),
    ]), { attachTo: document.body })
    await flushPromises()

    const select = wrapper.get('select')
    expect(select.attributes('aria-label')).toBe('topic')
    expect(select.attributes('aria-hidden')).toBe('true')
    expect(select.attributes('tabindex')).toBe('-1')
  })

  it('names the hidden checkbox when the visible control has an aria-label', async () => {
    const wrapper = mount(() => h('form', [
      h(CheckboxRoot, { 'name': 'agree', 'aria-label': 'Accept terms' }),
    ]), { attachTo: document.body })
    await flushPromises()

    const input = wrapper.get('input[type="checkbox"]')
    expect(input.attributes('aria-label')).toBe('agree')
    expect(input.attributes('aria-hidden')).toBe('true')
    expect(input.attributes('tabindex')).toBe('-1')
    expect(wrapper.get('[role="checkbox"]').attributes('aria-label')).toBe('Accept terms')
  })

  it('keeps the hidden select label in sync with its form field name', async () => {
    const name = ref('topic')
    const wrapper = mount(() => h(SelectRoot, null, () => h(BubbleSelect, { name: name.value })))
    const select = wrapper.getComponent(BubbleSelect)
    expect(select.get('select').attributes('aria-label')).toBe('topic')

    name.value = 'category'
    await nextTick()

    expect(select.get('select').attributes('aria-label')).toBe('category')
  })

  it('preserves a label supplied to the native select', () => {
    const wrapper = mount(() => h(SelectRoot, null, () => h(BubbleSelect, {
      'name': 'topic',
      'aria-label': 'Topic for autofill',
    })))

    expect(wrapper.get('select').attributes('aria-label')).toBe('Topic for autofill')
  })

  it('keeps the hidden input label in sync with its form field name', async () => {
    const wrapper = mount(VisuallyHiddenInput, { props: { name: 'agree', value: 'yes' } })
    expect(wrapper.get('input').attributes('aria-label')).toBe('agree')

    await wrapper.setProps({ name: 'consent' })

    expect(wrapper.get('input').attributes('aria-label')).toBe('consent')
  })

  it('preserves labels supplied to hidden inputs', () => {
    const wrapper = mount(VisuallyHiddenInput, {
      props: { name: 'agree', value: 'yes' },
      attrs: { 'aria-label': 'Accept terms', 'aria-labelledby': 'terms-label' },
    })

    expect(wrapper.get('input').attributes('aria-label')).toBe('Accept terms')
    expect(wrapper.get('input').attributes('aria-labelledby')).toBe('terms-label')
  })

  it('names each input when serializing an array', () => {
    const wrapper = mount(VisuallyHiddenInput, { props: { name: 'topics', value: ['news', 'events'] } })

    expect(wrapper.findAll('input').map(input => [input.attributes('name'), input.attributes('aria-label')])).toEqual([
      ['topics[0]', 'topics[0]'],
      ['topics[1]', 'topics[1]'],
    ])
  })

  it('does not add a default label to inputs exposed to assistive technology', () => {
    const wrapper = mount(VisuallyHiddenInput, { props: { name: 'topic', value: 'news', feature: 'focusable' } })

    expect(wrapper.get('input').attributes('aria-label')).toBeUndefined()
    expect(wrapper.get('input').attributes('aria-hidden')).toBeUndefined()
  })

  describe('without a form field name', () => {
    it('leaves the hidden input of an unnamed required checkbox group unlabelled', async () => {
      const wrapper = mount(() => h('form', [
        h(CheckboxGroupRoot, { required: true }, () => h(CheckboxRoot, { value: 'news' })),
      ]), { attachTo: document.body })
      await flushPromises()

      const input = wrapper.get('input')
      expect(input.attributes('name')).toBe('')
      expect(input.attributes('aria-hidden')).toBe('true')
      expect(input.attributes()).not.toHaveProperty('aria-label')
    })

    it('leaves a hidden input with an empty name unlabelled', () => {
      const wrapper = mount(VisuallyHiddenInput, { props: { name: '', value: 'yes' } })

      expect(wrapper.get('input').attributes()).not.toHaveProperty('aria-label')
    })

    it('leaves the hidden select unlabelled', () => {
      const wrapper = mount(() => h(SelectRoot, null, () => h(BubbleSelect, { name: '' })))

      expect(wrapper.get('select').attributes()).not.toHaveProperty('aria-label')
    })

    it('leaves the hidden pin input unlabelled', async () => {
      const wrapper = mount(() => h(PinInputRoot, null, () => h(PinInputInput, { index: 0 })), { attachTo: document.body })
      await flushPromises()

      expect(wrapper.get('input[aria-hidden="true"]').attributes()).not.toHaveProperty('aria-label')
    })

    it('leaves the hidden date field input unlabelled', async () => {
      const wrapper = mount(() => h(DateFieldRoot), { attachTo: document.body })
      await flushPromises()

      expect(wrapper.get('input[aria-hidden="true"]').attributes()).not.toHaveProperty('aria-label')
    })
  })

  describe('when the input is hidden with an explicit aria-hidden', () => {
    it.each([
      ['PinInput', () => h(PinInputRoot, { name: 'otp' }, () => h(PinInputInput, { index: 0 })), 'otp'],
      ['DateField', () => h(DateFieldRoot, { name: 'birthday' }), 'birthday'],
      ['TimeField', () => h(TimeFieldRoot, { name: 'alarm' }), 'alarm'],
      ['DateRangeField', () => h(DateRangeFieldRoot, { name: 'stay' }), 'stay'],
      ['TimeRangeField', () => h(TimeRangeFieldRoot, { name: 'shift' }), 'shift'],
    ])('names the hidden %s input after its form field', async (_family, render, name) => {
      const wrapper = mount(render, { attachTo: document.body })
      await flushPromises()

      const inputs = wrapper.findAll('input[aria-hidden="true"]')
      expect(inputs).toHaveLength(1)
      expect(inputs[0].attributes('name')).toBe(name)
      expect(inputs[0].attributes('aria-label')).toBe(name)
      expect(inputs[0].attributes('tabindex')).toBe('-1')
    })

    it('names a focusable input that is aria-hidden', () => {
      const wrapper = mount(VisuallyHiddenInput, {
        props: { name: 'topic', value: 'news', feature: 'focusable' },
        attrs: { 'aria-hidden': 'true' },
      })

      expect(wrapper.get('input').attributes('aria-label')).toBe('topic')
    })

    it('names an element rendered through VisuallyHidden directly', () => {
      const wrapper = mount(VisuallyHidden, { props: { as: 'input' }, attrs: { 'name': 'topic', 'aria-hidden': true } })

      expect(wrapper.get('input').attributes('aria-label')).toBe('topic')
    })

    it('preserves a label supplied by the consumer', () => {
      const wrapper = mount(VisuallyHiddenInput, {
        props: { name: 'topic', value: 'news', feature: 'focusable' },
        attrs: { 'aria-hidden': 'true', 'aria-label': 'Topic' },
      })

      expect(wrapper.get('input').attributes('aria-label')).toBe('Topic')
    })
  })

  describe('when the element stays in the accessibility tree', () => {
    it.each([undefined, 'false', false])('does not label a named control with aria-hidden=%s', (ariaHidden) => {
      const wrapper = mount(VisuallyHidden, { props: { as: 'input' }, attrs: { 'name': 'topic', 'aria-hidden': ariaHidden } })

      expect(wrapper.get('input').attributes()).not.toHaveProperty('aria-label')
    })

    it('does not label hidden text', () => {
      const wrapper = mount(VisuallyHidden, { slots: { default: () => 'Close' } })

      expect(wrapper.get('span').attributes()).not.toHaveProperty('aria-label')
    })
  })

  describe('with one of each family in a form', () => {
    it('labels every twin and adds no axe violation', async () => {
      const wrapper = mount(hiddenNativeFamilies(), { attachTo: document.body })
      await flushPromises()
      const form = wrapper.element as HTMLFormElement
      const violations = async () => (await axe(form)).violations.map(violation => [violation.id, violation.nodes.length])

      expect(twinsOf(form).map(twin => [twin.name, twin.getAttribute('aria-label')])).toEqual(twinNames.map(name => [name, name]))
      const labelled = await violations()
      twinsOf(form).forEach(twin => twin.removeAttribute('aria-label'))

      expect(labelled).toEqual(await violations())
    })
  })
})
