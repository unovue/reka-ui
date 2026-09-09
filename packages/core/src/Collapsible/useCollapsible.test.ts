import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger, useCollapsible } from './index'

describe('useCollapsible', () => {
  it('toggles uncontrolled and ref-owned state', () => {
    const disclosure = useCollapsible({ defaultOpen: true })
    disclosure.onOpenToggle()
    expect(disclosure.open.value).toBe(false)
    const open = ref<boolean>()
    const owned = useCollapsible({ open })
    owned.onOpenToggle()
    expect(open.value).toBe(true)
    expect(owned.isControlled.value).toBe(true)
  })

  it('waits for controlled updates', () => {
    const open = ref(false)
    const onUpdate = vi.fn()
    const disclosure = useCollapsible({ open: () => open.value, onUpdate })
    disclosure.onOpenToggle()
    expect(disclosure.open.value).toBe(false)
    expect(onUpdate).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press' }))
    open.value = true
    expect(disclosure.open.value).toBe(true)
  })

  it('cancels before mutation and preserves native event details', () => {
    const emit = vi.fn()
    const disclosure = useCollapsible({ emit, onBeforeUpdate: (_, details) => details.cancel() })
    const event = new MouseEvent('click')
    disclosure.trigger.attrs.value.onClick(event)
    expect(disclosure.open.value).toBe(false)
    expect(emit.mock.calls.map(call => call[0])).toEqual(['beforeUpdate:open'])
    expect(disclosure.lastChangeDetails.value).toMatchObject({ reason: 'trigger-press', event, isCanceled: true })
  })

  it('derives linked ids and reactive state for every part', () => {
    const disabled = ref(false)
    const disclosure = useCollapsible({ baseId: 'test', disabled, unmountOnHide: false })
    expect(disclosure.trigger.attrs.value['aria-controls']).toBe('test-content')
    expect(disclosure.content.attrs.value.id).toBe('test-content')
    expect(disclosure.content.props.value.hidden).toBe('until-found')
    disabled.value = true
    disclosure.trigger.attrs.value.onClick(new MouseEvent('click'))
    expect(disclosure.open.value).toBe(false)
    for (const part of [disclosure.root, disclosure.trigger, disclosure.content])
      expect(part.attrs.value['data-disabled']).toBe('')
    expect(useCollapsible().content.props.value.id).not.toBe(useCollapsible().content.props.value.id)
  })

  it('opens discovered content idempotently and respects disabled state', () => {
    const disabled = ref(false)
    const onUpdate = vi.fn()
    const disclosure = useCollapsible({ disabled, onUpdate })
    const event = new Event('beforematch')
    disclosure.context.onContentFound?.(event)
    disclosure.context.onContentFound?.(event)
    expect(disclosure.open.value).toBe(true)
    expect(onUpdate).toHaveBeenCalledExactlyOnceWith(true, expect.objectContaining({ reason: 'content-found', event }))
    disclosure.setOpen(false)
    disabled.value = true
    disclosure.context.onContentFound?.(event)
    expect(disclosure.open.value).toBe(false)
  })
})

describe('collapsible change events', () => {
  it.each([false, true])('honors cancellation for click and content discovery (%s)', async (cancel) => {
    const before = vi.fn((_, details) => {
      if (cancel)
        details.cancel()
    })
    const found = vi.fn()
    const wrapper = mount(CollapsibleRoot, {
      props: { 'unmountOnHide': false, 'onBeforeUpdate:open': before },
      slots: { default: () => [h(CollapsibleTrigger, {}, () => 'Toggle'), h(CollapsibleContent, { onContentFound: found }, () => 'Content')] },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('button').attributes('aria-expanded')).toBe(String(!cancel))
    if (!cancel)
      await wrapper.find('button').trigger('click')
    const event = new Event('beforematch')
    wrapper.findComponent(CollapsibleContent).element.dispatchEvent(event)
    await vi.waitFor(() => expect(found).toHaveBeenCalledWith(event))
    await nextTick()
    expect(before).toHaveBeenLastCalledWith(true, expect.objectContaining({ reason: 'content-found', event }))
    expect(wrapper.find('button').attributes('aria-expanded')).toBe(String(!cancel))
    wrapper.unmount()
  })
})
