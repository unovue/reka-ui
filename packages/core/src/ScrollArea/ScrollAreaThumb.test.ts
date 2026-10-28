import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import ScrollAreaRoot, { injectScrollAreaRootContext } from './ScrollAreaRoot.vue'
import { provideScrollAreaScrollbarVisibleContext } from './ScrollAreaScrollbarVisible.vue'
import ScrollAreaThumb from './ScrollAreaThumb.vue'
import ScrollAreaViewport from './ScrollAreaViewport.vue'

describe('scroll area thumb frame loop', () => {
  let wrapper: VueWrapper
  let viewport: HTMLElement
  let onThumbPositionChange: ReturnType<typeof vi.fn>
  let frames: Map<number, FrameRequestCallback>
  let frameId: number
  let viewportKey: ReturnType<typeof ref<number>>
  let onViewportChange: (viewport: HTMLElement | null) => void

  beforeEach(async () => {
    vi.useFakeTimers()
    frames = new Map()
    frameId = 0
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.set(++frameId, callback)
      return frameId
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => frames.delete(id))
    onThumbPositionChange = vi.fn()
    viewportKey = ref(0)
    const sizes = ref({ content: 1000, viewport: 100, scrollbar: { size: 100, paddingStart: 0, paddingEnd: 0 } })
    const ThumbFixture = defineComponent({
      setup() {
        onViewportChange = injectScrollAreaRootContext().onViewportChange
        provideScrollAreaScrollbarVisibleContext({
          sizes,
          hasThumb: ref(true),
          handleWheelScroll: vi.fn(),
          handleThumbDown: vi.fn(),
          handleThumbUp: vi.fn(),
          handleSizeChange: vi.fn(),
          onThumbPositionChange,
          onDragScroll: vi.fn(),
          onThumbChange: vi.fn(),
        })
        return () => h(ScrollAreaThumb)
      },
    })
    wrapper = mount(ScrollAreaRoot, {
      attachTo: document.body,
      slots: { default: () => [h(ScrollAreaViewport, { key: viewportKey.value }), h(ThumbFixture)] },
    })
    viewport = wrapper.get('[data-reka-scroll-area-viewport]').element as HTMLElement
    sizes.value = { ...sizes.value, content: 2000 }
    await wrapper.vm.$nextTick()
    onThumbPositionChange.mockClear()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  function scroll() {
    viewport.dispatchEvent(new Event('scroll'))
  }

  function frame(elapsed = 0) {
    vi.advanceTimersByTime(elapsed)
    for (const [id, callback] of [...frames]) {
      frames.delete(id)
      callback(performance.now())
    }
  }

  it('stops requesting frames after 100ms without scrolling', () => {
    expect(frames.size).toBe(0)
    scroll()
    expect(frames.size).toBe(1)
    expect(onThumbPositionChange).toHaveBeenCalledTimes(1)
    frame()
    expect(frames.size).toBe(1)
    frame(99)
    expect(frames.size).toBe(1)
    frame(1)
    expect(frames.size).toBe(0)
  })

  it('stops after idle even when scroll events arrive without position changes', () => {
    scroll()
    frame(80)
    scroll()
    frame(20)
    expect(frames.size).toBe(0)
  })

  it('processes a position change before checking the idle deadline on a delayed frame', () => {
    scroll()
    viewport.scrollTop = 50
    frame(200)
    expect(onThumbPositionChange).toHaveBeenCalledTimes(2)
    expect(frames.size).toBe(1)
    frame(100)
    expect(frames.size).toBe(0)
  })

  it('extends the idle deadline on position changes without starting duplicate loops', () => {
    scroll()
    viewport.scrollTop = 20
    frame(80)
    scroll()
    expect(frames.size).toBe(1)
    frame(80)
    expect(frames.size).toBe(1)
    frame(20)
    expect(frames.size).toBe(0)
  })

  it.each(['scrollTop', 'scrollLeft'] as const)('restarts and tracks %s after an idle period', (offset) => {
    scroll()
    frame(100)
    expect(frames.size).toBe(0)
    onThumbPositionChange.mockClear()
    scroll()
    expect(frames.size).toBe(1)
    expect(onThumbPositionChange).toHaveBeenCalledTimes(1)
    viewport[offset] = 50
    frame()
    expect(onThumbPositionChange).toHaveBeenCalledTimes(2)
    frame(100)
    expect(frames.size).toBe(0)
  })

  it.each(['scrollTop', 'scrollLeft'] as const)('keeps tracking %s changes without further scroll events', (offset) => {
    scroll()
    for (let i = 1; i <= 5; i++) {
      viewport[offset] = i * 20
      frame(80)
      expect(frames.size).toBe(1)
    }
    expect(onThumbPositionChange).toHaveBeenCalledTimes(6)
    frame(100)
    expect(frames.size).toBe(0)
  })

  it('rebinds to a replacement viewport and cancels the old loop', async () => {
    scroll()
    const oldViewport = viewport
    viewportKey.value++
    await wrapper.vm.$nextTick()
    viewport = wrapper.get('[data-reka-scroll-area-viewport]').element as HTMLElement
    expect(viewport).not.toBe(oldViewport)
    expect(frames.size).toBe(0)
    onThumbPositionChange.mockClear()
    oldViewport.dispatchEvent(new Event('scroll'))
    expect(frames.size).toBe(0)
    expect(onThumbPositionChange).not.toHaveBeenCalled()
    scroll()
    expect(frames.size).toBe(1)
    expect(onThumbPositionChange).toHaveBeenCalledTimes(1)
    viewport.scrollTop = 50
    frame()
    expect(onThumbPositionChange).toHaveBeenCalledTimes(2)
  })

  it('detaches from the old viewport when the context viewport is cleared', async () => {
    scroll()
    onViewportChange(null)
    await wrapper.vm.$nextTick()
    expect(frames.size).toBe(0)
    expect(() => scroll()).not.toThrow()
    expect(frames.size).toBe(0)
  })

  it('cleans up a running loop and scroll listener on unmount', () => {
    scroll()
    wrapper.unmount()
    expect(frames.size).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    scroll()
    expect(frames.size).toBe(0)
    vi.advanceTimersByTime(200)
    expect(frames.size).toBe(0)
  })
})
