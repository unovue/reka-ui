import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from './index'

function mountCollapsible(props = {}, triggerProps = {}, contentProps = {}) {
  return mount(CollapsibleRoot, {
    props,
    slots: { default: () => [
      h(CollapsibleTrigger, triggerProps, () => 'Toggle'),
      h(CollapsibleContent, contentProps, () => 'Content'),
    ] },
  })
}

describe('collapsible characterization', () => {
  it('links trigger and content and chains consumer clicks', async () => {
    const onClick = vi.fn()
    const wrapper = mountCollapsible({}, { onClick })
    await nextTick()
    const trigger = wrapper.find('button')
    expect(trigger.attributes('aria-controls')).toBe(wrapper.find('[hidden]').attributes('id'))
    expect(trigger.attributes('type')).toBe('button')
    await trigger.trigger('click')
    expect(onClick).toHaveBeenCalledOnce()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    expect(wrapper.emitted('update:open')?.[0][0]).toBe(true)
    wrapper.unmount()
  })

  it('waits for controlled state and reacts to disabled changes', async () => {
    const wrapper = mountCollapsible({ open: false })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:open')?.[0][0]).toBe(true)
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('false')
    await wrapper.setProps({ open: true, disabled: true })
    expect(wrapper.find('button').attributes('data-disabled')).toBe('')
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:open')).toHaveLength(1)
    wrapper.unmount()
  })

  it('opens through the writable exposed open ref', async () => {
    const root = ref<{ open: boolean }>()
    const onUpdate = vi.fn()
    const wrapper = mount(defineComponent({
      setup: () => () => h(CollapsibleRoot, { 'ref': root, 'onUpdate:open': onUpdate }, () => [
        h(CollapsibleTrigger, null, () => 'Toggle'),
        h(CollapsibleContent, null, () => 'Content'),
      ]),
    }))
    expect(root.value!.open).toBe(false)

    root.value!.open = true
    await nextTick()
    expect(root.value!.open).toBe(true)
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('true')
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'imperative-action' }))
    wrapper.unmount()
  })

  it('keeps force-mounted content rendered while closed', () => {
    const wrapper = mountCollapsible({}, {}, { forceMount: true })
    expect(wrapper.text()).toContain('Content')
    expect(wrapper.find('[data-state="closed"][id]').attributes('hidden')).toBeUndefined()
    wrapper.unmount()
  })
})
