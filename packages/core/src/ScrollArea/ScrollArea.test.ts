import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h } from 'vue'
import { sleep } from '@/test'
import ScrollAreaCorner from './ScrollAreaCorner.vue'
import ScrollAreaRoot from './ScrollAreaRoot.vue'
import ScrollAreaScrollbar from './ScrollAreaScrollbar.vue'
import ScrollAreaThumb from './ScrollAreaThumb.vue'
import ScrollAreaViewport from './ScrollAreaViewport.vue'
import ScrollArea from './story/_ScrollArea.vue'

describe('given default ScrollArea', () => {
  let wrapper: VueWrapper<InstanceType<typeof ScrollArea>>

  beforeEach(() => {
    wrapper = mount(ScrollArea, { attachTo: document.body })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 2000 })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 2000 })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render content, but not scrollbar', () => {
    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.html()).not.toContain('data-orientation="vertical"')
  })

  describe('on hover', () => {
    beforeEach(async () => {
      await wrapper.trigger('pointerenter')
      await sleep(100)
    })

    it('should render scrollbar', () => {
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})

describe('given prop:type="always" ScrollArea', () => {
  let wrapper: VueWrapper<InstanceType<typeof ScrollArea>>

  beforeEach(() => {
    wrapper = mount(ScrollArea, { attachTo: document.body, props: { type: 'always' } })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 2000 })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 2000 })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render content and scrollbar', () => {
    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.html()).toContain('data-orientation="vertical"')
  })
})

describe('given prop:type="scroll" ScrollArea', () => {
  let wrapper: VueWrapper<InstanceType<typeof ScrollArea>>

  beforeEach(() => {
    wrapper = mount(ScrollArea, { attachTo: document.body, props: { type: 'scroll' } })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 2000 })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 2000 })
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', { configurable: true, value: 20 })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should render content and scrollbar', () => {
    expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.html()).not.toContain('data-orientation="vertical"')
  })

  describe('on scroll', () => {
    beforeEach(async () => {
      Object.defineProperty(HTMLElement.prototype, 'scrollTop', { configurable: true, value: 40 })
      await wrapper.find('[data-reka-scroll-area-viewport]').trigger('scroll')
      await sleep(10)
    })

    it('should render scrollbar', () => {
      expect(wrapper.html()).toContain('data-orientation="vertical"')
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})

describe('given prop:type="hover" ScrollArea with both scrollbars and a corner', () => {
  // ScrollAreaCornerImpl sizes itself from a ResizeObserver bound to the
  // scrollbar elements. jsdom has no ResizeObserver, so provide a minimal mock
  // that fires its callback immediately on observe (matching a browser's
  // initial dispatch) so the corner can compute its size and render.
  let originalResizeObserver: typeof globalThis.ResizeObserver

  const BothScrollArea = defineComponent({
    props: ['type'],
    setup(props) {
      return () =>
        h(ScrollAreaRoot, { type: props.type, style: 'width: 200px; height: 200px; overflow: hidden;' }, () => [
          h(ScrollAreaViewport, { style: 'width: 100%; height: 100%;' }, () =>
            h('div', { style: 'width: 1000px; height: 1000px;' })),
          h(ScrollAreaScrollbar, { orientation: 'vertical' }, () => h(ScrollAreaThumb)),
          h(ScrollAreaScrollbar, { orientation: 'horizontal' }, () => h(ScrollAreaThumb)),
          h(ScrollAreaCorner, null, () => h('span', { 'data-testid': 'corner-content' })),
        ])
    },
  })

  let wrapper: VueWrapper<InstanceType<typeof BothScrollArea>>

  beforeEach(() => {
    originalResizeObserver = globalThis.ResizeObserver
    globalThis.ResizeObserver = class {
      private cb: ResizeObserverCallback
      constructor(cb: ResizeObserverCallback) {
        this.cb = cb
      }

      observe(target: Element) {
        this.cb([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver)
      }

      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 10 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 10 })
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 2000 })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: 2000 })

    wrapper = mount(BothScrollArea, { attachTo: document.body, props: { type: 'hover' } })
  })

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver
    wrapper?.unmount()
  })

  it('keeps the corner in sync with the scrollbars across repeated hover cycles', async () => {
    // 1st cycle: enter -> corner appears
    await wrapper.trigger('pointerenter')
    await sleep(100)
    expect(wrapper.find('[data-testid="corner-content"]').exists()).toBe(true)

    // leave -> scrollbars hide and the corner is removed alongside them
    await wrapper.trigger('pointerleave')
    await sleep(700)
    expect(wrapper.find('[data-testid="corner-content"]').exists()).toBe(false)

    // 2nd cycle: enter again -> corner must re-appear (regression #2669)
    await wrapper.trigger('pointerenter')
    await sleep(100)
    expect(wrapper.find('[data-testid="corner-content"]').exists()).toBe(true)
  })
})
