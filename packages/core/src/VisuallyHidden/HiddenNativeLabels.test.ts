import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { CheckboxRoot } from '@/Checkbox'
import { SelectRoot, SelectTrigger } from '@/Select'

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
})
