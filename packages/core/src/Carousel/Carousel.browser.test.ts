import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselRoot, CarouselViewport } from '.'

const SIZE = 200

interface FixtureOptions {
  count?: number
  itemSize?: number
  props?: Record<string, unknown>
}

function mountCarousel({ count = 5, itemSize = SIZE, props = {} }: FixtureOptions = {}) {
  document.body.innerHTML = ''
  const model = ref<number>((props.defaultValue as number | undefined) ?? 0)
  const reasons: string[] = []
  const vertical = props.orientation === 'vertical'
  const Fixture = defineComponent({
    setup() {
      return () => h(CarouselRoot, {
        'aria-label': 'Test',
        ...props,
        'style': { width: `${SIZE}px`, margin: '20px' },
        'onUpdate:modelValue': (value: number, details: { reason: string }) => {
          model.value = value
          reasons.push(details.reason)
        },
      }, () => [
        h(CarouselViewport, { 'data-testid': 'viewport', 'style': vertical ? { height: `${SIZE}px` } : undefined }, () =>
          h(CarouselContent, () => Array.from({ length: count }, (_, i) =>
            h(CarouselItem, {
              'key': i,
              'data-testid': `item-${i}`,
              'style': vertical
                ? { height: `${itemSize}px` }
                : { width: `${itemSize}px`, height: `${100 + i * 20}px` },
            }, () => h('button', { type: 'button' }, `Slide ${i + 1}`))))),
        h(CarouselPrevious, { 'data-testid': 'prev' }, () => 'Prev'),
        h(CarouselNext, { 'data-testid': 'next' }, () => 'Next'),
      ])
    },
  })
  const wrapper = mount(Fixture, { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
  const viewport = get('viewport')
  const scroll = () => vertical ? viewport.scrollTop : Math.abs(viewport.scrollLeft)
  const visibleItem = () => {
    const box = viewport.getBoundingClientRect()
    return Array.from({ length: count }, (_, i) => i).find((i) => {
      const r = get(`item-${i}`).getBoundingClientRect()
      return vertical ? Math.abs(r.top - box.top) < 2 : Math.abs(r.left - box.left) < 2
    })
  }
  return { wrapper, get, viewport, model, reasons, scroll, visibleItem }
}

/** Waits until the scroll position holds for 300ms: WebKit can wait ~200ms before a smooth scroll starts moving. */
async function settled(scroll: () => number) {
  const readings: number[] = []
  await expect.poll(() => {
    readings.push(scroll())
    const last = readings.slice(-4)
    return last.length === 4 && last.every(value => Math.abs(value - last[0]) < 0.5)
  }, { interval: 100, timeout: 4000 }).toBe(true)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('given a Carousel in a real browser', () => {
  it('measures the snaps and scrolls to the next one', async () => {
    const { get, model, scroll, visibleItem } = mountCarousel()
    await expect.poll(() => get('item-1').hasAttribute('inert')).toBe(true)
    await userEvent.click(get('next'))
    await expect.poll(() => visibleItem()).toBe(1)
    await settled(scroll)
    expect(model.value).toBe(1)
    expect(scroll()).toBeCloseTo(SIZE, 0)
    await expect.poll(() => get('item-0').hasAttribute('inert')).toBe(true)
    expect(get('item-1').hasAttribute('data-in-view')).toBe(true)
  })

  it('syncs the index from a native scroll', async () => {
    const { viewport, model, reasons } = mountCarousel()
    await expect.poll(() => viewport.style.scrollSnapType).toBe('x mandatory')
    viewport.scrollTo({ left: SIZE * 2, behavior: 'instant' })
    await expect.poll(() => model.value).toBe(2)
    expect(reasons.at(-1)).toBe('scroll')
  })

  it('moves one snap per mouse drag', async () => {
    const { viewport, model, reasons, scroll } = mountCarousel()
    await expect.poll(() => viewport.style.scrollSnapType).toBe('x mandatory')
    const box = viewport.getBoundingClientRect()
    const y = box.top + 40
    // A long, fast drag: still one snap without `skipSnaps`. It ends inside the
    // test iframe: Firefox delivers no release outside it.
    await commands.mouseDrag(box.right - 10, y, box.left - 15, y, 4)
    await expect.poll(() => scroll()).toBeCloseTo(SIZE, 0)
    await settled(scroll)
    expect(model.value).toBe(1)
    expect(reasons).toContain('drag')
    expect(viewport.style.scrollSnapType).toBe('x mandatory')
  })

  it('ends a drag whose release is never seen', async () => {
    const { viewport, model, scroll } = mountCarousel()
    await expect.poll(() => viewport.style.scrollSnapType).toBe('x mandatory')
    const box = viewport.getBoundingClientRect()
    const base = { bubbles: true, isPrimary: true, pointerId: 7, pointerType: 'mouse', clientY: box.top + 40 }
    viewport.dispatchEvent(new PointerEvent('pointerdown', { ...base, button: 0, buttons: 1, clientX: box.left + 150 }))
    document.dispatchEvent(new PointerEvent('pointermove', { ...base, buttons: 1, clientX: box.left + 60 }))
    await expect.poll(() => viewport.hasAttribute('data-dragging')).toBe(true)
    // The next move has no button down: the release happened out of sight.
    document.dispatchEvent(new PointerEvent('pointermove', { ...base, buttons: 0, clientX: box.left + 60 }))
    await expect.poll(() => viewport.hasAttribute('data-dragging')).toBe(false)
    await settled(scroll)
    expect(scroll() % SIZE).toBeCloseTo(0, 0)
    expect(viewport.style.scrollSnapType).toBe('x mandatory')
    expect(model.value).toBe(Math.round(scroll() / SIZE))
  })

  it('swallows the click that ends a drag, not a plain click', async () => {
    const clicks: string[] = []
    const { viewport, get, scroll } = mountCarousel()
    get('item-0').querySelector('button')!.addEventListener('click', () => clicks.push('click'))
    await expect.poll(() => viewport.style.scrollSnapType).toBe('x mandatory')
    const box = get('item-0').getBoundingClientRect()
    await commands.mouseDrag(box.left + 150, box.top + 20, box.left + 20, box.top + 20, 10)
    await settled(scroll)
    expect(clicks).toEqual([])
    await userEvent.click(get('item-1').querySelector('button')!)
  })

  it('keeps a short, slow drag on the current snap', async () => {
    const { viewport, model, scroll } = mountCarousel()
    await expect.poll(() => viewport.style.scrollSnapType).toBe('x mandatory')
    const box = viewport.getBoundingClientRect()
    await commands.mouseDrag(box.left + 100, box.top + 40, box.left + 80, box.top + 40, 5, 200)
    await settled(scroll)
    expect(model.value).toBe(0)
    expect(scroll()).toBeCloseTo(0, 0)
  })

  it('navigates with the arrow keys on the focused viewport', async () => {
    const { viewport, model } = mountCarousel()
    viewport.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(() => model.value).toBe(1)
    await userEvent.keyboard('{End}')
    await expect.poll(() => model.value).toBe(4)
  })

  it('trims the end snaps when several items are visible', async () => {
    const { get, model } = mountCarousel({ count: 6, itemSize: SIZE / 2 })
    await expect.poll(() => get('item-4').hasAttribute('inert')).toBe(true)
    for (let i = 0; i < 4; i++)
      await userEvent.click(get('next'))
    // 6 items, 2 visible: 5 snaps, the last one shows items 4 and 5.
    await expect.poll(() => model.value).toBe(4)
    expect(get('next').hasAttribute('disabled')).toBe(true)
  })

  it('loops past the last slide by rotating the items', async () => {
    const { get, model, visibleItem, scroll } = mountCarousel({ props: { loop: true } })
    await expect.poll(() => get('item-0').style.order).toBe('2')
    expect(visibleItem()).toBe(0)
    await userEvent.click(get('prev'))
    await expect.poll(() => model.value).toBe(4)
    await settled(scroll)
    await expect.poll(() => visibleItem()).toBe(4)
    await userEvent.click(get('next'))
    await settled(scroll)
    await expect.poll(() => visibleItem()).toBe(0)
    // DOM order, and so tab order, is unchanged.
    expect(Array.from(document.querySelectorAll('[data-index]'), el => el.getAttribute('data-index'))).toEqual(['0', '1', '2', '3', '4'])
  })

  it('falls back to no loop when the slides are too few to wrap', async () => {
    const { get } = mountCarousel({ count: 2, props: { loop: true } })
    await expect.poll(() => get('prev').hasAttribute('disabled')).toBe(true)
  })

  it('scrolls the other way in RTL', async () => {
    const { get, viewport } = mountCarousel({ props: { dir: 'rtl' } })
    await expect.poll(() => get('item-1').hasAttribute('inert')).toBe(true)
    await userEvent.click(get('next'))
    await expect.poll(() => viewport.scrollLeft).toBeCloseTo(-SIZE, 0)
  })

  it('scrolls vertically', async () => {
    const { get, viewport, model } = mountCarousel({ props: { orientation: 'vertical' } })
    await expect.poll(() => viewport.style.scrollSnapType).toBe('y mandatory')
    await userEvent.click(get('next'))
    await expect.poll(() => viewport.scrollTop).toBeCloseTo(SIZE, 0)
    expect(model.value).toBe(1)
  })

  it('pages with a cross-axis mouse wheel when wheel is set', async () => {
    const { viewport, model } = mountCarousel({ props: { wheel: true } })
    await expect.poll(() => viewport.style.scrollSnapType).toBe('x mandatory')
    const box = viewport.getBoundingClientRect()
    await commands.wheelAt(box.left + 50, box.top + 50, 100)
    await expect.poll(() => model.value).toBe(1)
  })

  it('leaves a cross-axis wheel to the page by default', async () => {
    const { viewport, model } = mountCarousel()
    await expect.poll(() => viewport.style.scrollSnapType).toBe('x mandatory')
    const box = viewport.getBoundingClientRect()
    await commands.wheelAt(box.left + 50, box.top + 50, 100)
    await new Promise(resolve => setTimeout(resolve, 300))
    expect(model.value).toBe(0)
  })

  it('follows the current slide height with autoHeight', async () => {
    const { get, viewport } = mountCarousel({ props: { autoHeight: true } })
    await expect.poll(() => viewport.getBoundingClientRect().height).toBeCloseTo(100, 0)
    await userEvent.click(get('next'))
    await expect.poll(() => viewport.getBoundingClientRect().height).toBeCloseTo(120, 0)
  })

  it('cross-fades instead of scrolling with fade', async () => {
    const { get, viewport, model } = mountCarousel({ props: { fade: true } })
    expect(get('item-0').style.opacity).toBe('1')
    await userEvent.click(get('next'))
    await expect.poll(() => get('item-1').style.opacity).toBe('1')
    expect(get('item-0').style.opacity).toBe('0')
    expect(viewport.scrollLeft).toBe(0)
    const box = viewport.getBoundingClientRect()
    await commands.mouseDrag(box.right - 20, box.top + 40, box.left + 20, box.top + 40, 10)
    await expect.poll(() => model.value).toBe(2)
  })

  it('scrolls to the current slide when shown after mounting hidden', async () => {
    const { wrapper, viewport, visibleItem } = mountCarousel({ props: { defaultValue: 2 } })
    const root = wrapper.element as HTMLElement
    root.style.display = 'none'
    await new Promise(resolve => setTimeout(resolve, 100))
    root.style.display = ''
    await expect.poll(() => visibleItem()).toBe(2)
    expect(viewport.scrollLeft).toBeCloseTo(SIZE * 2, 0)
  })

  it('starts on defaultValue', async () => {
    const { visibleItem } = mountCarousel({ props: { defaultValue: 3 } })
    await expect.poll(() => visibleItem()).toBe(3)
  })
})
