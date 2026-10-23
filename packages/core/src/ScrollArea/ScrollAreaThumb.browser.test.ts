import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from '.'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('scroll area thumb idle frames in a real browser', () => {
  it.each(['vertical', 'horizontal'] as const)('stops idle frames and resumes tracking %s scrolling', async (orientation) => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(ScrollAreaRoot, { type: 'always', style: 'width: 200px; height: 200px;' }, () => [
        h(ScrollAreaViewport, { style: 'width: 100%; height: 100%;' }, () => h('div', { style: 'width: 2000px; height: 2000px;' })),
        h(ScrollAreaScrollbar, { orientation, style: 'width: 10px; height: 200px;' }, () => h(ScrollAreaThumb, { 'data-testid': 'thumb' })),
      ]),
    }), { attachTo: document.body })
    const viewport = wrapper.get('[data-reka-scroll-area-viewport]').element as HTMLElement
    const thumb = wrapper.get('[data-testid=thumb]').element as HTMLElement
    const offset = orientation === 'vertical' ? 'scrollTop' : 'scrollLeft'
    await expect.poll(() => thumb.style.transform).not.toBe('')
    await wait(200)
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    try {
      const initialTransform = thumb.style.transform
      viewport[offset] = 300
      await expect.poll(() => thumb.style.transform).not.toBe(initialTransform)
      await wait(250)
      raf.mockClear()
      await wait(150)
      expect(raf).not.toHaveBeenCalled()

      const firstTransform = thumb.style.transform
      viewport[offset] = 600
      await expect.poll(() => thumb.style.transform).not.toBe(firstTransform)
      expect(raf).toHaveBeenCalled()
      await wait(250)
      raf.mockClear()
      await wait(150)
      expect(raf).not.toHaveBeenCalled()
    }
    finally {
      wrapper.unmount()
      raf.mockRestore()
    }
  })
})
