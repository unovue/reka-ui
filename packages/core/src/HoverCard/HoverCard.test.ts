import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick } from 'vue'
import { sleep } from '@/test'
import {
  HoverCardContent,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
} from '.'
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

  // HoverCard mainly depends on Popper, test for Popper is not required here
})

describe('closeOnAncestorScroll', () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  const HoverCardInScrollableContainer = defineComponent({
    components: { HoverCardRoot, HoverCardTrigger, HoverCardContent, HoverCardPortal },
    props: {
      closeOnAncestorScroll: { type: Boolean, default: true },
      openDelay: { type: Number, default: 0 },
    },
    template: `
      <div id="scrollable-ancestor" style="overflow: auto; height: 200px; width: 200px;">
        <HoverCardRoot
          :close-on-ancestor-scroll="closeOnAncestorScroll"
          :open-delay="openDelay"
          :close-delay="0"
        >
          <HoverCardTrigger as="button">trigger</HoverCardTrigger>
          <HoverCardPortal>
            <HoverCardContent>HoverCard text</HoverCardContent>
          </HoverCardPortal>
        </HoverCardRoot>
      </div>
    `,
  })

  // jsdom doesn't support PointerEvent, so we use MouseEvent with pointerType
  function pointerEnter(el: Element) {
    const event = new MouseEvent('pointerenter', { bubbles: true })
    Object.defineProperty(event, 'pointerType', { value: 'mouse' })
    el.dispatchEvent(event)
  }

  beforeEach(() => {
    document.body.innerHTML = ''
    vi.useFakeTimers()
  })

  afterEach(async () => {
    await flushPromises()
    vi.useRealTimers()
  })

  it('should close the hover card when a scrollable ancestor is scrolled', async () => {
    const wrapper = mount(HoverCardInScrollableContainer, { attachTo: document.body })

    pointerEnter(wrapper.find('button').element)
    vi.runAllTimers()
    await flushPromises()
    expect(document.body.innerHTML).toContain('HoverCard text')

    document.getElementById('scrollable-ancestor')!.dispatchEvent(new Event('scroll'))
    await flushPromises()

    expect(document.body.innerHTML).not.toContain('HoverCard text')
    wrapper.unmount()
  })

  it('should not close the hover card when closeOnAncestorScroll is false', async () => {
    const wrapper = mount(HoverCardInScrollableContainer, {
      attachTo: document.body,
      props: { closeOnAncestorScroll: false },
    })

    pointerEnter(wrapper.find('button').element)
    vi.runAllTimers()
    await flushPromises()
    expect(document.body.innerHTML).toContain('HoverCard text')

    document.getElementById('scrollable-ancestor')!.dispatchEvent(new Event('scroll'))
    await flushPromises()

    expect(document.body.innerHTML).toContain('HoverCard text')
    wrapper.unmount()
  })

  it('should cancel a pending open timer when ancestor is scrolled during openDelay', async () => {
    const wrapper = mount(HoverCardInScrollableContainer, {
      attachTo: document.body,
      props: { openDelay: 500 },
    })

    // Start the open timer — card is still closed
    pointerEnter(wrapper.find('button').element)
    await nextTick()
    expect(document.body.innerHTML).not.toContain('HoverCard text')

    // Scroll before openDelay fires — should cancel the timer
    document.getElementById('scrollable-ancestor')!.dispatchEvent(new Event('scroll'))
    await nextTick()

    // Advance past openDelay — card must NOT open because timer was cancelled
    vi.advanceTimersByTime(600)
    await nextTick()

    expect(document.body.innerHTML).not.toContain('HoverCard text')
    wrapper.unmount()
  })
})
