import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { sleep } from '@/test'
import HoverCard from './story/_HoverCard.vue'

describe('given a default HoverCard', () => {
  let wrapper: VueWrapper<InstanceType<typeof HoverCard>>
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    wrapper = mount(HoverCard, { attachTo: document.body })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('after mouse enter for a 100ms', () => {
    it('should pass axe accessibility tests', async () => {
      await wrapper.find('a').trigger('mouseenter')
      await sleep(100)
      expect(await axe(document.body)).toHaveNoViolations()
    })
  })

  describe('a touch tap on the trigger', () => {
    it('should not open the hover card by default', async () => {
      await wrapper.find('a').trigger('pointerup', { pointerType: 'touch' })
      await sleep(100)
      expect(wrapper.find('a').attributes('data-state')).toBe('closed')
    })
  })

  // HoverCard mainly depends on Popper, test for Popper is not required here
})

describe('given a HoverCard with enableTouch', () => {
  let wrapper: VueWrapper<InstanceType<typeof HoverCard>>
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  beforeEach(() => {
    wrapper = mount(HoverCard, { props: { enableTouch: true }, attachTo: document.body })
  })

  it('should toggle open/closed on touch tap', async () => {
    const trigger = wrapper.find('a')

    await trigger.trigger('pointerup', { pointerType: 'touch' })
    await sleep(10)
    expect(trigger.attributes('data-state')).toBe('open')

    await trigger.trigger('pointerup', { pointerType: 'touch' })
    await sleep(10)
    expect(trigger.attributes('data-state')).toBe('closed')
  })

  it('should ignore non-touch pointers', async () => {
    const trigger = wrapper.find('a')

    await trigger.trigger('pointerup', { pointerType: 'mouse' })
    await sleep(10)
    expect(trigger.attributes('data-state')).toBe('closed')
  })

  it('should not reopen from a pending focus timer after closing on touch', async () => {
    const trigger = wrapper.find('a')

    // focus schedules a delayed open (openDelay), then a touch tap opens immediately
    await trigger.trigger('focus')
    await trigger.trigger('pointerup', { pointerType: 'touch' })
    await sleep(10)
    expect(trigger.attributes('data-state')).toBe('open')

    // closing must cancel the pending open timer so it doesn't reopen
    await trigger.trigger('pointerup', { pointerType: 'touch' })
    await sleep(150)
    expect(trigger.attributes('data-state')).toBe('closed')
  })
})
