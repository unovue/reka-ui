import type { Virtualizer } from '@tanstack/vue-virtual'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport, ScrollAreaVirtualizer } from '.'

const options = Array.from({ length: 1000 }, (_, index) => `Item ${index}`)

async function settle() {
  await nextTick()
  await new Promise(resolve => requestAnimationFrame(resolve))
  await nextTick()
}

const viewport = () => document.querySelector<HTMLElement>('[data-reka-scroll-area-viewport]')!
const renderedIndexes = () => Array.from(document.querySelectorAll<HTMLElement>('[data-reka-virtualizer] > [data-index]'), row => Number(row.dataset.index))

// The first row that intersects the viewport, read from the layout.
function firstVisibleIndex(horizontal = false) {
  const bounds = viewport().getBoundingClientRect()
  const row = Array.from(document.querySelectorAll<HTMLElement>('[data-reka-virtualizer] > [data-index]')).find((element) => {
    const rect = element.getBoundingClientRect()
    return horizontal ? rect.right > bounds.left + 1 : rect.bottom > bounds.top + 1
  })
  return Number(row?.dataset.index)
}

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

describe('vertical ScrollArea virtualization in a real browser', () => {
  const ROW = 32
  const items = Array.from({ length: 10_000 }, (_, index) => `Item ${index}`)

  function mountList() {
    const wrapper = mount(defineComponent({
      setup: () => () => h(ScrollAreaRoot, { type: 'always', style: 'width: 300px; height: 320px;' }, () => [
        h(ScrollAreaViewport, { style: 'width: 100%; height: 100%;' }, () => h(ScrollAreaVirtualizer, {
          options: items,
          estimateSize: ROW,
        }, {
          default: ({ option }: { option: string }) => h('div', { style: `height: ${ROW}px;` }, option),
        })),
        h(ScrollAreaScrollbar, { 'orientation': 'vertical', 'data-testid': 'scrollbar', 'style': 'width: 10px; height: 320px;' }, () => h(ScrollAreaThumb, { 'data-testid': 'thumb' })),
      ]),
    }), { attachTo: document.body })
    const virtualizer = wrapper.findComponent(ScrollAreaVirtualizer).vm.virtualizer as Virtualizer<HTMLElement, Element>
    return { wrapper, virtualizer }
  }

  it('mounts only the visible rows and the overscan', async () => {
    mountList()
    // 10 visible rows (320px / 32px) and 12 rows of overscan after them
    await expect.poll(() => renderedIndexes()).toEqual(Array.from({ length: 22 }, (_, index) => index))
    expect(viewport().scrollHeight).toBe(items.length * ROW)
  })

  it('renders the rows under the scroll position after a wheel scroll', async () => {
    mountList()
    await expect.poll(() => renderedIndexes().length).toBeGreaterThan(0)

    await userEvent.wheel(viewport(), { delta: { y: 400 }, times: 10 })
    await expect.poll(() => viewport().scrollTop).toBe(4000)
    await settle()

    // 4000px / 32px = row 125 at the top, with 12 rows of overscan on each side
    expect(firstVisibleIndex()).toBe(125)
    await expect.poll(() => renderedIndexes()).toEqual(Array.from({ length: 34 }, (_, index) => 113 + index))
    expect(document.querySelector<HTMLElement>('[data-index="125"]')!.getBoundingClientRect().top).toBe(viewport().getBoundingClientRect().top)
  })

  it('moves the thumb with the scroll position', async () => {
    mountList()
    const thumb = document.querySelector<HTMLElement>('[data-testid=thumb]')!
    const scrollbar = document.querySelector<HTMLElement>('[data-testid=scrollbar]')!
    const thumbOffset = () => thumb.getBoundingClientRect().top - scrollbar.getBoundingClientRect().top
    // The share of the scrollable distance, for the viewport and for the thumb.
    const scrolled = () => viewport().scrollTop / (viewport().scrollHeight - viewport().clientHeight)
    const thumbTravel = () => scrollbar.clientHeight - thumb.offsetHeight

    await expect.poll(() => thumb.offsetHeight).toBeGreaterThan(0)
    expect(thumbOffset()).toBeLessThan(1)

    viewport().scrollTo({ top: (viewport().scrollHeight - viewport().clientHeight) / 2 })
    await expect.poll(() => Math.abs(thumbOffset() - scrolled() * thumbTravel())).toBeLessThan(1)
    expect(Math.abs(thumbOffset() - thumbTravel() / 2)).toBeLessThan(1)

    viewport().scrollTo({ top: viewport().scrollHeight })
    await expect.poll(() => Math.abs(thumbOffset() - thumbTravel())).toBeLessThan(1)
  })

  it('scrolls to an index through the exposed virtualizer', async () => {
    const { virtualizer } = mountList()
    await expect.poll(() => renderedIndexes().length).toBeGreaterThan(0)

    virtualizer.scrollToIndex(5000, { align: 'start' })
    await expect.poll(() => viewport().scrollTop).toBe(5000 * ROW)
    await expect.poll(() => firstVisibleIndex()).toBe(5000)

    virtualizer.scrollToIndex(items.length - 1)
    await expect.poll(() => viewport().scrollTop).toBe(viewport().scrollHeight - viewport().clientHeight)
    await expect.poll(() => renderedIndexes().at(-1)).toBe(items.length - 1)
  })
})

describe('given an inline estimateSize callback with measured rows, in a real browser', () => {
  it('keeps the scroll position and the first visible row when the parent renders again', async () => {
    const renders = ref(0)
    // Rows are 30px to 90px tall, far from the estimate, so a reset of the measured sizes moves them.
    const heightOf = (index: number) => 30 + (index % 4) * 20
    mount(defineComponent({
      setup: () => () => h(ScrollAreaRoot, { style: 'width: 300px; height: 320px;' }, () => [
        h('output', { 'data-testid': 'renders' }, renders.value),
        h(ScrollAreaViewport, { style: 'width: 100%; height: 100%;' }, () => h(ScrollAreaVirtualizer, {
          options,
          // a new function on each render of the parent
          estimateSize: () => 20,
        }, {
          default: ({ option, virtualizer, virtualItem }: { option: string, virtualizer: Virtualizer<HTMLElement, Element>, virtualItem: { index: number } }) =>
            h('div', { ref: element => virtualizer.measureElement(element as Element | null), style: `height: ${heightOf(virtualItem.index)}px;` }, option),
        })),
        h(ScrollAreaScrollbar, { orientation: 'vertical' }),
      ]),
    }), { attachTo: document.body })
    await expect.poll(() => renderedIndexes().length).toBeGreaterThan(0)

    // Scroll in steps so that every row above the position is measured.
    for (let step = 0; step < 25; step++) {
      viewport().scrollBy({ top: 200 })
      await settle()
    }
    await settle()
    const scrollTop = viewport().scrollTop
    const first = firstVisibleIndex()
    expect(scrollTop).toBe(5000)
    expect(first).toBeGreaterThan(50)
    const firstRowTop = () => document.querySelector<HTMLElement>(`[data-index="${first}"]`)?.getBoundingClientRect().top
    const top = firstRowTop()

    renders.value++
    await expect.poll(() => document.querySelector('[data-testid=renders]')!.textContent).toBe('1')
    await settle()
    await settle()

    expect(viewport().scrollTop).toBe(scrollTop)
    expect(firstVisibleIndex()).toBe(first)
    expect(firstRowTop()).toBe(top)
  })
})

describe.each(['vertical', 'horizontal'] as const)('given a focused control in a %s virtualized ScrollArea, in a real browser', (orientation) => {
  const horizontal = orientation === 'horizontal'
  const SIZE = 40
  const scrollOffset = () => horizontal ? viewport().scrollLeft : viewport().scrollTop
  const scrollTo = (offset: number) => viewport().scrollTo(horizontal ? { left: offset } : { top: offset })
  const control = (index: number) => document.querySelector<HTMLElement>(`[data-index="${index}"] button`)
  const focusedText = () => document.activeElement?.textContent

  function mountList() {
    mount(defineComponent({
      setup: () => () => h('div', [
        h('button', { 'data-testid': 'before' }, 'Before'),
        h(ScrollAreaRoot, { style: 'width: 300px; height: 200px;' }, () => [
          h(ScrollAreaViewport, { style: 'width: 100%; height: 100%;' }, () => h(ScrollAreaVirtualizer, {
            options,
            horizontal,
            estimateSize: SIZE,
            overscan: 2,
          }, {
            default: ({ option }: { option: string }) => h('div', { style: horizontal ? `width: ${SIZE}px; height: 60px;` : `height: ${SIZE}px;` }, h('button', option)),
          })),
          h(ScrollAreaScrollbar, { orientation }),
        ]),
      ]),
    }), { attachTo: document.body })
  }

  // 300px / 40px or 200px / 40px rows in view, and 2 rows of overscan on each side
  const inView = horizontal ? 8 : 5
  const windowAt = (first: number) => Array.from({ length: inView + 4 }, (_, index) => first - 2 + index)

  async function focusRowAndScrollAway() {
    mountList()
    await expect.poll(() => control(5)).not.toBeNull()
    const focused = control(5)!
    await userEvent.click(focused)
    expect(document.activeElement).toBe(focused)

    scrollTo(500 * SIZE)
    await expect.poll(() => renderedIndexes().includes(500)).toBe(true)
    await settle()
    return focused
  }

  it('keeps the row of the focused control mounted, at its position, after it scrolls far out of view', async () => {
    const total = () => viewport()[horizontal ? 'scrollWidth' : 'scrollHeight']
    const focused = await focusRowAndScrollAway()

    expect(focused.isConnected).toBe(true)
    expect(document.activeElement).toBe(focused)
    // The focused row and the rows next to it, then the rows of the window.
    expect(renderedIndexes()).toEqual([4, 5, 6, ...windowAt(500)])
    expect(total()).toBe(options.length * SIZE)

    // The kept row is where row 5 belongs: 495 rows before the first row in view.
    const row = focused.parentElement!.getBoundingClientRect()
    const firstInView = document.querySelector<HTMLElement>('[data-index="500"]')!.getBoundingClientRect()
    expect(horizontal ? firstInView.left - row.left : firstInView.top - row.top).toBe(495 * SIZE)
  })

  it('moves the focus to the next row and scrolls it into view on Tab', async () => {
    await focusRowAndScrollAway()

    await userEvent.tab()
    expect(focusedText()).toBe('Item 6')
    await expect.poll(() => scrollOffset()).toBeLessThan(10 * SIZE)
    await settle()

    const bounds = viewport().getBoundingClientRect()
    const rect = document.activeElement!.getBoundingClientRect()
    expect(horizontal ? rect.left >= bounds.left && rect.right <= bounds.right : rect.top >= bounds.top && rect.bottom <= bounds.bottom).toBe(true)
    // The rows of the window that was left are released.
    expect(renderedIndexes().includes(500)).toBe(false)
  })

  it('moves the focus to the previous row and scrolls it into view on Shift+Tab', async () => {
    await focusRowAndScrollAway()

    await userEvent.tab({ shift: true })
    expect(focusedText()).toBe('Item 4')
    await expect.poll(() => scrollOffset()).toBeLessThan(10 * SIZE)
    await settle()

    const bounds = viewport().getBoundingClientRect()
    const rect = document.activeElement!.getBoundingClientRect()
    expect(horizontal ? rect.left >= bounds.left && rect.right <= bounds.right : rect.top >= bounds.top && rect.bottom <= bounds.bottom).toBe(true)
  })

  it('releases the kept rows once the focus leaves the list', async () => {
    const focused = await focusRowAndScrollAway()
    expect(renderedIndexes()).toEqual([4, 5, 6, ...windowAt(500)])

    document.querySelector<HTMLElement>('[data-testid=before]')!.focus()
    await expect.poll(() => renderedIndexes()).toEqual(windowAt(500))
    expect(focused.isConnected).toBe(false)
  })

  it('keeps the row while the element is still the active element, as when the window loses the focus', async () => {
    const focused = await focusRowAndScrollAway()

    // A window that loses the focus sends `focusout` without a related target, and the active element stays.
    focused.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    scrollTo(600 * SIZE)
    await expect.poll(() => renderedIndexes().includes(600)).toBe(true)
    await settle()

    expect(renderedIndexes()).toEqual([4, 5, 6, ...windowAt(600)])
    expect(document.activeElement).toBe(focused)
  })

  it('keeps the row for the control that takes the focus next', async () => {
    await focusRowAndScrollAway()

    const next = control(503)!
    await userEvent.click(next)
    await expect.poll(() => renderedIndexes()).toEqual(windowAt(500))

    scrollTo(0)
    await expect.poll(() => renderedIndexes().includes(0)).toBe(true)
    await settle()
    expect(renderedIndexes()).toEqual([0, 1, 2, 3, 4, 5, 6, ...(horizontal ? [7, 8, 9] : []), 502, 503, 504])
    expect(document.activeElement).toBe(next)
  })
})
