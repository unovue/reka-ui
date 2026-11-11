import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { CheckboxRoot } from '@/Checkbox'
import { SelectRoot, SelectTrigger } from '@/Select'
import BubbleSelect from '@/Select/BubbleSelect.vue'
import VisuallyHiddenInput from './VisuallyHiddenInput.vue'

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
})
