import type { VueWrapper } from '@vue/test-utils'
import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick } from 'vue'
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
      vi.useFakeTimers()
      await wrapper.trigger('pointerenter')
      await vi.advanceTimersByTimeAsync(100)
    })

    afterEach(() => {
      vi.useRealTimers()
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
      vi.useFakeTimers()
      Object.defineProperty(HTMLElement.prototype, 'scrollTop', { configurable: true, value: 40 })
      await wrapper.find('[data-reka-scroll-area-viewport]').trigger('scroll')
      await vi.advanceTimersByTimeAsync(10)
    })

    afterEach(() => {
      vi.useRealTimers()
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

    // The hide delay (`scrollHideDelay`, 600 ms) is a timer: drive it.
    vi.useFakeTimers()
    wrapper = mount(BothScrollArea, { attachTo: document.body, props: { type: 'hover' } })
  })

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('keeps the corner in sync with the scrollbars across repeated hover cycles', async () => {
    // 1st cycle: enter -> corner appears
    await wrapper.trigger('pointerenter')
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.find('[data-testid="corner-content"]').exists()).toBe(true)

    // leave -> scrollbars hide and the corner is removed alongside them
    await wrapper.trigger('pointerleave')
    await vi.advanceTimersByTimeAsync(700)
    expect(wrapper.find('[data-testid="corner-content"]').exists()).toBe(false)

    // 2nd cycle: enter again -> corner must re-appear (regression #2669)
    await wrapper.trigger('pointerenter')
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.find('[data-testid="corner-content"]').exists()).toBe(true)
  })
})

describe('given prop:type="always" ScrollArea thumb state', () => {
  let originalResizeObserver: typeof globalThis.ResizeObserver

  beforeEach(() => {
    originalResizeObserver = globalThis.ResizeObserver
    // Fire the callback on observe so the scrollbar measures its sizes (jsdom has no ResizeObserver).
    globalThis.ResizeObserver = class {
      constructor(private cb: ResizeObserverCallback) {}
      observe(target: Element) {
        this.cb([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver)
      }

      unobserve() {}
      disconnect() {}
    }
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 500 })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 })
  })

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver
    vi.useRealTimers()
  })

  it.each([
    { content: 500, state: 'closed' },
    { content: 2000, state: 'open' },
  ])('sets data-state="$state" when the content height is $content', async ({ content, state }) => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: content })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, value: content })

    vi.useFakeTimers()
    const wrapper = mount(ScrollArea, { attachTo: document.body, props: { type: 'always' } })
    await vi.advanceTimersByTimeAsync(100)

    expect(wrapper.find('[data-orientation="vertical"] > div').attributes('data-state')).toBe(state)
    wrapper.unmount()
  })
})

describe('given a visible scrollbar', () => {
  // A non-passive wheel listener on the document makes WebKit wait for the main thread
  // before scrolling anything on the page, so the scrollbar listens on itself.
  it('listens for wheel events on the scrollbar, not on the document', async () => {
    // jsdom has no ResizeObserver
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
    onTestFinished(() => vi.unstubAllGlobals())
    const documentListener = vi.spyOn(document, 'addEventListener')
    const elementListener = vi.spyOn(HTMLElement.prototype, 'addEventListener')
    const wrapper = mount(ScrollArea, { attachTo: document.body, props: { type: 'always' } })
    await nextTick()

    expect(documentListener.mock.calls.filter(([type]) => type === 'wheel')).toEqual([])
    const scrollbars = Array.from(wrapper.element.querySelectorAll('[data-scrollbarimpl]'))
    const wheelOnScrollbar = elementListener.mock.contexts
      .map((context, index) => [context, elementListener.mock.calls[index]] as const)
      .filter(([context, [type]]) => type === 'wheel' && scrollbars.includes(context as Element))
    expect(wheelOnScrollbar.length).toBeGreaterThan(0)
    for (const [, [, , options]] of wheelOnScrollbar)
      expect(options).toMatchObject({ passive: false })

    wrapper.unmount()
    documentListener.mockRestore()
    elementListener.mockRestore()
  })
})

describe('given a ScrollAreaViewport', () => {
  it('renders a camelCase tabIndex only once during SSR', async () => {
    const html = await renderToString(h(ScrollAreaRoot, null, () => h(ScrollAreaViewport, { tabIndex: -1 })))
    expect(html.match(/\btabindex="[^"]*"/g)).toEqual(['tabindex="-1"'])
  })

  it.each([
    { attrs: {}, expected: '0' },
    { attrs: { tabindex: '-1' }, expected: '-1' },
    { attrs: { tabindex: null }, expected: undefined },
  ])('renders $expected for viewport attributes $attrs', ({ attrs, expected }) => {
    const wrapper = mount(ScrollAreaRoot, {
      slots: { default: () => h(ScrollAreaViewport, attrs) },
    })

    expect(wrapper.get('[data-reka-scroll-area-viewport]').attributes('tabindex')).toBe(expected)
    wrapper.unmount()
  })

  it('keeps tabindex after the other viewport attributes', () => {
    const wrapper = mount(ScrollAreaRoot, {
      slots: { default: () => h(ScrollAreaViewport, { 'class': 'viewport', 'aria-label': 'list' }) },
    })

    expect(wrapper.get('[data-reka-scroll-area-viewport]').element.getAttributeNames().at(-1)).toBe('tabindex')
    wrapper.unmount()
  })
})
