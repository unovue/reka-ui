import type { VueWrapper } from '@vue/test-utils'
import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { CarouselAutoplayToggle, CarouselContent, CarouselIndicator, CarouselItem, CarouselNext, CarouselPrevious, CarouselRoot, CarouselViewport } from '.'
import Carousel from './story/_Carousel.vue'

function mountCarousel(props: Record<string, unknown> = {}) {
  document.body.innerHTML = ''
  return mount(Carousel, { props, attachTo: document.body })
}

function items(wrapper: VueWrapper) {
  return wrapper.findAll('[aria-roledescription="slide"]')
}

function activeIndices(wrapper: VueWrapper) {
  return items(wrapper).flatMap((item, i) => item.attributes('data-active') !== undefined ? [i] : [])
}

function lastEmit(wrapper: VueWrapper, name: string) {
  const events = wrapper.emitted(name) as [unknown, { reason: string }][] | undefined
  return events?.at(-1)
}

describe('given a default Carousel', () => {
  let wrapper: VueWrapper

  beforeEach(async () => {
    wrapper = mountCarousel()
    await nextTick()
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('renders the APG carousel roles', () => {
    expect(wrapper.attributes('role')).toBe('region')
    expect(wrapper.attributes('aria-roledescription')).toBe('carousel')
    expect(wrapper.attributes('aria-label')).toBe('Featured')
    expect(wrapper.find('[aria-live]').attributes('aria-live')).toBe('polite')
    expect(wrapper.find('[aria-live]').attributes('aria-atomic')).toBe('false')
  })

  it('labels each slide with its position', () => {
    expect(items(wrapper).map(item => item.attributes('role'))).toEqual(Array.from({ length: 5 }).fill('group'))
    expect(items(wrapper).map(item => item.attributes('aria-label'))).toEqual(['1 of 5', '2 of 5', '3 of 5', '4 of 5', '5 of 5'])
    expect(items(wrapper).map(item => item.attributes('data-index'))).toEqual(['0', '1', '2', '3', '4'])
  })

  it('starts on the first slide with previous disabled', () => {
    expect(activeIndices(wrapper)).toEqual([0])
    expect(wrapper.find('[aria-label="Previous slide"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[aria-label="Next slide"]').attributes('disabled')).toBeUndefined()
  })

  it('points the controls at the content', () => {
    const id = wrapper.find('[aria-live]').attributes('id')
    expect(id).toBeTruthy()
    expect(wrapper.find('[aria-label="Next slide"]').attributes('aria-controls')).toBe(id)
    expect(wrapper.find('[aria-label="Go to slide 1"]').attributes('aria-controls')).toBe(id)
  })

  it('renders one indicator per snap, the current one marked', () => {
    const indicators = wrapper.findAll('[aria-label^="Go to slide"]')
    expect(indicators).toHaveLength(5)
    expect(indicators[0].attributes('data-active')).toBe('')
    expect(indicators[0].attributes('aria-disabled')).toBe('true')
    expect(indicators[1].attributes('aria-disabled')).toBeUndefined()
  })

  it('goes to the next slide with a next-press reason', async () => {
    await wrapper.find('[aria-label="Next slide"]').trigger('click')
    expect(activeIndices(wrapper)).toEqual([1])
    const [value, details] = lastEmit(wrapper, 'update:modelValue')!
    expect(value).toBe(1)
    expect(details.reason).toBe('next-press')
  })

  it('goes back with a previous-press reason', async () => {
    await wrapper.find('[aria-label="Next slide"]').trigger('click')
    await wrapper.find('[aria-label="Previous slide"]').trigger('click')
    expect(activeIndices(wrapper)).toEqual([0])
    expect(lastEmit(wrapper, 'update:modelValue')![1].reason).toBe('previous-press')
  })

  it('jumps to an indicator with an indicator-press reason', async () => {
    await wrapper.find('[aria-label="Go to slide 4"]').trigger('click')
    expect(activeIndices(wrapper)).toEqual([3])
    expect(lastEmit(wrapper, 'update:modelValue')![1].reason).toBe('indicator-press')
  })

  it('disables next on the last slide', async () => {
    await wrapper.find('[aria-label="Go to slide 5"]').trigger('click')
    expect(wrapper.find('[aria-label="Next slide"]').attributes('disabled')).toBeDefined()
  })

  it('makes the viewport focusable and navigates with the keyboard', async () => {
    const viewport = wrapper.find('[tabindex="0"]')
    expect(viewport.exists()).toBe(true)
    await viewport.trigger('keydown', { key: 'ArrowRight' })
    expect(activeIndices(wrapper)).toEqual([1])
    expect(lastEmit(wrapper, 'update:modelValue')![1].reason).toBe('keyboard')
    await viewport.trigger('keydown', { key: 'End' })
    expect(activeIndices(wrapper)).toEqual([4])
    await viewport.trigger('keydown', { key: 'Home' })
    expect(activeIndices(wrapper)).toEqual([0])
    await viewport.trigger('keydown', { key: 'ArrowLeft' })
    expect(activeIndices(wrapper)).toEqual([0])
  })

  it('ignores keys coming from inside a slide', async () => {
    await items(wrapper)[0].trigger('keydown', { key: 'ArrowRight' })
    expect(activeIndices(wrapper)).toEqual([0])
  })
})

describe('given a controlled Carousel', () => {
  it('follows modelValue', async () => {
    const wrapper = mountCarousel({ modelValue: 2 })
    await nextTick()
    expect(activeIndices(wrapper)).toEqual([2])
    await wrapper.setProps({ modelValue: 4 })
    expect(activeIndices(wrapper)).toEqual([4])
  })

  it('keeps the index when beforeUpdate cancels', async () => {
    const wrapper = mountCarousel({
      'onBeforeUpdate:modelValue': (_: number, details: { cancel: () => void }) => details.cancel(),
    })
    await nextTick()
    await wrapper.find('[aria-label="Next slide"]').trigger('click')
    expect(activeIndices(wrapper)).toEqual([0])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('starts on defaultValue', async () => {
    const wrapper = mountCarousel({ defaultValue: 3 })
    await nextTick()
    expect(activeIndices(wrapper)).toEqual([3])
  })
})

describe('given a Carousel with options', () => {
  it('wraps around with loop', async () => {
    const wrapper = mountCarousel({ loop: true })
    await nextTick()
    expect(wrapper.find('[aria-label="Previous slide"]').attributes('disabled')).toBeUndefined()
    await wrapper.find('[aria-label="Previous slide"]').trigger('click')
    expect(activeIndices(wrapper)).toEqual([4])
    await wrapper.find('[aria-label="Next slide"]').trigger('click')
    expect(activeIndices(wrapper)).toEqual([0])
  })

  it('moves by groups with slidesToScroll', async () => {
    const wrapper = mountCarousel({ slidesToScroll: 2 })
    await nextTick()
    expect(wrapper.findAll('[aria-label^="Go to slide"]')).toHaveLength(3)
    expect(activeIndices(wrapper)).toEqual([0, 1])
    await wrapper.find('[aria-label="Next slide"]').trigger('click')
    expect(activeIndices(wrapper)).toEqual([2, 3])
    await wrapper.find('[aria-label="Next slide"]').trigger('click')
    expect(activeIndices(wrapper)).toEqual([4])
  })

  it('maps the arrow keys to the reading direction in RTL', async () => {
    const wrapper = mountCarousel({ dir: 'rtl' })
    await nextTick()
    expect(wrapper.attributes('dir')).toBe('rtl')
    await wrapper.find('[tabindex="0"]').trigger('keydown', { key: 'ArrowLeft' })
    expect(activeIndices(wrapper)).toEqual([1])
  })

  it('uses the vertical arrow keys when vertical', async () => {
    const wrapper = mountCarousel({ orientation: 'vertical' })
    await nextTick()
    expect(wrapper.attributes('data-orientation')).toBe('vertical')
    await wrapper.find('[tabindex="0"]').trigger('keydown', { key: 'ArrowRight' })
    expect(activeIndices(wrapper)).toEqual([0])
    await wrapper.find('[tabindex="0"]').trigger('keydown', { key: 'ArrowDown' })
    expect(activeIndices(wrapper)).toEqual([1])
  })

  it('stacks the slides and hides the inactive ones with fade', async () => {
    const wrapper = mountCarousel({ fade: true })
    await nextTick()
    const [first, second] = items(wrapper)
    expect((first.element as HTMLElement).style.opacity).toBe('1')
    expect((second.element as HTMLElement).style.opacity).toBe('0')
    expect(second.attributes('inert')).toBeDefined()
    expect(second.attributes('aria-hidden')).toBe('true')
    expect(first.attributes('inert')).toBeUndefined()
    expect(first.attributes('data-in-view')).toBe('')
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('lays out a scroll-snap track', async () => {
    const wrapper = mountCarousel()
    await nextTick()
    const viewport = wrapper.find('[tabindex="0"]').element as HTMLElement
    expect(viewport.style.overflowX).toBe('auto')
    expect(viewport.style.scrollSnapType).toBe('x mandatory')
    expect((items(wrapper)[0].element as HTMLElement).style.scrollSnapAlign).toBe('start')
  })

  it('turns user scrolling off when not draggable', async () => {
    const wrapper = mountCarousel({ draggable: false })
    await nextTick()
    expect((wrapper.find('[tabindex="0"]').element as HTMLElement).style.overflowX).toBe('hidden')
  })
})

describe('given a Carousel with autoplay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should pass axe accessibility tests', async () => {
    vi.useRealTimers()
    const wrapper = mountCarousel({ autoplay: true })
    await nextTick()
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('advances on the interval with an autoplay reason', async () => {
    const wrapper = mountCarousel({ autoplay: { delay: 1000 } })
    await nextTick()
    expect(wrapper.attributes('data-playing')).toBe('')
    expect(wrapper.find('[aria-live]').attributes('aria-live')).toBe('off')
    await vi.advanceTimersByTimeAsync(1000)
    expect(activeIndices(wrapper)).toEqual([1])
    expect(lastEmit(wrapper, 'update:modelValue')![1].reason).toBe('autoplay')
  })

  it('rewinds after the last slide, or stops with stopOnLastSnap', async () => {
    const rewinding = mountCarousel({ autoplay: { delay: 100 }, defaultValue: 4 })
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    expect(activeIndices(rewinding)).toEqual([0])

    const stopping = mountCarousel({ autoplay: { delay: 100, stopOnLastSnap: true }, defaultValue: 4 })
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)
    expect(activeIndices(stopping)).toEqual([4])
    expect(lastEmit(stopping, 'update:playing')).toEqual([false, expect.objectContaining({ reason: 'last-snap' })])
  })

  it('toggles rotation with the rotation control', async () => {
    const wrapper = mountCarousel({ autoplay: { delay: 1000 } })
    await nextTick()
    const toggle = wrapper.find('[aria-label="Stop slide rotation"]')
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('data-state')).toBe('playing')
    await toggle.trigger('click')
    expect(lastEmit(wrapper, 'update:playing')).toEqual([false, expect.objectContaining({ reason: 'toggle-press' })])
    expect(wrapper.find('[aria-label="Start slide rotation"]').attributes('data-state')).toBe('paused')
    expect(wrapper.find('[aria-live]').attributes('aria-live')).toBe('polite')
    await vi.advanceTimersByTimeAsync(3000)
    expect(activeIndices(wrapper)).toEqual([0])
  })

  it('pauses while a mouse hovers the carousel', async () => {
    const wrapper = mountCarousel({ autoplay: { delay: 1000 } })
    await nextTick()
    wrapper.element.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
    await vi.advanceTimersByTimeAsync(3000)
    expect(activeIndices(wrapper)).toEqual([0])
    wrapper.element.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }))
    await vi.advanceTimersByTimeAsync(1000)
    expect(activeIndices(wrapper)).toEqual([1])
    expect(wrapper.emitted('update:playing')).toBeUndefined()
  })

  it('stops when keyboard focus enters the carousel', async () => {
    const wrapper = mountCarousel({ autoplay: { delay: 1000 } })
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    ;(wrapper.find('[aria-label="Stop slide rotation"]').element as HTMLElement).focus()
    await nextTick()
    expect(lastEmit(wrapper, 'update:playing')).toEqual([false, expect.objectContaining({ reason: 'focus' })])
    // The rotation control restarts it explicitly.
    await wrapper.find('[aria-label="Start slide rotation"]').trigger('click')
    expect(lastEmit(wrapper, 'update:playing')![0]).toBe(true)
  })

  it('stops on interaction, unless stopOnInteraction is false', async () => {
    const stopping = mountCarousel({ autoplay: { delay: 1000 } })
    await nextTick()
    await stopping.find('[aria-label="Next slide"]').trigger('click')
    expect(lastEmit(stopping, 'update:playing')).toEqual([false, expect.objectContaining({ reason: 'interaction' })])

    const continuing = mountCarousel({ autoplay: { delay: 1000, stopOnInteraction: false } })
    await nextTick()
    await continuing.find('[aria-label="Next slide"]').trigger('click')
    expect(continuing.emitted('update:playing')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(1000)
    expect(activeIndices(continuing)).toEqual([2])
  })

  it('keeps rotating after a cancelled step', async () => {
    let cancelled = false
    const wrapper = mountCarousel({
      'autoplay': { delay: 1000 },
      'onBeforeUpdate:modelValue': (_: number, details: { cancel: () => void }) => {
        if (!cancelled) {
          cancelled = true
          details.cancel()
        }
      },
    })
    await nextTick()
    await vi.advanceTimersByTimeAsync(1000)
    expect(activeIndices(wrapper)).toEqual([0])
    await vi.advanceTimersByTimeAsync(1000)
    expect(activeIndices(wrapper)).toEqual([1])
  })

  it('keeps rotating after a plain mouse press on a slide', async () => {
    const wrapper = mountCarousel({ autoplay: { delay: 1000 } })
    await nextTick()
    wrapper.find('[tabindex="0"]').element.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'mouse', isPrimary: true, button: 0, bubbles: true }))
    expect(wrapper.emitted('update:playing')).toBeUndefined()
    wrapper.find('[tabindex="0"]').element.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', isPrimary: true, button: 0, bubbles: true }))
    expect(lastEmit(wrapper, 'update:playing')).toEqual([false, expect.objectContaining({ reason: 'interaction' })])
  })

  it('starts paused in a hidden page', async () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    try {
      const wrapper = mountCarousel({ autoplay: { delay: 1000 } })
      await nextTick()
      await vi.advanceTimersByTimeAsync(3000)
      expect(activeIndices(wrapper)).toEqual([0])
      visibility.mockReturnValue('visible')
      document.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(1000)
      expect(activeIndices(wrapper)).toEqual([1])
    }
    finally {
      visibility.mockRestore()
    }
  })

  it('ignores a wheel that only scrolls the page', async () => {
    const wrapper = mountCarousel({ autoplay: { delay: 1000 } })
    await nextTick()
    const viewport = wrapper.find('[tabindex="0"]')
    await viewport.trigger('wheel', { deltaY: 100 })
    expect(wrapper.emitted('update:playing')).toBeUndefined()
    await viewport.trigger('wheel', { deltaX: 100 })
    expect(lastEmit(wrapper, 'update:playing')).toEqual([false, expect.objectContaining({ reason: 'interaction' })])
  })

  it('does not rotate when the user prefers reduced motion', async () => {
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
      const wrapper = mountCarousel({ autoplay: { delay: 1000 } })
      await nextTick()
      expect(lastEmit(wrapper, 'update:playing')).toEqual([false, expect.objectContaining({ reason: 'reduced-motion' })])
      await vi.advanceTimersByTimeAsync(3000)
      expect(activeIndices(wrapper)).toEqual([0])
    }
    finally {
      window.matchMedia = matchMedia
    }
  })

  it('disables the rotation control without autoplay', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(CarouselRoot, { 'aria-label': 'Plain' }, () => h(CarouselViewport, () => h(CarouselContent, () => h(CarouselItem, () => 'One')))),
    }), { attachTo: document.body })
    await nextTick()
    expect(wrapper.find('[data-playing]').exists()).toBe(false)
    expect(wrapper.find('[aria-live]').attributes('aria-live')).toBe('polite')
  })
})

describe('given a Carousel with translated labels', () => {
  it('lets every attribute override the English default', async () => {
    const wrapper = mount(defineComponent({
      setup: () => () => h(CarouselRoot, { 'aria-label': 'Galerie', 'aria-roledescription': 'carrousel', 'autoplay': true }, {
        default: ({ playing }: { playing: boolean }) => [
          h(CarouselAutoplayToggle, { 'aria-label': playing ? 'Arrêter' : 'Démarrer' }),
          h(CarouselViewport, () => h(CarouselContent, () =>
            [1, 2].map(i => h(CarouselItem, { 'key': i, 'aria-roledescription': 'diapositive', 'aria-label': `${i} sur 2` }, () => `Slide ${i}`)))),
          h(CarouselPrevious, { 'aria-label': 'Précédente' }),
          h(CarouselNext, { 'aria-label': 'Suivante' }),
          h(CarouselIndicator, { 'index': 0, 'aria-label': 'Aller à 1' }),
        ],
      }),
    }), { attachTo: document.body })
    await nextTick()
    expect(wrapper.attributes('aria-roledescription')).toBe('carrousel')
    expect(wrapper.find('[data-state="playing"]').attributes('aria-label')).toBe('Arrêter')
    const item = wrapper.find('[data-index="0"]')
    expect(item.attributes('aria-roledescription')).toBe('diapositive')
    expect(item.attributes('aria-label')).toBe('1 sur 2')
    expect(wrapper.find('[aria-label="Précédente"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Suivante"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Aller à 1"]').exists()).toBe(true)
    await wrapper.find('[data-state="playing"]').trigger('click')
    expect(wrapper.find('[data-state="paused"]').attributes('aria-label')).toBe('Démarrer')
    wrapper.unmount()
  })
})

describe('given a Carousel whose slides change', () => {
  it('follows the DOM order when keyed slides are reordered or added', async () => {
    const slides = ref(['a', 'b', 'c'])
    const wrapper = mount(defineComponent({
      setup: () => () => h(CarouselRoot, { 'aria-label': 'Dynamic' }, () =>
        h(CarouselViewport, () => h(CarouselContent, () =>
          slides.value.map(id => h(CarouselItem, { 'key': id, 'data-id': id }, () => id))))),
    }), { attachTo: document.body })
    await nextTick()
    const order = () => wrapper.findAll('[data-index]').map(item => `${item.attributes('data-id')}:${item.attributes('aria-label')}`)
    expect(order()).toEqual(['a:1 of 3', 'b:2 of 3', 'c:3 of 3'])

    slides.value = ['c', 'a', 'b']
    await nextTick()
    await new Promise(resolve => setTimeout(resolve))
    expect(order()).toEqual(['c:1 of 3', 'a:2 of 3', 'b:3 of 3'])

    slides.value = ['c', 'a', 'b', 'd']
    await nextTick()
    await nextTick()
    expect(order()).toEqual(['c:1 of 4', 'a:2 of 4', 'b:3 of 4', 'd:4 of 4'])
    wrapper.unmount()
  })
})

describe('given a Carousel rendered on the server', () => {
  const Fixture = defineComponent({
    props: { fade: Boolean, defaultValue: Number },
    setup(props) {
      return () => h(CarouselRoot, { 'aria-label': 'Server', 'fade': props.fade, 'defaultValue': props.defaultValue }, () =>
        h(CarouselViewport, () => h(CarouselContent, () =>
          [1, 2, 3, 4].map(i => h(CarouselItem, { key: i }, () => `Slide ${i}`)))))
    },
  })

  it('renders a scrollable track with the current slide active', async () => {
    const html = await renderToString(createSSRApp(Fixture, { defaultValue: 2 }))
    expect(html).toContain('aria-roledescription="carousel"')
    expect(html).toContain('scroll-snap-type:x mandatory')
    expect(html).toContain('overflow-x:auto')
    expect(html.match(/data-active/g)).toHaveLength(1)
    expect(html).toMatch(/data-index="2"[^>]*data-active|data-active[^>]*data-index="2"/)
    // Starts on `defaultValue` before hydration where the browser supports it.
    expect(html).toContain('scroll-initial-target:nearest')
  })

  it('renders snapCount and the controls from itemCount', async () => {
    const WithControls = defineComponent({
      setup: () => () => h(CarouselRoot, { 'aria-label': 'Server', 'itemCount': 4, 'slidesToScroll': 2 }, {
        default: ({ snapCount }: { snapCount: number }) => [
          h(CarouselViewport, () => h(CarouselContent, () => [1, 2, 3, 4].map(i => h(CarouselItem, { key: i }, () => `Slide ${i}`)))),
          h(CarouselNext, () => 'Next'),
          ...Array.from({ length: snapCount }, (_, index) => h(CarouselIndicator, { key: index, index })),
        ],
      }),
    })
    const html = await renderToString(createSSRApp(WithControls))
    expect(html.match(/Go to slide/g)).toHaveLength(2)
    expect(html).not.toMatch(/aria-label="Next slide"[^>]*disabled/)

    const container = document.createElement('div')
    container.innerHTML = html
    document.body.innerHTML = ''
    document.body.append(container)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      createSSRApp(WithControls).mount(container)
      await nextTick()
      expect(warn.mock.calls.map(args => String(args[0])).filter(m => m.includes('Hydration'))).toEqual([])
      expect(container.querySelectorAll('[aria-label^="Go to slide"]')).toHaveLength(2)
    }
    finally {
      warn.mockRestore()
    }
  })

  it('hides the inactive slides with fade', async () => {
    const html = await renderToString(createSSRApp(Fixture, { fade: true }))
    expect(html.match(/inert/g)).toHaveLength(3)
    expect(html.match(/opacity:0/g)).toHaveLength(3)
  })

  it('hydrates without mismatches', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Fixture, { defaultValue: 1 }))
    document.body.innerHTML = ''
    document.body.append(container)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      createSSRApp(Fixture, { defaultValue: 1 }).mount(container)
      await nextTick()
      const messages = [...warn.mock.calls, ...error.mock.calls].map(args => String(args[0]))
      expect(messages.filter(m => m.includes('Hydration'))).toEqual([])
      // Labels arrive once the total is known.
      expect(container.querySelector('[data-index="1"]')?.getAttribute('aria-label')).toBe('2 of 4')
    }
    finally {
      warn.mockRestore()
      error.mockRestore()
    }
  })

  const FullFixture = defineComponent({
    props: { options: { type: Object, default: () => ({}) } },
    setup(props) {
      return () => h(CarouselRoot, { 'aria-label': 'Hydration', ...props.options }, {
        default: ({ snapCount }: { snapCount: number }) => [
          h(CarouselAutoplayToggle, () => 'Toggle'),
          h(CarouselViewport, () => h(CarouselContent, () =>
            [1, 2, 3, 4, 5].map(i => h(CarouselItem, { key: i }, () => `Slide ${i}`)))),
          h(CarouselPrevious, () => 'Prev'),
          h(CarouselNext, () => 'Next'),
          ...Array.from({ length: snapCount }, (_, index) => h(CarouselIndicator, { key: index, index })),
        ],
      })
    },
  })

  it.each([
    {},
    { defaultValue: 3 },
    { loop: true },
    { fade: true, defaultValue: 2 },
    { orientation: 'vertical' },
    { dir: 'rtl' },
    { align: 'center', slidesToScroll: 2, defaultValue: 1 },
    { slidesToScroll: 'auto', containScroll: false },
    { autoHeight: true, draggable: false },
    { autoplay: { delay: 1000 } },
    { autoScroll: true, loop: true },
    { itemCount: 5, defaultValue: 4 },
    { itemCount: 5, loop: true, fade: true, slidesToScroll: 2 },
  ])('hydrates %j without mismatches', async (options) => {
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(FullFixture, { options }))
    const serverHtml = container.innerHTML
    document.body.innerHTML = ''
    document.body.append(container)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const app = createSSRApp(FullFixture, { options })
      app.mount(container)
      await nextTick()
      const messages = [...warn.mock.calls, ...error.mock.calls].map(args => String(args[0]))
      expect(messages.filter(m => /hydrat|mismatch/i.test(m))).toEqual([])
      // The slides are the server's elements, not re-created ones.
      expect(serverHtml).toContain('aria-roledescription="slide"')
      expect(container.querySelectorAll('[aria-roledescription="slide"]')).toHaveLength(5)
      expect(container.querySelector('[data-index="0"]')?.getAttribute('aria-label')).toBe('1 of 5')
      app.unmount()
    }
    finally {
      warn.mockRestore()
      error.mockRestore()
    }
  })
})
