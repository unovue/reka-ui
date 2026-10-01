import type { VueWrapper } from '@vue/test-utils'
import type { PropType } from 'vue'
import { mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h } from 'vue'
import { sleep } from '@/test'
import ScrollAreaCorner from './ScrollAreaCorner.vue'
import ScrollAreaRoot from './ScrollAreaRoot.vue'
import ScrollAreaScrollbar from './ScrollAreaScrollbar.vue'
import ScrollAreaThumb from './ScrollAreaThumb.vue'
import ScrollAreaViewport from './ScrollAreaViewport.vue'
import ScrollAreaVirtualizer from './ScrollAreaVirtualizer.vue'
import ScrollArea from './story/_ScrollArea.vue'

describe('given a virtualized ScrollArea', () => {
  const options = Array.from({ length: 100 }, (_, index) => `Item ${index}`)
  const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect
  // offset of the virtualizer inside the viewport's content
  let virtualizerOffset = 0

  beforeAll(() => {
    window.HTMLElement.prototype.getBoundingClientRect = function () {
      const top = this.hasAttribute('data-reka-virtualizer') ? virtualizerOffset : 0
      return { width: 200, height: 200, top, left: 0, right: 200, bottom: top + 200, x: 0, y: top, toJSON() {} }
    }
  })

  afterEach(() => {
    virtualizerOffset = 0
    document.body.innerHTML = ''
  })

  afterAll(() => {
    window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
  })

  const VirtualScrollArea = defineComponent({
    props: {
      options: { type: Array, default: () => options },
      estimateSize: { type: Number, default: 25 },
      overscan: { type: Number, default: undefined },
      horizontal: { type: Boolean, default: false },
      dir: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
      withSlot: { type: Boolean, default: true },
    },
    setup(props) {
      return () => h(ScrollAreaRoot, { dir: props.dir }, {
        default: () => h(ScrollAreaViewport, { style: 'width: 200px; height: 200px' }, {
          default: () => h(ScrollAreaVirtualizer, {
            options: props.options,
            estimateSize: props.estimateSize,
            overscan: props.overscan,
            horizontal: props.horizontal,
          }, props.withSlot
            ? { default: ({ option, virtualItem }: any) => h('div', { 'data-testid': 'item' }, `${virtualItem.index}:${option}`) }
            : undefined),
        }),
      })
    },
  })

  async function flush() {
    await new Promise(resolve => requestAnimationFrame(() => resolve(null)))
    await sleep(0)
  }

  it('should pass axe accessibility tests', async () => {
    const wrapper = mount(VirtualScrollArea, { attachTo: document.body })
    await flush()

    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('renders only the visible subset with matching slot data', async () => {
    const wrapper = mount(VirtualScrollArea, { attachTo: document.body })
    await flush()

    const items = wrapper.findAll('[data-testid="item"]')
    // 8 visible (200px / 25px) + 12 overscan
    expect(items.length).toBe(20)
    expect(items[0].text()).toBe('0:Item 0')
    expect(wrapper.find('[data-reka-virtualizer]').attributes('style')).toContain('height: 2500px')
  })

  it('stretches items across the viewport', async () => {
    const wrapper = mount(VirtualScrollArea, { attachTo: document.body })
    await flush()

    const style = wrapper.findAll('[data-testid="item"]')[1].attributes('style')
    expect(style).toContain('left: 0px')
    expect(style).toContain('right: 0px')
    expect(style).toContain('translateY(25px)')
  })

  it('supports horizontal virtualization', async () => {
    const wrapper = mount(VirtualScrollArea, { attachTo: document.body, props: { horizontal: true } })
    await flush()

    const virtualizer = wrapper.find('[data-reka-virtualizer]')
    expect(virtualizer.attributes('style')).toContain('width: 2500px')
    expect(virtualizer.attributes('style')).not.toContain('height')

    const style = wrapper.findAll('[data-testid="item"]')[1].attributes('style')
    expect(style).toContain('left: 0px')
    expect(style).not.toContain('right')
    expect(style).toContain('translateX(25px)')
  })

  it('mirrors horizontal items in RTL', async () => {
    const wrapper = mount(VirtualScrollArea, { attachTo: document.body, props: { horizontal: true, dir: 'rtl' } })
    await flush()

    const style = wrapper.findAll('[data-testid="item"]')[1].attributes('style')
    expect(style).toContain('right: 0px')
    expect(style).not.toContain('left')
    expect(style).toContain('translateX(-25px)')
  })

  it('scrolls to the mirrored offset in RTL', async () => {
    const wrapper = mount(VirtualScrollArea, { attachTo: document.body, props: { horizontal: true, dir: 'rtl' } })
    await flush()

    const viewport = wrapper.find('[data-reka-scroll-area-viewport]').element as HTMLElement
    const scrollTo = vi.fn()
    viewport.scrollTo = scrollTo
    // jsdom has no layout, and the virtualizer clamps to the scrollable range
    Object.defineProperty(viewport, 'scrollWidth', { value: 2500 })
    Object.defineProperty(viewport, 'clientWidth', { value: 200 })

    wrapper.findComponent(ScrollAreaVirtualizer).vm.virtualizer.scrollToOffset(500)
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: -500 }))
  })

  it('offsets items by the content rendered before the virtualizer', async () => {
    virtualizerOffset = 300
    const wrapper = mount(VirtualScrollArea, { attachTo: document.body })
    await flush()

    const items = wrapper.findAll('[data-testid="item"]')
    // nothing is within the 200px viewport yet, so only the overscan is rendered
    expect(items.length).toBe(13)
    expect(items[0].attributes('style')).toContain('translateY(0px)')
    expect(wrapper.find('[data-reka-virtualizer]').attributes('style')).toContain('height: 2500px')
  })

  it('reacts to options, overscan and estimateSize changes', async () => {
    const wrapper = mount(VirtualScrollArea, { attachTo: document.body, props: { overscan: 1 } })
    await flush()
    expect(wrapper.findAll('[data-testid="item"]').length).toBe(9)

    await wrapper.setProps({ overscan: 4 })
    await flush()
    expect(wrapper.findAll('[data-testid="item"]').length).toBe(12)

    await wrapper.setProps({ estimateSize: 50 })
    await flush()
    expect(wrapper.find('[data-reka-virtualizer]').attributes('style')).toContain('height: 5000px')

    await wrapper.setProps({ options: options.slice(0, 10) })
    await flush()
    expect(wrapper.find('[data-reka-virtualizer]').attributes('style')).toContain('height: 500px')
  })

  it('renders nothing until a default slot is provided', async () => {
    const wrapper = mount(VirtualScrollArea, { attachTo: document.body, props: { withSlot: false } })
    await flush()

    const virtualizer = wrapper.find('[data-reka-virtualizer]')
    expect(virtualizer.element.children.length).toBe(0)
    expect(virtualizer.attributes('style')).toContain('height: 2500px')

    await wrapper.setProps({ withSlot: true })
    expect(wrapper.findAll('[data-testid="item"]').length).toBe(20)
  })

  it('exposes the virtualizer instance', async () => {
    const wrapper = mount(VirtualScrollArea, { attachTo: document.body })
    await flush()

    const { virtualizer } = wrapper.findComponent(ScrollAreaVirtualizer).vm
    expect(virtualizer.getTotalSize()).toBe(2500)
    expect(virtualizer.options.count).toBe(100)
  })
})

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
