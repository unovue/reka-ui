import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { defineComponent, h, ref, unref } from 'vue'
import { settled } from '@/test/scroll'
import { CarouselAutoplayToggle, CarouselContent, CarouselIndicator, CarouselIndicatorGroup, CarouselItem, CarouselNext, CarouselPrevious, CarouselRoot, CarouselViewport } from '.'

const SIZE = 200
const COUNT = 5

function mountCarousel(props: Record<string, unknown> = {}, slide: (i: number) => any = i => `Slide ${i + 1}`) {
  document.body.innerHTML = ''
  const vertical = props.orientation === 'vertical'
  const model = ref(unref(props.modelValue as number | undefined) ?? (props.defaultValue as number | undefined) ?? 0)
  const playing = ref<boolean>()
  const settled: number[] = []
  // `details.reason` of each `update:modelValue` and `update:playing`.
  const reasons: string[] = []
  const playingReasons: string[] = []
  const wrapper = mount(defineComponent({
    setup: () => () => [h('div', { 'data-testid': 'outside', 'style': { height: '20px' } }), h(CarouselRoot, {
      'aria-label': 'Interaction',
      // Refs render as their value, so a test can control `modelValue`.
      ...Object.fromEntries(Object.entries(props).map(([key, value]) => [key, unref(value)])),
      'data-testid': 'root',
      'style': { width: `${SIZE}px`, margin: '20px' },
      'onUpdate:modelValue': (value: number, details: { reason: string }) => {
        model.value = value
        reasons.push(details.reason)
      },
      'onUpdate:playing': (value: boolean, details: { reason: string }) => {
        playing.value = value
        playingReasons.push(details.reason)
      },
      'onSettle': (value: number) => settled.push(value),
    }, () => [
      h(CarouselAutoplayToggle, { 'data-testid': 'toggle' }, () => 'Toggle'),
      h(CarouselViewport, { 'data-testid': 'viewport', 'style': vertical ? { height: `${SIZE}px` } : undefined }, () =>
        h(CarouselContent, () => Array.from({ length: COUNT }, (_, i) => h(CarouselItem, {
          'key': i,
          'data-testid': `item-${i}`,
          'style': vertical ? { height: `${SIZE}px` } : { width: `${SIZE}px`, height: '100px' },
        }, () => slide(i))))),
      h(CarouselPrevious, { 'data-testid': 'prev' }, () => 'Prev'),
      h(CarouselNext, { 'data-testid': 'next' }, () => 'Next'),
    ])],
  }), { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
  const viewport = get('viewport')
  const scroll = () => vertical ? viewport.scrollTop : Math.abs(viewport.scrollLeft)
  return { wrapper, get, viewport, model, playing, scroll, settled, reasons, playingReasons }
}

/** Parks the real mouse outside the carousel: the previous test may have left it over this one, which pauses rotation. */
async function mouseAway() {
  await userEvent.hover(document.querySelector<HTMLElement>('[data-testid="outside"]')!)
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
    await settled(viewport)
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
    await settled(viewport)
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
    await settled(viewport)
    expect(model.value).toBeGreaterThanOrEqual(2)
    expect(scroll()).toBeCloseTo(model.value * SIZE, 0)
  })
})

describe('given a Carousel that reports why it moved, in a real browser', () => {
  it('reports drag for a pen drag', async () => {
    const { viewport, model, reasons } = mountCarousel()
    await measured(viewport)
    const box = viewport.getBoundingClientRect()
    const y = box.top + 40
    pointerGesture(viewport, 'pen', [[box.right - 20, y], [box.right - 60, y], [box.left + 40, y]])
    await settled(viewport)
    expect(model.value).toBe(1)
    expect(reasons).toEqual(['drag'])
  })

  it('reports drag for the momentum of a dragFree release', async () => {
    const { viewport, model, reasons } = mountCarousel({ dragFree: true })
    await measured(viewport)
    const box = viewport.getBoundingClientRect()
    const y = box.top + 40
    await commands.mouseDrag(box.right - 10, y, box.left + 10, y, 3)
    await settled(viewport)
    expect(model.value).toBeGreaterThan(0)
    expect(new Set(reasons)).toEqual(new Set(['drag']))
  })

  it('reports swipe in fade mode', async () => {
    const { viewport, model, reasons } = mountCarousel({ fade: true })
    await measured(viewport).catch(() => {})
    const box = viewport.getBoundingClientRect()
    const y = box.top + 40
    pointerGesture(viewport, 'touch', [[box.right - 20, y], [box.right - 60, y], [box.left + 20, y]])
    await expect.poll(() => model.value).toBe(1)
    expect(reasons).toEqual(['swipe'])
  })

  it('reports scroll for a native scroll', async () => {
    const { viewport, model, reasons } = mountCarousel()
    await measured(viewport)
    viewport.scrollTo({ left: SIZE * 2, behavior: 'instant' })
    await expect.poll(() => model.value).toBe(2)
    expect(new Set(reasons)).toEqual(new Set(['scroll']))
  })

  it('reports auto-scroll, then end-reached at the end of the track', async () => {
    const { playing, reasons, playingReasons } = mountCarousel({ autoScroll: { speed: 3000 } })
    await mouseAway()
    await expect.poll(() => playing.value, { timeout: 3000 }).toBe(false)
    expect(new Set(reasons)).toEqual(new Set(['auto-scroll']))
    expect(playingReasons).toEqual(['end-reached'])
  })

  it('keeps its place when beforeUpdate cancels a drag', async () => {
    document.body.innerHTML = ''
    const updates: number[] = []
    mount(defineComponent({
      setup: () => () => h(CarouselRoot, {
        'aria-label': 'Cancelled',
        'style': { width: `${SIZE}px` },
        'onBeforeUpdate:modelValue': (_value: number, details: { cancel: () => void }) => details.cancel(),
        'onUpdate:modelValue': (value: number) => updates.push(value),
      }, () => h(CarouselViewport, { 'data-testid': 'viewport' }, () =>
        h(CarouselContent, () => Array.from({ length: COUNT }, (_, i) => h(CarouselItem, { key: i, style: { width: `${SIZE}px`, height: '100px' } }, () => `Slide ${i + 1}`))))),
    }), { attachTo: document.body })
    const viewport = document.querySelector<HTMLElement>('[data-testid="viewport"]')!
    await measured(viewport)
    const box = viewport.getBoundingClientRect()
    const y = box.top + 40
    pointerGesture(viewport, 'pen', [[box.right - 20, y], [box.right - 60, y], [box.left + 40, y]])
    await settled(viewport)
    expect(updates).toEqual([])
    expect(Math.abs(viewport.scrollLeft)).toBeCloseTo(0, 0)
  })
})

describe('given a Carousel paged with the wheel in a real browser', () => {
  it('pages with the wheel and hands it back to the page at an end', async () => {
    const prevented: boolean[] = []
    const { viewport, model, scroll } = mountCarousel({ wheel: true, defaultValue: COUNT - 1 })
    await measured(viewport, COUNT - 1)
    await settled(viewport)
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
    await settled(viewport)
    expect(viewport.style.scrollSnapType).toBe('x mandatory')
    expect(scroll() % SIZE).toBeCloseTo(0, 0)
  })

  it('stops at the end of a track that does not loop', async () => {
    const { viewport, scroll, playing } = mountCarousel({ autoScroll: { speed: 3000 } })
    await mouseAway()
    await expect.poll(() => playing.value, { timeout: 3000 }).toBe(false)
    await settled(viewport)
    expect(scroll()).toBeCloseTo(SIZE * (COUNT - 1), 0)
  })
})

describe('given a Carousel holding the keyboard focus in a real browser', () => {
  const button = (i: number) => h('button', { 'type': 'button', 'data-testid': `button-${i}` }, `Slide ${i + 1}`)

  // Paged through `v-model` while the focus stays in the slide: a press on Next would move the
  // focus to Next. `.focus()` because macOS WebKit doesn't focus a button on click.
  it.each([false, true])('gives the focus to the slide that comes in when the focused one pages away (fade: %s)', async (fade) => {
    const index = ref(0)
    const { get, viewport } = mountCarousel({ fade, modelValue: index }, button)
    await mouseAway()
    await sleep(300)
    get('button-0').focus()
    index.value = 1
    await expect.poll(() => get('button-1').closest('[data-index]')!.hasAttribute('data-active')).toBe(true)
    await settled(viewport)
    await expect.poll(() => document.activeElement).toBe(get('button-1'))
  })

  it('gives the focus to the incoming slide with translated slides and grouped indicators', async () => {
    document.body.innerHTML = ''
    const model = ref(0)
    mount(defineComponent({
      setup: () => () => [h('div', { 'data-testid': 'outside', 'style': { height: '20px' } }), h(CarouselRoot, { 'aria-label': 'Tabs', 'style': { width: `${SIZE}px` }, 'modelValue': model.value, 'onUpdate:modelValue': (value: number) => model.value = value }, () => [
        h(CarouselViewport, { 'data-testid': 'viewport' }, () => h(CarouselContent, () => [0, 1, 2].map(i =>
          h(CarouselItem, { 'key': i, 'aria-roledescription': 'diapositiva', 'style': { width: `${SIZE}px` } }, () => button(i))))),
        h(CarouselIndicatorGroup, () => [0, 1, 2].map(index => h(CarouselIndicator, { key: index, index }))),
        h(CarouselNext, { 'data-testid': 'next' }, () => 'Next'),
      ])],
    }), { attachTo: document.body })
    await mouseAway()
    const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
    await expect.poll(() => get('viewport').querySelector('[data-index="0"]')?.getAttribute('role')).toBe('tabpanel')
    await sleep(300)
    get('button-0').focus()
    model.value = 1
    await expect.poll(() => document.activeElement).toBe(get('button-1'))
  })

  it('keeps the focus on Next when it reaches the last snap', async () => {
    const { get, model, viewport } = mountCarousel()
    await mouseAway()
    await sleep(300)
    get('next').focus()
    for (let i = 0; i < COUNT - 1; i++)
      await userEvent.keyboard('{Enter}')
    await expect.poll(() => model.value).toBe(COUNT - 1)
    await settled(viewport)
    expect(get('next').getAttribute('aria-disabled')).toBe('true')
    expect(document.activeElement).toBe(get('next'))
    await userEvent.keyboard('{Enter}')
    expect(model.value).toBe(COUNT - 1)
  })
})

describe('given a Carousel with form fields in its slides in a real browser', () => {
  it('leaves a mouse press on a field to the field', async () => {
    const field = (i: number) => h('input', { 'data-testid': `field-${i}`, 'value': 'Select this text please', 'style': { width: '180px' } })
    const { get, model, viewport, scroll } = mountCarousel({}, field)
    await measured(viewport)
    const box = get('field-0').getBoundingClientRect()
    await commands.mouseDrag(box.left + 170, box.top + 5, box.left + 10, box.top + 5, 10)
    await sleep(300)
    expect(model.value).toBe(0)
    expect(scroll()).toBeCloseTo(0, 0)
    expect(document.activeElement).toBe(get('field-0'))
    const input = get('field-0') as HTMLInputElement
    expect(input.selectionEnd! - input.selectionStart!).toBeGreaterThan(0)
  })
})

describe('given a Carousel dragged past its ends in a real browser', () => {
  it('stretches past the first slide and springs back on release', async () => {
    const { viewport, scroll } = mountCarousel()
    await measured(viewport)
    const content = viewport.firstElementChild as HTMLElement
    const box = viewport.getBoundingClientRect()
    const y = box.top + 40
    const base = { bubbles: true, cancelable: true, composed: true, isPrimary: true, pointerId: 11, pointerType: 'pen' }
    viewport.dispatchEvent(new PointerEvent('pointerdown', { ...base, button: 0, buttons: 1, clientX: box.left + 20, clientY: y }))
    document.dispatchEvent(new PointerEvent('pointermove', { ...base, buttons: 1, clientX: box.left + 40, clientY: y }))
    document.dispatchEvent(new PointerEvent('pointermove', { ...base, buttons: 1, clientX: box.left + 120, clientY: y }))
    expect(scroll()).toBe(0)
    expect(content.style.transform).toBe('translateX(30px)')
    document.dispatchEvent(new PointerEvent('pointerup', { ...base, button: 0, buttons: 0, clientX: box.left + 120, clientY: y }))
    expect(content.style.transform).toBe('')
    await settled(viewport)
    expect(scroll()).toBe(0)
  })
})

describe('given a rotating Carousel scrolled out of the page view in a real browser', () => {
  it('pauses while out of view', async () => {
    const { model, get } = mountCarousel({ autoplay: { delay: 300 } })
    const spacer = document.createElement('div')
    spacer.style.height = '5000px'
    document.body.append(spacer)
    await mouseAway()
    await expect.poll(() => model.value, { timeout: 2000 }).toBe(1)
    window.scrollTo(0, 4000)
    await expect.poll(() => get('root').hasAttribute('data-paused')).toBe(true)
    const held = model.value
    await sleep(900)
    expect(model.value).toBe(held)
    window.scrollTo(0, 0)
    await expect.poll(() => get('root').hasAttribute('data-paused')).toBe(false)
    await expect.poll(() => model.value, { timeout: 2000 }).toBe(held + 1)
  })
})

describe('given a Carousel reporting its progress in a real browser', () => {
  it('sets the progress as it scrolls and emits settle once it rests', async () => {
    const { get, viewport, scroll, settled: rests } = mountCarousel()
    await measured(viewport)
    const progress = () => get('root').style.getPropertyValue('--reka-carousel-progress')
    expect(progress()).toBe('0')
    await userEvent.click(get('next'))
    await settled(viewport)
    expect(progress()).toBe(String(1 / (COUNT - 1)))
    expect(rests).toEqual([1])
    viewport.scrollTo({ left: SIZE * 2, behavior: 'instant' })
    await settled(viewport)
    expect(progress()).toBe(String(2 / (COUNT - 1)))
    expect(rests).toEqual([1, 2])
  })
})
