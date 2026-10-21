import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaViewport, ScrollAreaVirtualizer } from '.'

const options = Array.from({ length: 1000 }, (_, index) => `Item ${index}`)

describe('horizontal ScrollArea virtualization in a real browser', () => {
  it.each(['ltr', 'rtl'] as const)('keeps visible height and scrolls in %s', async (dir) => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(ScrollAreaRoot, { dir, style: 'width: 300px; height: 120px;' }, () => [
        h(ScrollAreaViewport, { style: 'width: 100%; height: 100%;' }, () => h(ScrollAreaVirtualizer, {
          horizontal: true,
          options,
          estimateSize: 100,
        }, {
          default: ({ option }: { option: string }) => h('div', { 'style': 'height: 60px;', 'data-testid': 'item' }, option),
        })),
        h(ScrollAreaScrollbar, { orientation: 'horizontal' }),
      ]),
    }), { attachTo: document.body })
    const viewport = wrapper.get('[data-reka-scroll-area-viewport]').element as HTMLElement
    const container = wrapper.get('[data-reka-virtualizer]').element as HTMLElement
    await expect.poll(() => wrapper.findAll('[data-testid=item]').length).toBeGreaterThan(0)
    expect(container.getBoundingClientRect().height).toBe(60)
    expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth)
    expect(wrapper.findAll('[data-testid=item]').length).toBeLessThan(1000)
    viewport.scrollTo({ left: dir === 'rtl' ? -5000 : 5000 })
    await expect.poll(() => wrapper.text()).toContain('Item 50')
    expect(container.getBoundingClientRect().height).toBe(60)
    wrapper.unmount()
  })
})
