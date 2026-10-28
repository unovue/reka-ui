import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from '.'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('scroll area thumb in a real browser', () => {
  it.each(['vertical', 'horizontal'] as const)('tracks %s wheel scrolling before and after an idle period', async (orientation) => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(ScrollAreaRoot, { type: 'always', style: 'width: 200px; height: 200px;' }, () => [
        h(ScrollAreaViewport, { style: 'width: 100%; height: 100%;' }, () => h('div', { style: 'width: 2000px; height: 2000px;' })),
        h(ScrollAreaScrollbar, { orientation, style: orientation === 'vertical' ? 'width: 10px; height: 200px;' : 'width: 200px; height: 10px;' }, () => h(ScrollAreaThumb, { 'data-testid': 'thumb' })),
      ]),
    }), { attachTo: document.body })
    const viewport = wrapper.get('[data-reka-scroll-area-viewport]').element as HTMLElement
    const thumb = wrapper.get('[data-testid=thumb]').element as HTMLElement
    const offset = orientation === 'vertical' ? 'scrollTop' : 'scrollLeft'
    try {
      await expect.poll(() => thumb.style.transform).not.toBe('')
      const axis = orientation === 'vertical' ? 'm42' : 'm41'
      const thumbOffset = () => new DOMMatrixReadOnly(thumb.style.transform)[axis]
      const expectedOffset = () => viewport[offset] / 10
      const delta = orientation === 'vertical' ? { y: 100 } : { x: 100 }
      await userEvent.wheel(viewport, { delta, times: 3 })
      await expect.poll(() => viewport[offset]).toBeGreaterThan(0)
      await expect.poll(() => Math.abs(thumbOffset() - expectedOffset())).toBeLessThan(0.1)
      await wait(200)

      const firstPosition = viewport[offset]
      await userEvent.wheel(viewport, { delta, times: 3 })
      await expect.poll(() => viewport[offset]).toBeGreaterThan(firstPosition)
      await expect.poll(() => Math.abs(thumbOffset() - expectedOffset())).toBeLessThan(0.1)
    }
    finally {
      wrapper.unmount()
    }
  })
})
