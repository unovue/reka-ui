import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { TooltipProvider, TooltipRoot, TooltipTrigger } from '.'

/**
 * Mounts two tooltip triggers under one provider to test shared delay state.
 * Uses a 100 ms open delay and a 200 ms skip-delay window with hoverable content disabled.
 * @returns The body-attached fixture wrapper, which the caller must unmount.
 */
function mountTooltips() {
  return mount(defineComponent({
    setup: () => () => h(TooltipProvider, { delayDuration: 100, skipDelayDuration: 200, disableHoverableContent: true }, () => [
      h(TooltipRoot, () => h(TooltipTrigger, { 'data-testid': 'first' }, () => 'First')),
      h(TooltipRoot, () => h(TooltipTrigger, { 'data-testid': 'second' }, () => 'Second')),
    ]),
  }), { attachTo: document.body })
}

describe('tooltip timer lifecycle', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.useFakeTimers()
    wrapper = mountTooltips()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('waits for the open delay and cancels it when the pointer leaves', async () => {
    const trigger = wrapper.get('[data-testid=first]')
    await trigger.trigger('pointermove', { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(99)
    expect(trigger.attributes('data-state')).toBe('closed')
    await trigger.trigger('pointerleave')
    await vi.advanceTimersByTimeAsync(101)
    expect(trigger.attributes('data-state')).toBe('closed')

    await trigger.trigger('pointermove', { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(100)
    expect(trigger.attributes('data-state')).toBe('delayed-open')
  })

  it('skips the open delay briefly after close, then restores it', async () => {
    const first = wrapper.get('[data-testid=first]')
    const second = wrapper.get('[data-testid=second]')
    await first.trigger('pointermove', { pointerType: 'mouse' })
    await vi.advanceTimersByTimeAsync(100)
    expect(first.attributes('data-state')).toBe('delayed-open')
    await first.trigger('pointerleave')
    await vi.advanceTimersByTimeAsync(199)
    await second.trigger('pointermove', { pointerType: 'mouse' })
    expect(second.attributes('data-state')).toBe('instant-open')
    await second.trigger('pointerleave')
    await vi.advanceTimersByTimeAsync(200)
    await first.trigger('pointermove', { pointerType: 'mouse' })
    expect(first.attributes('data-state')).toBe('closed')
    await vi.advanceTimersByTimeAsync(100)
    expect(first.attributes('data-state')).toBe('delayed-open')
  })

  it('disposes a pending open timer when unmounted', async () => {
    await wrapper.get('[data-testid=first]').trigger('pointermove', { pointerType: 'mouse' })
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    const roots = wrapper.findAllComponents(TooltipRoot)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(200)
    for (const root of roots)
      expect(root.emitted('update:open')).toBeUndefined()
  })
})
