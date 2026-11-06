import { renderToString } from '@vue/server-renderer'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createSSRApp, h, nextTick } from 'vue'
import { isMacWebKit } from '@/test/browser'
import { CarouselContent, CarouselItem, CarouselNext, CarouselRoot, CarouselViewport } from '.'

const SIZE = 200

function app(props: Record<string, unknown> = {}, onUpdate?: (value: number, reason: string) => void) {
  return createSSRApp({
    render: () => h(CarouselRoot, {
      'aria-label': 'Server',
      'style': { width: `${SIZE}px`, margin: '20px' },
      ...props,
      'onUpdate:modelValue': (value: number, details: { reason: string }) => onUpdate?.(value, details.reason),
    }, () => [
      h(CarouselViewport, { 'data-testid': 'viewport' }, () => h(CarouselContent, () =>
        [0, 1, 2, 3, 4].map(i => h(CarouselItem, { key: i, style: { width: `${SIZE}px`, height: '100px' } }, () => `Slide ${i + 1}`)))),
      h(CarouselNext, () => 'Next'),
    ]),
  })
}

/** The server HTML in the page, not hydrated: what a visitor gets before the JavaScript runs. */
async function renderServerHtml(props: Record<string, unknown> = {}) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  container.innerHTML = await renderToString(app(props))
  document.body.append(container)
  const viewport = container.querySelector<HTMLElement>('[data-testid="viewport"]')!
  return { container, viewport }
}

const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))

afterEach(() => {
  document.body.innerHTML = ''
})

describe('given the server HTML of a Carousel before hydration', () => {
  it('is a native scroller that snaps to the slides', async () => {
    const { viewport } = await renderServerHtml()
    expect(viewport.scrollWidth).toBe(SIZE * 5)
    expect(viewport.clientWidth).toBe(SIZE)
    viewport.scrollTo({ left: 260, behavior: 'instant' })
    await expect.poll(() => viewport.scrollLeft).toBeCloseTo(SIZE, 0)
  })

  // macOS WebKit keeps Safari's keyboard defaults and doesn't scroll a focused scroller with the arrows; CI's Linux WebKit does.
  it.skipIf(isMacWebKit)('scrolls with the keyboard', async () => {
    const { viewport } = await renderServerHtml()
    viewport.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(() => viewport.scrollLeft).toBeCloseTo(SIZE, 0)
  })

  it.runIf(CSS.supports('scroll-initial-target', 'nearest'))('opens on defaultValue where scroll-initial-target is supported', async () => {
    const { viewport } = await renderServerHtml({ defaultValue: 2 })
    await expect.poll(() => viewport.scrollLeft).toBeCloseTo(SIZE * 2, 0)
  })
})

describe('given a Carousel hydrating its server HTML', () => {
  it('scrolls to defaultValue on hydration', async () => {
    const { container, viewport } = await renderServerHtml({ defaultValue: 3 })
    viewport.scrollTo({ left: 0, behavior: 'instant' })
    await frame()
    app({ defaultValue: 3 }).mount(container)
    await expect.poll(() => viewport.scrollLeft).toBeCloseTo(SIZE * 3, 0)
  })

  it('keeps the place a visitor scrolled to before hydration', async () => {
    const updates: [number, string][] = []
    const { container, viewport } = await renderServerHtml()
    viewport.scrollTo({ left: SIZE * 2, behavior: 'instant' })
    await expect.poll(() => viewport.scrollLeft).toBeCloseTo(SIZE * 2, 0)
    app({}, (value, reason) => updates.push([value, reason])).mount(container)
    await nextTick()
    await frame()
    expect(viewport.scrollLeft).toBeCloseTo(SIZE * 2, 0)
    await expect.poll(() => container.querySelector('[data-index="2"]')?.hasAttribute('data-active')).toBe(true)
    expect(updates).toEqual([[2, 'scroll']])
  })

  it('navigates once hydrated', async () => {
    const { container, viewport } = await renderServerHtml()
    app().mount(container)
    await expect.poll(() => viewport.style.scrollSnapType).toBe('x mandatory')
    await expect.poll(() => container.querySelector('[data-index="1"]')?.hasAttribute('inert')).toBe(true)
    await userEvent.click(container.querySelector<HTMLElement>('[aria-label="Next slide"]')!)
    await expect.poll(() => viewport.scrollLeft).toBeCloseTo(SIZE, 0)
  })
})
