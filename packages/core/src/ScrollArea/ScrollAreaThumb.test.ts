import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import ScrollAreaRoot from './ScrollAreaRoot.vue'
import { provideScrollAreaScrollbarVisibleContext } from './ScrollAreaScrollbarVisible.vue'
import ScrollAreaThumb from './ScrollAreaThumb.vue'
import ScrollAreaViewport from './ScrollAreaViewport.vue'

describe('scroll area thumb frame loop', () => {
  let wrapper: VueWrapper
  let viewport: HTMLElement
  let onThumbPositionChange: ReturnType<typeof vi.fn>
  let frames: Map<number, FrameRequestCallback>
  let frameId: number

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
    const sizes = ref({ content: 1000, viewport: 100, scrollbar: { size: 100, paddingStart: 0, paddingEnd: 0 } })
    const ThumbFixture = defineComponent({
      setup() {
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
      slots: { default: () => [h(ScrollAreaViewport), h(ThumbFixture)] },
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

  function frame() {
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
    vi.advanceTimersByTime(99)
    expect(frames.size).toBe(1)
    vi.advanceTimersByTime(1)
    expect(frames.size).toBe(0)
  })

  it('extends the idle deadline without starting duplicate loops', () => {
    scroll()
    vi.advanceTimersByTime(80)
    scroll()
    expect(frames.size).toBe(1)
    vi.advanceTimersByTime(80)
    expect(frames.size).toBe(1)
    vi.advanceTimersByTime(20)
    expect(frames.size).toBe(0)
  })

  it.each(['scrollTop', 'scrollLeft'] as const)('restarts and tracks %s after an idle period', (offset) => {
    scroll()
    vi.advanceTimersByTime(100)
    expect(frames.size).toBe(0)
    onThumbPositionChange.mockClear()
    scroll()
    expect(frames.size).toBe(1)
    expect(onThumbPositionChange).toHaveBeenCalledTimes(1)
    viewport[offset] = 50
    frame()
    expect(onThumbPositionChange).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(100)
    expect(frames.size).toBe(0)
  })

  it('cleans up a running loop and pending idle timeout on unmount', () => {
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
