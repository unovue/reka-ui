import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { CarouselContent, CarouselItem, CarouselNext, CarouselRoot, CarouselViewport } from '.'

const VIEW = 320
const GUTTER = 16

interface GutterOptions {
  /** Item size as a fraction of the content. */
  basis?: number
  gutter?: number
  count?: number
  props?: Record<string, unknown>
}

/**
 * The shadcn-vue and Nuxt UI gutter: a negative start margin on the content and
 * the same start padding on each item, sized with `flex-basis`.
 */
function mountGutter({ basis = 1, gutter = GUTTER, count = 5, props = {}, controlled = false }: GutterOptions & { controlled?: boolean } = {}) {
  document.body.innerHTML = ''
  const vertical = props.orientation === 'vertical'
  const rtl = props.dir === 'rtl'
  const model = ref(0)
  const Fixture = defineComponent({
    setup: () => () => h(CarouselRoot, {
      'aria-label': 'Gutter',
      ...props,
      ...(controlled ? { modelValue: model.value } : {}),
      'style': vertical ? { width: '200px' } : { width: `${VIEW}px`, margin: '20px' },
      'onUpdate:modelValue': (value: number) => model.value = value,
    }, () => [
      h(CarouselViewport, { 'data-testid': 'viewport', 'style': vertical ? { height: `${VIEW}px` } : undefined }, () =>
        h(CarouselContent, { style: vertical ? { marginTop: `${-gutter}px`, height: `${VIEW + gutter}px` } : { marginInlineStart: `${-gutter}px` } }, () =>
          Array.from({ length: count }, (_, i) => h(CarouselItem, {
            key: i,
            style: {
              flexBasis: `${basis * 100}%`,
              [vertical ? 'paddingTop' : 'paddingInlineStart']: `${gutter}px`,
              boxSizing: 'border-box',
            },
          }, () => h('div', { 'data-testid': `slide-${i}`, 'style': { height: vertical ? '100%' : '80px' } }, `Slide ${i + 1}`))))),
      h(CarouselNext, { 'data-testid': 'next' }, () => 'Next'),
    ]),
  })
  mount(Fixture, { attachTo: document.body })
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!
  const viewport = get('viewport')
  /** Where slide `i`'s content starts in the viewport, along the main axis. */
  const offset = (i: number) => {
    const box = viewport.getBoundingClientRect()
    const slide = get(`slide-${i}`).getBoundingClientRect()
    if (vertical)
      return slide.top - box.top
    return rtl ? box.right - slide.right : slide.left - box.left
  }
  const scroll = () => vertical ? viewport.scrollTop : Math.abs(viewport.scrollLeft)
  return { get, viewport, model, offset, scroll }
}

/** Waits until the scroll position holds for 300ms. */
async function settled(scroll: () => number) {
  const readings: number[] = []
  await expect.poll(() => {
    readings.push(scroll())
    const last = readings.slice(-4)
    return last.length === 4 && last.every(value => Math.abs(value - last[0]) < 0.5)
  }, { interval: 100, timeout: 4000 }).toBe(true)
}

async function measured(viewport: HTMLElement) {
  await expect.poll(() => viewport.querySelector('[data-index="0"]')?.hasAttribute('data-in-view')).toBe(true)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('given a Carousel spaced with item padding and a negative content margin', () => {
  it('rests every slide flush with the viewport', async () => {
    const { get, viewport, offset, scroll } = mountGutter()
    await measured(viewport)
    expect(offset(0)).toBeCloseTo(0, 0)
    for (const i of [1, 2]) {
      await userEvent.click(get('next'))
      await expect.poll(() => offset(i)).toBeCloseTo(0, 0)
    }
    await settled(scroll)
    expect(offset(2)).toBeCloseTo(0, 0)
  })

  it('settles a native scroll on the same offset', async () => {
    const { viewport, model, offset, scroll } = mountGutter()
    await measured(viewport)
    viewport.scrollBy({ left: VIEW * 0.6, behavior: 'instant' })
    await settled(scroll)
    expect(model.value).toBe(1)
    expect(offset(1)).toBeCloseTo(0, 0)
  })

  it('centers the slide content, not the gutter, with align center', async () => {
    const { get, viewport, offset, scroll } = mountGutter({ props: { align: 'center' } })
    await measured(viewport)
    await settled(scroll)
    expect(offset(0)).toBeCloseTo(0, 0)
    await userEvent.click(get('next'))
    await settled(scroll)
    expect(offset(1)).toBeCloseTo(0, 0)
    viewport.scrollBy({ left: VIEW * 0.6, behavior: 'instant' })
    await settled(scroll)
    expect(offset(2)).toBeCloseTo(0, 0)
  })

  it('centers the content of three per view with align center', async () => {
    const { get, viewport, model, offset, scroll } = mountGutter({ basis: 1 / 3, count: 6, props: { align: 'center' } })
    await measured(viewport)
    const slide = (VIEW + GUTTER) / 3 - GUTTER
    await userEvent.click(get('next'))
    await settled(scroll)
    expect(model.value).toBe(1)
    expect(offset(2)).toBeCloseTo((VIEW - slide) / 2, 0)
    viewport.scrollBy({ left: (VIEW + GUTTER) / 3, behavior: 'instant' })
    await settled(scroll)
    expect(offset(3)).toBeCloseTo((VIEW - slide) / 2, 0)
    expect(model.value).toBe(2)
    // 6 items, 3 visible, centered: 4 snaps once the ends are trimmed.
    await userEvent.click(get('next'))
    await settled(scroll)
    expect(model.value).toBe(3)
    expect(get('next').hasAttribute('disabled')).toBe(true)
  })

  it('ends the slide content flush with the viewport with align end', async () => {
    const { get, viewport, offset, scroll } = mountGutter({ basis: 1 / 2, props: { align: 'end' } })
    await measured(viewport)
    const slide = (VIEW + GUTTER) / 2 - GUTTER
    await userEvent.click(get('next'))
    await settled(scroll)
    expect(offset(2) + slide).toBeCloseTo(VIEW, 0)
  })

  it('trims the end snaps with three per view', async () => {
    const { get, viewport, model, offset, scroll } = mountGutter({ basis: 1 / 3, count: 6 })
    await measured(viewport)
    for (let i = 0; i < 3; i++)
      await userEvent.click(get('next'))
    await settled(scroll)
    // 6 items, 3 visible: 4 snaps.
    expect(model.value).toBe(3)
    expect(get('next').hasAttribute('disabled')).toBe(true)
    expect(offset(3)).toBeCloseTo(0, 0)
  })

  it('lines up vertically with a top gutter', async () => {
    const { get, viewport, offset, scroll } = mountGutter({ props: { orientation: 'vertical' } })
    await measured(viewport)
    expect(offset(0)).toBeCloseTo(0, 0)
    await userEvent.click(get('next'))
    await settled(scroll)
    expect(offset(1)).toBeCloseTo(0, 0)
    viewport.scrollBy({ top: VIEW * 0.6, behavior: 'instant' })
    await settled(scroll)
    expect(offset(2)).toBeCloseTo(0, 0)
  })

  it('lines up in a rotated loop with two per view', async () => {
    const { get, viewport, model, offset, scroll } = mountGutter({ basis: 1 / 2, count: 6, props: { loop: true } })
    await measured(viewport)
    await expect.poll(() => viewport.querySelector<HTMLElement>('[data-index="0"]')!.style.order).not.toBe('')
    await settled(scroll)
    expect(offset(0)).toBeCloseTo(0, 0)
    for (let i = 0; i < 6; i++)
      await userEvent.click(get('next'))
    await settled(scroll)
    expect(model.value).toBe(0)
    expect(offset(0)).toBeCloseTo(0, 0)
  })

  it.each([
    { controlled: false, gap: 0 },
    { controlled: true, gap: 0 },
    { controlled: false, gap: 1 },
    { controlled: true, gap: 1 },
  ])('lands on the target snap after a burst of steps in a loop (%j)', async ({ controlled, gap }) => {
    const { get, viewport, model, offset, scroll } = mountGutter({ basis: 1 / 2, count: 6, controlled, props: { loop: true, align: 'center' } })
    await measured(viewport)
    await expect.poll(() => viewport.querySelector<HTMLElement>('[data-index="0"]')!.style.order).not.toBe('')
    await settled(scroll)
    const slide = (VIEW + GUTTER) / 2 - GUTTER
    const centered = (VIEW - slide) / 2
    expect(offset(0)).toBeCloseTo(centered, 0)
    for (const [steps, target] of [[2, 2], [2, 4], [1, 5], [3, 2]] as const) {
      // `gap`: clicks in separate tasks, before the first smooth scroll has moved.
      for (let i = 0; i < steps; i++) {
        get('next').click()
        if (gap)
          await new Promise(resolve => setTimeout(resolve, gap))
      }
      await settled(scroll)
      expect(model.value).toBe(target)
      expect(offset(target)).toBeCloseTo(centered, 0)
    }
  })

  it('lines up in RTL with the gutter on the inline start', async () => {
    const { get, viewport, offset, scroll } = mountGutter({ props: { dir: 'rtl' } })
    await measured(viewport)
    expect(offset(0)).toBeCloseTo(0, 0)
    await userEvent.click(get('next'))
    await settled(scroll)
    expect(offset(1)).toBeCloseTo(0, 0)
  })

  it('lands at 0 when the gutter is zeroed', async () => {
    const { get, viewport, offset, scroll } = mountGutter({ gutter: 0 })
    await measured(viewport)
    await userEvent.click(get('next'))
    await settled(scroll)
    expect(offset(1)).toBeCloseTo(0, 0)
    viewport.scrollBy({ left: VIEW * 0.6, behavior: 'instant' })
    await settled(scroll)
    expect(offset(2)).toBeCloseTo(0, 0)
  })
})
