import type { ChangeEventDetails } from '@/shared'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { CarouselAutoplayToggle, CarouselContent, CarouselIndicator, CarouselItem, CarouselNext, CarouselPrevious, CarouselRoot, CarouselViewport } from '.'

enableAutoUnmount(afterEach)

type Call = [name: string, value: unknown, details: ChangeEventDetails<string> | undefined]

interface Options {
  props?: Record<string, unknown>
  count?: number
  /** Cancels every `beforeUpdate:<name>` whose name is listed. */
  cancel?: ('modelValue' | 'playing')[]
}

function mountCarousel({ props = {}, count = 5, cancel = [] }: Options = {}) {
  document.body.innerHTML = ''
  const calls: Call[] = []
  const slides = ref(count)
  let slot: Record<string, any> = {}
  const record = (name: string) => (value: unknown, details?: ChangeEventDetails<string>) => {
    calls.push([name, value, details])
    if (name.startsWith('beforeUpdate:') && cancel.includes(name.slice('beforeUpdate:'.length) as 'modelValue'))
      details?.cancel()
  }
  const wrapper = mount(defineComponent({
    setup: () => () => h(CarouselRoot, {
      'aria-label': 'Details',
      ...props,
      'onBeforeUpdate:modelValue': record('beforeUpdate:modelValue'),
      'onUpdate:modelValue': record('update:modelValue'),
      'onBeforeUpdate:playing': record('beforeUpdate:playing'),
      'onUpdate:playing': record('update:playing'),
    }, {
      default: (props: Record<string, any>) => {
        slot = props
        return [
          h(CarouselAutoplayToggle, () => 'Toggle'),
          h(CarouselViewport, () => h(CarouselContent, () =>
            Array.from({ length: slides.value }, (_, i) => h(CarouselItem, { key: i }, () => `Slide ${i + 1}`)))),
          h(CarouselPrevious),
          h(CarouselNext),
          ...Array.from({ length: props.snapCount }, (_, index) => h(CarouselIndicator, { key: `i${index}`, index })),
        ]
      },
    }),
  }), { attachTo: document.body })
  const active = () => wrapper.findAll('[data-index][data-active]').map(item => Number(item.attributes('data-index')))
  const of = (name: string) => calls.filter(call => call[0] === name)
  const last = (name: string) => of(name).at(-1)
  return { wrapper, calls, of, last, active, slides, slot: () => slot }
}

const viewport = (wrapper: ReturnType<typeof mountCarousel>['wrapper']) => wrapper.find('[tabindex="0"]')

describe('given an uncontrolled Carousel, the modelValue change details', () => {
  it('report next-press and prev-press with the click', async () => {
    const c = mountCarousel()
    await nextTick()
    await c.wrapper.find('[aria-label="Next slide"]').trigger('click')
    expect(c.last('update:modelValue')).toEqual(['update:modelValue', 1, expect.objectContaining({ reason: 'next-press', event: expect.any(MouseEvent) })])
    await c.wrapper.find('[aria-label="Previous slide"]').trigger('click')
    expect(c.last('update:modelValue')).toEqual(['update:modelValue', 0, expect.objectContaining({ reason: 'prev-press' })])
    expect(c.active()).toEqual([0])
  })

  it('report indicator-press', async () => {
    const c = mountCarousel()
    await nextTick()
    await c.wrapper.find('[aria-label="Go to slide 4"]').trigger('click')
    expect(c.last('update:modelValue')).toEqual(['update:modelValue', 3, expect.objectContaining({ reason: 'indicator-press', event: expect.any(MouseEvent) })])
  })

  it('report keyboard for the arrows, Home and End', async () => {
    const c = mountCarousel()
    await nextTick()
    for (const [key, index] of [['ArrowRight', 1], ['End', 4], ['ArrowLeft', 3], ['Home', 0]] as const) {
      await viewport(c.wrapper).trigger('keydown', { key })
      expect(c.last('update:modelValue')).toEqual(['update:modelValue', index, expect.objectContaining({ reason: 'keyboard', event: expect.any(KeyboardEvent) })])
    }
  })

  it('report wheel', async () => {
    const c = mountCarousel({ props: { wheel: true } })
    await nextTick()
    await viewport(c.wrapper).trigger('wheel', { deltaY: 100 })
    expect(c.last('update:modelValue')).toEqual(['update:modelValue', 1, expect.objectContaining({ reason: 'wheel', event: expect.any(WheelEvent) })])
  })

  it('report imperative-action for the slot functions', async () => {
    const c = mountCarousel()
    await nextTick()
    c.slot().scrollTo(2)
    await nextTick()
    expect(c.last('update:modelValue')).toEqual(['update:modelValue', 2, expect.objectContaining({ reason: 'imperative-action' })])
    c.slot().scrollNext()
    await nextTick()
    expect(c.last('update:modelValue')?.[2]?.reason).toBe('imperative-action')
  })

  it('report missing when the current snap is removed', async () => {
    const c = mountCarousel({ props: { defaultValue: 4 } })
    await nextTick()
    c.slides.value = 2
    await nextTick()
    await nextTick()
    expect(c.last('update:modelValue')).toEqual(['update:modelValue', 1, expect.objectContaining({ reason: 'missing' })])
  })

  it('emit beforeUpdate first, with the same details object', async () => {
    const c = mountCarousel()
    await nextTick()
    await c.wrapper.find('[aria-label="Next slide"]').trigger('click')
    const [before, update] = c.calls.filter(call => call[0].endsWith(':modelValue'))
    expect(before[0]).toBe('beforeUpdate:modelValue')
    expect(update[0]).toBe('update:modelValue')
    expect(before[1]).toBe(1)
    expect(before[2]).toBe(update[2])
    expect(update[2]?.isCanceled).toBe(false)
  })

  it('stays put when beforeUpdate cancels, whatever the input', async () => {
    const c = mountCarousel({ cancel: ['modelValue'], props: { wheel: true } })
    await nextTick()
    await c.wrapper.find('[aria-label="Next slide"]').trigger('click')
    await c.wrapper.find('[aria-label="Go to slide 3"]').trigger('click')
    await viewport(c.wrapper).trigger('keydown', { key: 'End' })
    await viewport(c.wrapper).trigger('wheel', { deltaY: 100 })
    expect(c.of('beforeUpdate:modelValue').map(call => call[2]?.reason)).toEqual(['next-press', 'indicator-press', 'keyboard', 'wheel'])
    expect(c.of('update:modelValue')).toEqual([])
    expect(c.active()).toEqual([0])
    expect(c.slot().scrollTo(2)).toBe(false)
  })
})

describe('given a controlled Carousel, the modelValue change details', () => {
  it('emit the change with its reason and leave the index to the parent', async () => {
    const c = mountCarousel({ props: { modelValue: 1 } })
    await nextTick()
    await c.wrapper.find('[aria-label="Next slide"]').trigger('click')
    expect(c.last('update:modelValue')).toEqual(['update:modelValue', 2, expect.objectContaining({ reason: 'next-press' })])
    expect(c.active()).toEqual([1])
  })

  it('emit nothing but beforeUpdate when it cancels', async () => {
    const c = mountCarousel({ props: { modelValue: 1 }, cancel: ['modelValue'] })
    await nextTick()
    await c.wrapper.find('[aria-label="Previous slide"]').trigger('click')
    expect(c.of('beforeUpdate:modelValue')).toHaveLength(1)
    expect(c.of('update:modelValue')).toEqual([])
  })

  it('emit a step back to the current index after an unanswered step in the same tick', async () => {
    const c = mountCarousel({ props: { modelValue: 1 } })
    await nextTick()
    c.slot().scrollNext()
    c.slot().scrollPrev()
    expect(c.of('update:modelValue').map(call => call[1])).toEqual([2, 1])
  })
})

describe('given a Carousel with autoplay, the change details', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('report autoplay for a step and a rewind', async () => {
    const c = mountCarousel({ props: { autoplay: { delay: 100 }, defaultValue: 3 } })
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    expect(c.last('update:modelValue')).toEqual(['update:modelValue', 4, expect.objectContaining({ reason: 'autoplay' })])
    await vi.advanceTimersByTimeAsync(100)
    expect(c.last('update:modelValue')).toEqual(['update:modelValue', 0, expect.objectContaining({ reason: 'autoplay' })])
  })

  it('keep rotating when beforeUpdate cancels a step', async () => {
    const c = mountCarousel({ props: { autoplay: { delay: 100 } }, cancel: ['modelValue'] })
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    await vi.advanceTimersByTimeAsync(100)
    expect(c.of('beforeUpdate:modelValue')).toHaveLength(2)
    expect(c.active()).toEqual([0])
  })

  it('report toggle-press for the rotation control, uncontrolled', async () => {
    const c = mountCarousel({ props: { autoplay: true } })
    await nextTick()
    await c.wrapper.find('[aria-label="Stop slide rotation"]').trigger('click')
    expect(c.last('update:playing')).toEqual(['update:playing', false, expect.objectContaining({ reason: 'toggle-press', event: expect.any(MouseEvent) })])
    expect(c.wrapper.attributes('data-playing')).toBeUndefined()
    await c.wrapper.find('[aria-label="Start slide rotation"]').trigger('click')
    expect(c.last('update:playing')?.slice(1, 2)).toEqual([true])
  })

  it('report toggle-press, controlled, and leave the state to the parent', async () => {
    const c = mountCarousel({ props: { autoplay: true, playing: true } })
    await nextTick()
    await c.wrapper.find('[aria-label="Stop slide rotation"]').trigger('click')
    expect(c.last('update:playing')).toEqual(['update:playing', false, expect.objectContaining({ reason: 'toggle-press' })])
    expect(c.wrapper.attributes('data-playing')).toBe('')
  })

  it('report interaction when a control stops rotation', async () => {
    const c = mountCarousel({ props: { autoplay: true } })
    await nextTick()
    await c.wrapper.find('[aria-label="Next slide"]').trigger('click')
    expect(c.last('update:playing')).toEqual(['update:playing', false, expect.objectContaining({ reason: 'interaction', event: expect.any(MouseEvent) })])
  })

  it('report keyboard-focus when keyboard focus enters', async () => {
    const c = mountCarousel({ props: { autoplay: true } })
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    ;(c.wrapper.find('[aria-label="Stop slide rotation"]').element as HTMLElement).focus()
    await nextTick()
    expect(c.last('update:playing')).toEqual(['update:playing', false, expect.objectContaining({ reason: 'keyboard-focus', event: expect.any(FocusEvent) })])
  })

  it('report end-reached with stopOnLastSnap', async () => {
    const c = mountCarousel({ props: { autoplay: { delay: 100, stopOnLastSnap: true }, defaultValue: 4 } })
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    expect(c.last('update:playing')).toEqual(['update:playing', false, expect.objectContaining({ reason: 'end-reached' })])
  })

  it('report imperative-action for the slot play and stop', async () => {
    const c = mountCarousel({ props: { autoplay: true } })
    await nextTick()
    c.slot().stop()
    expect(c.last('update:playing')).toEqual(['update:playing', false, expect.objectContaining({ reason: 'imperative-action' })])
  })

  it('keep playing when beforeUpdate:playing cancels', async () => {
    const c = mountCarousel({ props: { autoplay: true }, cancel: ['playing'] })
    await nextTick()
    await c.wrapper.find('[aria-label="Stop slide rotation"]').trigger('click')
    expect(c.of('beforeUpdate:playing')).toHaveLength(1)
    expect(c.of('update:playing')).toEqual([])
    expect(c.wrapper.attributes('data-playing')).toBe('')
    expect(c.slot().stop()).toBe(false)
  })

  it('keep the interval running when beforeUpdate:playing cancels the end-reached stop', async () => {
    const c = mountCarousel({ props: { autoplay: { delay: 100, stopOnLastSnap: true }, defaultValue: 4 }, cancel: ['playing'] })
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    expect(c.of('beforeUpdate:playing').map(call => call[2]?.reason)).toEqual(['end-reached'])
    await vi.advanceTimersByTimeAsync(100)
    expect(c.of('beforeUpdate:playing')).toHaveLength(2)
    expect(c.wrapper.attributes('data-playing')).toBe('')
    expect(c.active()).toEqual([4])
  })

  it('report reduced-motion when the user prefers it', async () => {
    const matchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }))
    try {
      const c = mountCarousel({ props: { autoplay: true } })
      await nextTick()
      expect(c.last('update:playing')).toEqual(['update:playing', false, expect.objectContaining({ reason: 'reduced-motion' })])
    }
    finally {
      window.matchMedia = matchMedia
    }
  })
})
