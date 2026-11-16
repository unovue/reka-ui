import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { CarouselAutoplayToggle, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselRoot, CarouselViewport } from '.'

const SIZE = 200
const COUNT = 5

function mountCarousel(props: Record<string, unknown> = {}) {
  document.body.innerHTML = ''
  const vertical = props.orientation === 'vertical'
  const model = ref((props.defaultValue as number | undefined) ?? 0)
  const playing = ref<boolean>()
  const wrapper = mount(defineComponent({
    setup: () => () => [h('div', { 'data-testid': 'outside', 'style': { height: '20px' } }), h(CarouselRoot, {
      'aria-label': 'Interaction',
      ...props,
      'data-testid': 'root',
      'style': { width: `${SIZE}px`, margin: '20px' },
      'onUpdate:modelValue': (value: number) => model.value = value,
      'onUpdate:playing': (value: boolean) => playing.value = value,
    }, () => [
      h(CarouselAutoplayToggle, { 'data-testid': 'toggle' }, () => 'Toggle'),
      h(CarouselViewport, { 'data-testid': 'viewport', 'style': vertical ? { height: `${SIZE}px` } : undefined }, () =>
        h(CarouselContent, () => Array.from({ length: COUNT }, (_, i) => h(CarouselItem, {
          'key': i,
          'data-testid': `item-${i}`,
          'style': vertical ? { height: `${SIZE}px` } : { width: `${SIZE}px`, height: '100px' },
        }, () => `Slide ${i + 1}`)))),
      h(CarouselPrevious, { 'data-testid': 'prev' }, () => 'Prev'),
      h(CarouselNext, { 'data-testid': 'next' }, () => 'Next'),
    ])],
  }), { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
  const viewport = get('viewport')
  const scroll = () => vertical ? viewport.scrollTop : Math.abs(viewport.scrollLeft)
  return { wrapper, get, viewport, model, playing, scroll }
}

/** Parks the real mouse outside the carousel: the previous test may have left it over this one, which pauses rotation. */
async function mouseAway() {
  await userEvent.hover(document.querySelector<HTMLElement>('[data-testid="outside"]')!)
}

/** Waits until the scroll position holds for 300ms. */
async function settled(scroll: () => number) {
  const readings: number[] = []
  await expect.poll(() => {
    readings.push(scroll())
    const last = readings.slice(-4)
    return last.length === 4 && last.every(value => Math.abs(value - last[0]) < 0.5)
  }, { interval: 100, timeout: 6000 }).toBe(true)
}

async function measured(viewport: HTMLElement, index = 0) {
  await expect.poll(() => viewport.querySelector(`[data-index="${index}"]`)?.hasAttribute('data-in-view')).toBe(true)
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** A synthetic pointer gesture: untrusted, but the carousel only reads the pointer type and coordinates. */
function pointerGesture(target: HTMLElement, pointerType: 'pen' | 'touch', path: [number, number][]) {
  const base = { bubbles: true, cancelable: true, composed: true, isPrimary: true, pointerId: 9, pointerType }
  const [first, ...rest] = path
  target.dispatchEvent(new PointerEvent('pointerdown', { ...base, button: 0, buttons: 1, clientX: first[0], clientY: first[1] }))
  for (const [x, y] of rest)
    document.dispatchEvent(new PointerEvent('pointermove', { ...base, buttons: 1, clientX: x, clientY: y }))
  const [x, y] = path.at(-1)!
  document.dispatchEvent(new PointerEvent('pointerup', { ...base, button: 0, buttons: 0, clientX: x, clientY: y }))
}

afterEach(async () => {
  document.body.innerHTML = ''
  await commands.setReducedMotion('no-preference')
})

describe('given a Carousel dragged in a real browser', () => {
  it('moves one snap per pen drag', async () => {
    const { viewport, model, scroll } = mountCarousel()
    await measured(viewport)
    const box = viewport.getBoundingClientRect()
    const y = box.top + 40
    pointerGesture(viewport, 'pen', [[box.right - 20, y], [box.right - 60, y], [box.left + 40, y]])
    await settled(scroll)
    expect(model.value).toBe(1)
    expect(scroll()).toBeCloseTo(SIZE, 0)
  })

  it('swipes to the next slide by touch in fade mode', async () => {
    const { viewport, model, get } = mountCarousel({ fade: true })
    await measured(viewport).catch(() => {})
    const box = viewport.getBoundingClientRect()
    const y = box.top + 40
    pointerGesture(viewport, 'touch', [[box.right - 20, y], [box.right - 60, y], [box.left + 20, y]])
    await expect.poll(() => model.value).toBe(1)
    expect(get('item-1').style.opacity).toBe('1')
    pointerGesture(viewport, 'touch', [[box.left + 20, y], [box.left + 60, y], [box.right - 20, y]])
    await expect.poll(() => model.value).toBe(0)
  })

  it('keeps moving after a fast release with dragFree, and rests between snaps', async () => {
    const { viewport, model, scroll } = mountCarousel({ dragFree: true })
    await measured(viewport)
    const box = viewport.getBoundingClientRect()
    const y = box.top + 40
    await commands.mouseDrag(box.right - 10, y, box.left + 10, y, 3)
    const released = scroll()
    await settled(scroll)
    expect(scroll()).toBeGreaterThan(released + 10)
    expect(viewport.style.scrollSnapType).toBe('none')
    expect(model.value).toBe(Math.round(scroll() / SIZE))
  })

  it('skips past several snaps on a fast drag with skipSnaps', async () => {
    const { viewport, model, scroll } = mountCarousel({ skipSnaps: true })
    await measured(viewport)
    const box = viewport.getBoundingClientRect()
    const y = box.top + 40
    await commands.mouseDrag(box.right - 5, y, box.left + 5, y, 2)
    await settled(scroll)
    expect(model.value).toBeGreaterThanOrEqual(2)
    expect(scroll()).toBeCloseTo(model.value * SIZE, 0)
  })
})

describe('given a Carousel paged with the wheel in a real browser', () => {
  it('pages with the wheel and hands it back to the page at an end', async () => {
    const prevented: boolean[] = []
    const { viewport, model, scroll } = mountCarousel({ wheel: true, defaultValue: COUNT - 1 })
    await measured(viewport, COUNT - 1)
    await settled(scroll)
    document.addEventListener('wheel', event => prevented.push(event.defaultPrevented))
    const box = viewport.getBoundingClientRect()
    await commands.wheelAt(box.left + 50, box.top + 50, 100)
    await sleep(400)
    expect(model.value).toBe(COUNT - 1)
    expect(prevented.length).toBeGreaterThan(0)
    expect(prevented.every(value => !value)).toBe(true)
    prevented.length = 0
    await commands.wheelAt(box.left + 50, box.top + 50, -100)
    await expect.poll(() => model.value).toBe(COUNT - 2)
    expect(prevented.some(Boolean)).toBe(true)
  })
})

describe('given a Carousel driven by the keyboard in a real browser', () => {
  it('maps the arrows to the reading direction in RTL', async () => {
    const { viewport, model } = mountCarousel({ dir: 'rtl' })
    await measured(viewport)
    viewport.focus()
    await userEvent.keyboard('{ArrowLeft}')
    await expect.poll(() => model.value).toBe(1)
    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(() => model.value).toBe(0)
    await userEvent.keyboard('{End}')
    await expect.poll(() => model.value).toBe(COUNT - 1)
    await expect.poll(() => viewport.scrollLeft).toBeCloseTo(-SIZE * (COUNT - 1), 0)
    await userEvent.keyboard('{Home}')
    await expect.poll(() => model.value).toBe(0)
  })

  it('uses the vertical arrows when vertical', async () => {
    const { viewport, model } = mountCarousel({ orientation: 'vertical' })
    await measured(viewport)
    viewport.focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(() => model.value).toBe(1)
    await userEvent.keyboard('{ArrowRight}')
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(() => model.value).toBe(0)
    await userEvent.keyboard('{End}')
    await expect.poll(() => viewport.scrollTop).toBeCloseTo(SIZE * (COUNT - 1), 0)
    expect(model.value).toBe(COUNT - 1)
  })
})

describe('given a rotating Carousel in a real browser', () => {
  it('advances on the delay', async () => {
    const { model } = mountCarousel({ autoplay: { delay: 300 } })
    await mouseAway()
    await expect.poll(() => model.value, { timeout: 2000 }).toBe(1)
    await expect.poll(() => model.value, { timeout: 2000 }).toBe(2)
  })

  it('pauses while the mouse hovers it', async () => {
    const { model, get, playing } = mountCarousel({ autoplay: { delay: 300 } })
    await userEvent.hover(get('item-0'))
    await sleep(900)
    expect(model.value).toBe(0)
    await userEvent.unhover(get('item-0'))
    await expect.poll(() => model.value, { timeout: 2000 }).toBe(1)
    expect(playing.value).toBeUndefined()
  })

  it('stops when keyboard focus enters it', async () => {
    const { model, playing, get } = mountCarousel({ autoplay: { delay: 400 } })
    await userEvent.keyboard('{Tab}')
    await expect.poll(() => playing.value).toBe(false)
    expect(get('root').contains(document.activeElement)).toBe(true)
    await sleep(900)
    expect(model.value).toBe(0)
  })

  it('stops on interaction', async () => {
    const { model, playing, get } = mountCarousel({ autoplay: { delay: 400 } })
    await userEvent.click(get('next'))
    await expect.poll(() => playing.value).toBe(false)
    await sleep(900)
    expect(model.value).toBe(1)
  })

  it('stops on the last snap with stopOnLastSnap', async () => {
    const { model, playing } = mountCarousel({ autoplay: { delay: 300, stopOnLastSnap: true }, defaultValue: COUNT - 2 })
    await mouseAway()
    await expect.poll(() => model.value, { timeout: 2000 }).toBe(COUNT - 1)
    await expect.poll(() => playing.value, { timeout: 2000 }).toBe(false)
    expect(model.value).toBe(COUNT - 1)
  })

  it('does not rotate when the user prefers reduced motion', async () => {
    await commands.setReducedMotion('reduce')
    const { model, playing } = mountCarousel({ autoplay: { delay: 300 } })
    await mouseAway()
    await expect.poll(() => playing.value).toBe(false)
    await sleep(900)
    expect(model.value).toBe(0)
  })
})

describe('given an auto-scrolling Carousel in a real browser', () => {
  it('scrolls continuously and pauses on hover', async () => {
    const { viewport, scroll, get } = mountCarousel({ autoScroll: { speed: 200 } })
    await mouseAway()
    await measured(viewport)
    const start = scroll()
    await expect.poll(() => scroll(), { timeout: 2000 }).toBeGreaterThan(start + 40)
    // The root, not a moving slide: Playwright waits for a hover target to stand still.
    await userEvent.hover(get('toggle'))
    await sleep(150)
    const held = scroll()
    await sleep(400)
    expect(scroll()).toBeCloseTo(held, 0)
    await mouseAway()
    await expect.poll(() => scroll(), { timeout: 2000 }).toBeGreaterThan(held + 20)
  })

  it('stops on interaction', async () => {
    const { viewport, scroll, playing, get } = mountCarousel({ autoScroll: { speed: 100 } })
    await measured(viewport)
    await userEvent.click(get('next'))
    await expect.poll(() => playing.value).toBe(false)
    await settled(scroll)
    expect(viewport.style.scrollSnapType).toBe('x mandatory')
    expect(scroll() % SIZE).toBeCloseTo(0, 0)
  })

  it('stops at the end of a track that does not loop', async () => {
    const { viewport, scroll, playing } = mountCarousel({ autoScroll: { speed: 3000 } })
    await mouseAway()
    await measured(viewport)
    await expect.poll(() => playing.value, { timeout: 3000 }).toBe(false)
    await settled(scroll)
    expect(scroll()).toBeCloseTo(SIZE * (COUNT - 1), 0)
  })
})
