import type { Component, VNodeChild } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { CalendarCell, CalendarCellTrigger, CalendarGrid, CalendarGridBody, CalendarGridHead, CalendarGridRow, CalendarHeadCell, CalendarHeader, CalendarHeading, CalendarNext, CalendarPrev, CalendarRoot, CalendarView, CalendarViewTrigger } from '@/Calendar'
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from '@/ColorArea'
import { ColorFieldInput, ColorFieldRoot } from '@/ColorField'
import { ColorSwatch } from '@/ColorSwatch'
import { DateFieldInput, DateFieldRoot } from '@/DateField'
import { DateRangeFieldInput, DateRangeFieldRoot } from '@/DateRangeField'
import { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from '@/NumberField'
import { PaginationEllipsis, PaginationFirst, PaginationLast, PaginationList, PaginationListItem, PaginationNext, PaginationPrev, PaginationRoot } from '@/Pagination'
import { PinInputInput, PinInputRoot } from '@/PinInput'
import { RangeCalendarCell, RangeCalendarCellTrigger, RangeCalendarGrid, RangeCalendarGridBody, RangeCalendarGridHead, RangeCalendarGridRow, RangeCalendarHeadCell, RangeCalendarHeader, RangeCalendarHeading, RangeCalendarNext, RangeCalendarPrev, RangeCalendarRoot, RangeCalendarView, RangeCalendarViewTrigger } from '@/RangeCalendar'
import { RatingItem, RatingItemIndicator, RatingRoot } from '@/Rating'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '@/Slider'
import { componentNames } from '@/test'
import { TimeFieldInput, TimeFieldRoot } from '@/TimeField'
import { TimeRangeFieldInput, TimeRangeFieldRoot } from '@/TimeRangeField'

// One component per part in the dates, color and numeric families: the tree
// holds no `Primitive`, no `Slot` (nothing here uses `asChild`) and no
// collection wrapper. A part built on another part (RatingItemIndicator on
// RadioGroupItem) is two parts, each one instance.
const WRAPPERS = new Set(['Primitive', 'PrimitiveSlot', 'CollectionSlot', 'CollectionItem'])

const date = new Temporal.PlainDate(2024, 3, 15)
const end = new Temporal.PlainDate(2024, 3, 18)
const time = new Temporal.PlainTime(9, 30)

const segments = (Part: Component, list: { part: string, value: string }[], extra = {}) => list.map(s => h(Part as any, { key: s.part, part: s.part, ...extra }, () => s.value))

const compositions: Record<string, () => VNodeChild> = {
  Calendar: () => h(CalendarRoot, { locale: 'en-US', defaultValue: date }, () => [
    h(CalendarHeader, () => [h(CalendarPrev), h(CalendarHeading), h(CalendarViewTrigger), h(CalendarNext)]),
    h(CalendarView, { view: 'day' }, () => h(CalendarGrid, () => [
      h(CalendarGridHead, () => h(CalendarGridRow, () => h(CalendarHeadCell, () => 'Mo'))),
      h(CalendarGridBody, () => h(CalendarGridRow, () => h(CalendarCell, { value: date }, () => h(CalendarCellTrigger, { value: date })))),
    ])),
  ]),
  RangeCalendar: () => h(RangeCalendarRoot, { locale: 'en-US', defaultValue: { start: date, end } }, () => [
    h(RangeCalendarHeader, () => [h(RangeCalendarPrev), h(RangeCalendarHeading), h(RangeCalendarViewTrigger), h(RangeCalendarNext)]),
    h(RangeCalendarView, { view: 'day' }, () => h(RangeCalendarGrid, () => [
      h(RangeCalendarGridHead, () => h(RangeCalendarGridRow, () => h(RangeCalendarHeadCell, () => 'Mo'))),
      h(RangeCalendarGridBody, () => h(RangeCalendarGridRow, () => h(RangeCalendarCell, { value: date }, () => h(RangeCalendarCellTrigger, { value: date })))),
    ])),
  ]),
  DateField: () => h(DateFieldRoot, { locale: 'en-US', defaultValue: date, name: 'd' }, { default: ({ segments: s }: any) => segments(DateFieldInput, s) }),
  DateRangeField: () => h(DateRangeFieldRoot, { locale: 'en-US', defaultValue: { start: date, end } }, { default: ({ segments: s }: any) => segments(DateRangeFieldInput, s.start, { type: 'start' }) }),
  TimeField: () => h(TimeFieldRoot, { locale: 'en-US', defaultValue: time }, { default: ({ segments: s }: any) => segments(TimeFieldInput, s) }),
  TimeRangeField: () => h(TimeRangeFieldRoot, { locale: 'en-US', defaultValue: { start: time, end: time } }, { default: ({ segments: s }: any) => segments(TimeRangeFieldInput, s.start, { type: 'start' }) }),
  ColorArea: () => h(ColorAreaRoot, { defaultValue: '#336699' }, () => h(ColorAreaArea, () => h(ColorAreaThumb))),
  ColorField: () => h(ColorFieldRoot, { defaultValue: '#336699' }, () => h(ColorFieldInput)),
  ColorSwatch: () => h(ColorSwatch, { color: '#336699' }),
  NumberField: () => h(NumberFieldRoot, { defaultValue: 5, locale: 'en-US' }, () => [h(NumberFieldDecrement, () => '-'), h(NumberFieldInput), h(NumberFieldIncrement, () => '+')]),
  PinInput: () => h(PinInputRoot, () => h(PinInputInput, { index: 0 })),
  Rating: () => h(RatingRoot, { defaultValue: 2 }, { default: ({ items }: any) => items.slice(0, 1).map((item: number) => h(RatingItem, { key: item, item }, { default: ({ steps }: any) => steps.slice(0, 1).map((step: number) => h(RatingItemIndicator, { key: step, step }, () => '*')) })) }),
  Slider: () => h(SliderRoot, { defaultValue: [20] }, () => [h(SliderTrack, () => h(SliderRange)), h(SliderThumb)]),
  Pagination: () => h(PaginationRoot, { total: 100, itemsPerPage: 10 }, () => h(PaginationList, () => [h(PaginationFirst), h(PaginationPrev), h(PaginationListItem, { value: 1 }), h(PaginationEllipsis), h(PaginationNext), h(PaginationLast)])),
}

function mountAll(render: () => VNodeChild) {
  return mount(defineComponent({ setup: () => render }), { attachTo: document.body })
}

const originals = {
  setPointerCapture: Element.prototype.setPointerCapture,
  hasPointerCapture: Element.prototype.hasPointerCapture,
  releasePointerCapture: Element.prototype.releasePointerCapture,
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

afterEach(() => {
  document.body.innerHTML = ''
  Element.prototype.setPointerCapture = originals.setPointerCapture
  Element.prototype.hasPointerCapture = originals.hasPointerCapture
  Element.prototype.releasePointerCapture = originals.releasePointerCapture
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('one component per part: dates, color and numeric', () => {
  for (const [name, render] of Object.entries(compositions)) {
    it(`${name} renders no wrapper`, () => {
      const wrapper = mountAll(render)
      const names = componentNames(wrapper.vm.$)
      expect(names.length).toBeGreaterThan(0)
      // Rating's only slot: `RadioGroupIndicator as-child` merges the indicator's attrs into the
      // consumer's child, which is the part's DOM contract rather than a wrapper.
      expect(names.filter(n => WRAPPERS.has(n))).toEqual(name === 'Rating' ? ['PrimitiveSlot'] : [])
      wrapper.unmount()
    })
  }
})

describe('parts rendered from a render function keep `#render`', () => {
  const parts: [string, () => VNodeChild][] = [
    ['CalendarCell', () => h(CalendarRoot, { locale: 'en-US', defaultValue: date }, () => h(CalendarCell, { value: date, class: 'mine' }, { render: renderSlot }))],
    ['CalendarGridRow', () => h(CalendarRoot, { locale: 'en-US', defaultValue: date }, () => h(CalendarGridRow, { class: 'mine' }, { render: renderSlot }))],
    ['CalendarHeadCell', () => h(CalendarRoot, { locale: 'en-US', defaultValue: date }, () => h(CalendarHeadCell, { class: 'mine' }, { render: renderSlot }))],
    ['RangeCalendarCell', () => h(RangeCalendarRoot, { locale: 'en-US', defaultValue: { start: date, end } }, () => h(RangeCalendarCell, { value: date, class: 'mine' }, { render: renderSlot }))],
    ['DateFieldInput', () => h(DateFieldRoot, { locale: 'en-US', defaultValue: date }, () => h(DateFieldInput, { part: 'day', class: 'mine' }, { render: renderSlot }))],
    ['TimeFieldInput', () => h(TimeFieldRoot, { locale: 'en-US', defaultValue: time }, () => h(TimeFieldInput, { part: 'hour', class: 'mine' }, { render: renderSlot }))],
  ]

  function renderSlot({ props, forwardRef }: any) {
    return h('aside', { ...props, 'ref': forwardRef, 'data-rendered': '' })
  }

  it.each(parts)('%s', (_, render) => {
    const wrapper = mountAll(render)
    const rendered = document.querySelector('[data-rendered]')!
    expect(rendered.tagName).toBe('ASIDE')
    expect(rendered.classList.contains('mine')).toBe(true)
    expect(componentNames(wrapper.vm.$)).toContain('Primitive')
    wrapper.unmount()
  })
})

describe('slider thumb without the collection wrapper', () => {
  function thumbProps(attrs: Record<string, unknown>) {
    return mountAll(() => h(SliderRoot, { defaultValue: [20] }, () => h(SliderThumb, attrs)))
  }

  it('renders the item attribute first, and a consumer\'s wins', () => {
    const plain = thumbProps({})
    const thumb = document.querySelector('[role="slider"]')!
    expect(thumb.getAttributeNames()[0]).toBe('data-reka-collection-item')
    plain.unmount()

    const wrapper = thumbProps({ 'data-reka-collection-item': 'mine' })
    expect(document.querySelector('[role="slider"]')!.getAttribute('data-reka-collection-item')).toBe('mine')
    wrapper.unmount()
  })

  it('runs a `.once` listener once and a plain one every time', async () => {
    const log: string[] = []
    const wrapper = thumbProps({
      onKeydown: () => log.push('keydown'),
      onKeydownOnce: () => log.push('once'),
    })
    const thumb = document.querySelector<HTMLElement>('[role="slider"]')!
    await new Promise(resolve => setTimeout(resolve, 3))
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    await nextTick()
    expect(log).toEqual(['keydown', 'once', 'keydown'])
    wrapper.unmount()
  })
})

describe('slider root and thumb render their own element', () => {
  const dispatchedAfterAttach = () => new Promise(resolve => setTimeout(resolve, 3))

  function pointerEvent(type: string, clientX: number, clientY: number) {
    return Object.assign(new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY }), { pointerId: 1 })
  }

  beforeEach(() => {
    const captured = new WeakSet<Element>()
    Element.prototype.setPointerCapture = function () {
      captured.add(this)
    }
    Element.prototype.hasPointerCapture = function () {
      return captured.has(this)
    }
    Element.prototype.releasePointerCapture = function () {
      captured.delete(this)
    }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 100 } as DOMRect)
  })

  function mountSlider(rootProps: Record<string, unknown>, thumbAttrs: () => Record<string, unknown> = () => ({})) {
    return mountAll(() => h(SliderRoot as any, { thumbAlignment: 'overflow', defaultValue: [20], ...rootProps }, () => h(SliderThumb as any, thumbAttrs())))
  }

  const root = () => document.querySelector<HTMLElement>('[data-slider-impl]')!

  it('is one instance per part', () => {
    const wrapper = mountSlider({})
    const names = componentNames(wrapper.vm.$)
    expect(names.filter(n => n.startsWith('Slider'))).toEqual(['SliderRoot', 'SliderThumb'])
    wrapper.unmount()
  })

  it.each([
    ['horizontal', 'ltr', 30, 30],
    ['horizontal', 'rtl', 30, 70],
    ['vertical', 'ltr', 30, 70],
  ])('maps a %s %s pointer at %i to %i', async (orientation, dir, at, value) => {
    const onUpdate = vi.fn()
    const wrapper = mountSlider({ orientation, dir, 'onUpdate:modelValue': onUpdate })
    await dispatchedAfterAttach()
    root().dispatchEvent(pointerEvent('pointerdown', at, at))
    expect(onUpdate.mock.calls[0][0]).toEqual([value])
    wrapper.unmount()
  })

  it('tells a consumer about slide events before the slider acts, `.once` last', async () => {
    const log: string[] = []
    const wrapper = mountSlider({
      'onSlideStart': (value: number, event: Event) => log.push(`start ${value} ${event.type}`),
      'onSlideStartOnce': () => log.push('start once'),
      'onUpdate:modelValue': () => log.push('model'),
      'onPointerdown': () => log.push('pointerdown'),
    })
    await dispatchedAfterAttach()
    root().dispatchEvent(pointerEvent('pointerdown', 30, 0))
    expect(log).toEqual(['start 30 pointerdown', 'model', 'start once', 'pointerdown'])
    wrapper.unmount()
  })

  it('keeps slide listeners off the element', async () => {
    const listener = vi.fn()
    const wrapper = mountSlider({ onSlideStart: listener, onSlideMove: listener, onSlideEnd: listener })
    await dispatchedAfterAttach()
    for (const type of ['slide-start', 'slide-move', 'slide-end'])
      root().dispatchEvent(new Event(type))
    expect(listener).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('measures the track again for the next drag', async () => {
    const onUpdate = vi.fn()
    const wrapper = mountSlider({ 'onUpdate:modelValue': onUpdate })
    await dispatchedAfterAttach()
    root().dispatchEvent(pointerEvent('pointerdown', 30, 0))
    root().dispatchEvent(pointerEvent('pointerup', 30, 0))
    vi.mocked(Element.prototype.getBoundingClientRect).mockReturnValue({ left: 100, top: 0, width: 100, height: 100 } as DOMRect)
    root().dispatchEvent(pointerEvent('pointerdown', 150, 0))
    expect(onUpdate.mock.lastCall![0]).toEqual([50])
    wrapper.unmount()
  })

  it('measures the track again after an orientation switch mid-drag', async () => {
    const onUpdate = vi.fn()
    const orientation = ref('horizontal')
    const wrapper = mountAll(() => h(SliderRoot as any, { 'thumbAlignment': 'overflow', 'defaultValue': [20], 'orientation': orientation.value, 'onUpdate:modelValue': onUpdate }, () => h(SliderThumb)))
    await dispatchedAfterAttach()
    root().dispatchEvent(pointerEvent('pointerdown', 30, 0))
    orientation.value = 'vertical'
    await nextTick()
    await dispatchedAfterAttach()
    vi.mocked(Element.prototype.getBoundingClientRect).mockReturnValue({ left: 0, top: 100, width: 100, height: 100 } as DOMRect)
    root().dispatchEvent(pointerEvent('pointerdown', 0, 130))
    expect(onUpdate.mock.lastCall![0]).toEqual([70])
    wrapper.unmount()
  })

  it('remounts on an orientation switch, where a `.once` listener runs again', async () => {
    const once = vi.fn()
    const orientation = ref('horizontal')
    const wrapper = mountAll(() => h(SliderRoot as any, { thumbAlignment: 'overflow', orientation: orientation.value, onSlideStartOnce: once }, () => h(SliderThumb)))
    await dispatchedAfterAttach()
    const before = root()
    before.dispatchEvent(pointerEvent('pointerdown', 30, 0))
    before.dispatchEvent(pointerEvent('pointerup', 30, 0))
    before.dispatchEvent(pointerEvent('pointerdown', 40, 0))
    expect(once).toHaveBeenCalledTimes(1)

    orientation.value = 'vertical'
    await nextTick()
    expect(root()).not.toBe(before)
    expect(root().getAttribute('data-orientation')).toBe('vertical')
    await dispatchedAfterAttach()
    root().dispatchEvent(pointerEvent('pointerdown', 0, 30))
    expect(once).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('keeps sliding when a slide listener fails, before and after an orientation switch', async () => {
    const errors: string[] = []
    const onUpdate = vi.fn()
    const orientation = ref('horizontal')
    const wrapper = mount(defineComponent({
      setup: () => () => h(SliderRoot as any, {
        'thumbAlignment': 'overflow',
        'orientation': orientation.value,
        'onUpdate:modelValue': onUpdate,
        'onSlideStart': () => {
          throw new Error('boom')
        },
      }, () => h(SliderThumb)),
    }), {
      attachTo: document.body,
      global: { config: { errorHandler: error => errors.push((error as Error).message) } },
    })
    await dispatchedAfterAttach()
    root().dispatchEvent(pointerEvent('pointerdown', 30, 0))
    root().dispatchEvent(pointerEvent('pointerup', 30, 0))
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(errors).toEqual(['boom'])

    orientation.value = 'vertical'
    await nextTick()
    await dispatchedAfterAttach()
    root().dispatchEvent(pointerEvent('pointerdown', 0, 30))
    expect(onUpdate).toHaveBeenCalledTimes(2)
    expect(errors).toEqual(['boom', 'boom'])
    wrapper.unmount()
  })

  it.each([
    ['contain', 'mid-drag', ['pointermove', 'pointerup']],
    ['overflow', 'on a new press', ['pointerdown', 'pointermove', 'pointerup']],
  ])('stays silent once removed, with %s thumbs, %s', async (thumbAlignment, _, events) => {
    const errors: string[] = []
    const log: string[] = []
    const wrapper = mount(defineComponent({
      setup: () => () => h(SliderRoot as any, {
        thumbAlignment,
        'defaultValue': [20],
        'onUpdate:modelValue': () => log.push('model'),
        'onSlideStart': () => log.push('start'),
        'onSlideMove': () => log.push('move'),
        'onSlideEnd': () => log.push('end'),
      }, () => h(SliderThumb)),
    }), {
      attachTo: document.body,
      global: { config: { errorHandler: error => errors.push((error as Error).message) } },
    })
    await dispatchedAfterAttach()
    const element = root()
    if (events[0] === 'pointermove')
      element.dispatchEvent(pointerEvent('pointerdown', 30, 0))
    wrapper.unmount()
    log.length = 0

    for (const type of events)
      element.dispatchEvent(pointerEvent(type, 40, 0))
    expect(errors).toEqual([])
    expect(log).toEqual([])
  })

  it('reads a consumer `index` as the thumb\'s position, and keeps it off the element', async () => {
    const index = ref(1)
    const wrapper = mountAll(() => h(SliderRoot as any, { defaultValue: [20, 60] }, () => h(SliderThumb as any, { index: index.value })))
    await nextTick()
    const thumb = document.querySelector('[role="slider"]')!
    expect(thumb.getAttribute('aria-valuenow')).toBe('60')
    expect(thumb.hasAttribute('index')).toBe(false)
    index.value = 0
    await nextTick()
    expect(thumb.getAttribute('aria-valuenow')).toBe('20')
    wrapper.unmount()
  })

  it('lets a consumer override the root\'s fallback attributes, not its own state', async () => {
    const wrapper = mountSlider({ 'disabled': true, 'data-slider-impl': 'mine', 'data-orientation': 'mine', 'aria-disabled': 'mine' })
    await nextTick()
    const element = document.querySelector('[data-slider-impl="mine"]')!
    expect(element.getAttribute('data-orientation')).toBe('mine')
    expect(element.getAttribute('aria-disabled')).toBe('true')
    wrapper.unmount()
  })
})

describe('parts that default to an input', () => {
  const parts: [string, Component, Component, Record<string, unknown>][] = [
    ['NumberFieldInput', NumberFieldRoot, NumberFieldInput, {}],
    ['ColorFieldInput', ColorFieldRoot, ColorFieldInput, {}],
    ['PinInputInput', PinInputRoot, PinInputInput, { index: 0 }],
  ]

  it.each(parts)('%s renders no children as an input, and its slot as anything else', (_, Root, Part, props) => {
    const input = mountAll(() => h(Root as any, () => h(Part as any, { ...props, class: 'part' }, () => h('b', 'child'))))
    expect(document.querySelector('input.part')).not.toBeNull()
    expect(document.querySelector('input.part b')).toBeNull()
    expect(document.querySelector('b')).toBeNull()
    input.unmount()

    const div = mountAll(() => h(Root as any, () => h(Part as any, { ...props, as: 'div', class: 'part' }, () => h('b', 'child'))))
    expect(document.querySelector('div.part b')).not.toBeNull()
    div.unmount()
  })
})
