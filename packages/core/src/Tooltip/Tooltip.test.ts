import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
import Tooltip from './stories/_Tooltip.vue'
import TooltipProvider from './TooltipProvider.vue'

describe('given default Tooltip', () => {
  let wrapper: VueWrapper<InstanceType<typeof Tooltip>>

  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(Tooltip, { attachTo: document.body })
  },
  )

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()

    await wrapper.find('button').trigger('focus')
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('should open when focus', async () => {
    await wrapper.find('button').trigger('focus')
    expect(document.body.innerHTML).toContain('Add to library')
  })

  describe('after focusing out', () => {
    beforeEach(() => {
      document.body.focus()
    })

    it('should close the tooltip', () => {
      expect(document.body.innerHTML).not.toContain('Add to library')
    })
  })

  describe('disabled tooltip', () => {
    it('should not be open when focus', async () => {
      await wrapper.setProps({ disabled: true })

      await wrapper.find('button').trigger('focus')

      expect(document.body.innerHTML).not.toContain('Add to library')
    })
  })
})

describe('given tooltip within TooltipProvider', () => {
  let wrapper: VueWrapper<InstanceType<typeof Tooltip>>

  beforeEach(() => {
    document.body.innerHTML = ''

    wrapper = mount(Tooltip, {
      global: {
        stubs: {
          teleport: {
            template: '<div><slot /></div>',
          },
        },
      },
      attachTo: document.body,
    })
  })

  it('should use the provider content values', async () => {
    await wrapper.find('button').trigger('focus')

    const tooltipContentImpl = wrapper.findComponent(TooltipProvider)

    expect(tooltipContentImpl.props('content')).toBe(undefined)

    expect(tooltipContentImpl.html()).toContain('data-side="top"')

    await wrapper.setProps({
      tooltipProvider: {
        content: {
          side: 'left',
        },
      },
    })

    await flushPromises()

    expect(tooltipContentImpl.props('content')).toEqual({
      side: 'left',
    })

    expect(tooltipContentImpl.html()).toContain('data-side="left"')
  })
})

// `data-state` is the disclosure axis only (`open` | `closed`, #2823); whether the
// open was delayed is a separate boolean qualifier, `data-delayed`.
describe('given tooltip data-state / data-delayed contract', () => {
  let wrapper: VueWrapper<InstanceType<typeof Tooltip>>

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    document.body.innerHTML = ''
    wrapper = mount(Tooltip, {
      global: { stubs: { teleport: { template: '<div><slot /></div>' } } },
      attachTo: document.body,
      props: { tooltipProvider: { delayDuration: 700 } },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is `closed` without `data-delayed` initially', () => {
    const trigger = wrapper.find('button')
    expect(trigger.attributes('data-state')).toBe('closed')
    expect(trigger.attributes('data-delayed')).toBeUndefined()
  })

  it('is `open` without `data-delayed` after an instant open (focus)', async () => {
    const trigger = wrapper.find('button')
    await trigger.trigger('focus')
    await nextTick()

    expect(trigger.attributes('data-state')).toBe('open')
    expect(trigger.attributes('data-delayed')).toBeUndefined()
    const content = wrapper.find('[data-state="open"]:not(button)')
    expect(content.exists()).toBe(true)
    expect(content.attributes('data-delayed')).toBeUndefined()
  })

  it('is `open` with `data-delayed=""` after a delayed open (pointer + timer)', async () => {
    const trigger = wrapper.find('button')
    await trigger.trigger('pointermove', { pointerType: 'mouse' })
    await nextTick()
    // Timer has not fired yet: still closed, no qualifier.
    expect(trigger.attributes('data-state')).toBe('closed')
    expect(trigger.attributes('data-delayed')).toBeUndefined()

    vi.advanceTimersByTime(700)
    await nextTick()
    await nextTick()

    expect(trigger.attributes('data-state')).toBe('open')
    expect(trigger.attributes('data-delayed')).toBe('')
    const content = wrapper.find('[data-state="open"]:not(button)')
    expect(content.exists()).toBe(true)
    expect(content.attributes('data-delayed')).toBe('')
  })

  it('drops `data-delayed` again once closed', async () => {
    const trigger = wrapper.find('button')
    await trigger.trigger('pointermove', { pointerType: 'mouse' })
    vi.advanceTimersByTime(700)
    await nextTick()
    expect(trigger.attributes('data-delayed')).toBe('')

    await trigger.trigger('blur')
    await nextTick()
    expect(trigger.attributes('data-state')).toBe('closed')
    expect(trigger.attributes('data-delayed')).toBeUndefined()
  })
})
