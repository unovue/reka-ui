import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import type { Ref } from 'vue'
import type { SliderChangeReason } from './useSlider'
import type { ChangeEventDetails } from '@/shared'
import { fireEvent } from '@testing-library/vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref, Suspense, Transition } from 'vue'
import { handleSubmit } from '@/test'
import { SliderRoot, SliderThumb, SliderTrack } from '.'
import Slider from './story/_Slider.vue'

// jsdom lacks ResizeObserver and pointer capture; every block below relies on these.
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.HTMLElement.prototype.scrollIntoView = vi.fn()
window.HTMLElement.prototype.hasPointerCapture = vi.fn().mockImplementation(id => id)
window.HTMLElement.prototype.releasePointerCapture = vi.fn()
window.HTMLElement.prototype.setPointerCapture = vi.fn()

it.each([
  { min: 0.5, step: 1, next: 1.5 },
  { min: -0.025, step: 0.1, next: 0.075 },
  { min: 1.5e-7, step: 1e-6, next: 1.15e-6 },
  { min: 0, step: 2.5e-7, next: 2.5e-7 },
  { min: 0, step: Number.MIN_VALUE, next: Number.MIN_VALUE },
])('keeps steps relative to min=$min with step=$step', async ({ min, step, next }) => {
  const wrapper = mount(SliderRoot, {
    props: { min, step, defaultValue: [min] },
    slots: { default: () => h(SliderThumb) },
  })
  const thumb = wrapper.get('[role="slider"]')
  await thumb.trigger('keydown', { key: 'ArrowRight' })
  expect(wrapper.emitted('valueCommit')).toEqual([[[next]]])
  expect(thumb.attributes('aria-valuenow')).toBe(String(next))
})

it.each([
  { defaultValue: [50], clientX: 85, min: 0, max: 60, expected: [60] },
  { defaultValue: [50], clientX: 15, min: 40, max: 100, expected: [40] },
  { defaultValue: [50], clientX: 45, min: 20, max: 60, expected: [45] },
  { defaultValue: [20, 80], clientX: 85, min: 40, max: 60, expected: [40, 60] },
])('commits $expected when the bounds change to [$min, $max] during a drag', async ({ defaultValue, clientX, min, max, expected }) => {
  const wrapper = mount(SliderRoot, {
    props: { defaultValue, thumbAlignment: 'overflow' },
    slots: { default: () => defaultValue.map((_, key) => h(SliderThumb, { key })) },
  })
  const slider = wrapper.get('[data-slider-impl]').element
  vi.spyOn(slider, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 20))

  await fireEvent.pointerDown(slider, { clientX: defaultValue.at(-1)!, pointerId: 1 })
  await fireEvent.pointerMove(slider, { clientX, pointerId: 1 })
  await wrapper.setProps({ min, max })
  await fireEvent.pointerUp(slider, { pointerId: 1 })

  expect(wrapper.emitted('valueCommit')).toEqual([[expected]])
})

describe('bounds changing during a drag', () => {
  function mountDragged(props: Record<string, unknown> = {}) {
    const defaultValue = (props.defaultValue as number[] | undefined) ?? [50]
    const wrapper = mount(SliderRoot, {
      props: { defaultValue, thumbAlignment: 'overflow', ...props },
      slots: { default: () => defaultValue.map((_, key) => h(SliderThumb, { key })) },
    })
    const slider = wrapper.get('[data-slider-impl]').element
    vi.spyOn(slider, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 20))
    const values = () => wrapper.findAll('[role="slider"]').map(thumb => Number(thumb.attributes('aria-valuenow')))
    return { wrapper, slider, values }
  }

  it.each([
    { defaultValue: [50], clientX: 85, min: 0, max: 60, expected: [60] },
    { defaultValue: [50], clientX: 15, min: 40, max: 100, expected: [40] },
    { defaultValue: [20, 80], clientX: 85, min: 40, max: 60, expected: [40, 60] },
  ])('moves the model into [$min, $max] before the pointer is released', async ({ defaultValue, clientX, min, max, expected }) => {
    const { wrapper, slider, values } = mountDragged({ defaultValue })

    await fireEvent.pointerDown(slider, { clientX: defaultValue.at(-1)!, pointerId: 1 })
    await fireEvent.pointerMove(slider, { clientX, pointerId: 1 })
    await wrapper.setProps({ min, max })

    expect(values()).toEqual(expected)
    expect(wrapper.emitted<[number[], { reason: string }]>('update:modelValue')!.at(-1)).toEqual([expected, expect.objectContaining({ reason: 'drag' })])

    await fireEvent.pointerUp(slider, { pointerId: 1 })
    expect(wrapper.emitted('valueCommit')).toEqual([[expected]])
    expect(values()).toEqual(expected)
  })

  it('keeps every emitted value in range as the drag continues', async () => {
    const { wrapper, slider } = mountDragged({ defaultValue: [20, 80] })

    await fireEvent.pointerDown(slider, { clientX: 20, pointerId: 1 })
    await fireEvent.pointerMove(slider, { clientX: 30, pointerId: 1 })
    await wrapper.setProps({ max: 60 })
    // 40px of a 0..60 track
    await fireEvent.pointerMove(slider, { clientX: 40, pointerId: 1 })
    await fireEvent.pointerUp(slider, { pointerId: 1 })

    const emitted = wrapper.emitted<[number[]]>('update:modelValue')!.map(([value]) => value)
    expect(emitted).toEqual([[30, 80], [30, 60], [24, 60]])
    expect(wrapper.emitted('valueCommit')).toEqual([[[24, 60]]])
  })

  it('brings a value left out of range while idle into range once a drag moves a thumb', async () => {
    const { wrapper, slider, values } = mountDragged({ defaultValue: [20, 80] })
    await wrapper.setProps({ max: 60 })
    expect(values()).toEqual([20, 80])

    // 10px of a 0..60 track: thumb 0 moves to 6
    await fireEvent.pointerDown(slider, { clientX: 10, pointerId: 1 })
    await fireEvent.pointerUp(slider, { pointerId: 1 })

    expect(values()).toEqual([6, 60])
    expect(wrapper.emitted<[number[]]>('update:modelValue')!.map(([value]) => value)).toEqual([[6, 60]])
  })

  it('moves the model into range when the drag started on a thumb and has not moved yet', async () => {
    const { wrapper, values } = mountDragged({ defaultValue: [80] })

    await fireEvent.pointerDown(wrapper.get('[role="slider"]').element, { clientX: 80, pointerId: 1 })
    await wrapper.setProps({ max: 60 })

    expect(values()).toEqual([60])
  })

  it('commits when the bounds move a thumb that was not dragged', async () => {
    const { wrapper, values } = mountDragged({ defaultValue: [20, 80] })

    const thumbs = wrapper.findAll('[role="slider"]')
    await fireEvent.pointerDown(thumbs[0].element, { clientX: 20, pointerId: 1 })
    await wrapper.setProps({ max: 60 })
    await fireEvent.pointerUp(thumbs[0].element, { pointerId: 1 })

    expect(values()).toEqual([20, 60])
    expect(wrapper.emitted('valueCommit')).toEqual([[[20, 60]]])
  })

  it('commits a move into range that a controlled parent has not rendered yet', async () => {
    const wrapper = mount(SliderRoot, {
      props: { modelValue: [85], thumbAlignment: 'overflow' },
      slots: { default: () => h(SliderThumb) },
    })
    const thumb = wrapper.get('[role="slider"]').element
    await fireEvent.pointerDown(thumb, { clientX: 85, pointerId: 1 })
    // The bounds change and the release land in one tick; the parent never writes back.
    wrapper.setProps({ max: 60 })
    await nextTick()
    await fireEvent.pointerUp(thumb, { pointerId: 1 })

    expect(wrapper.emitted('valueCommit')).toEqual([[[60]]])
  })

  it('leaves a value set out of range while idle alone on a press that moves nothing', async () => {
    const { wrapper, values } = mountDragged({ defaultValue: [80] })
    await wrapper.setProps({ max: 60 })

    const thumb = wrapper.get('[role="slider"]').element
    await fireEvent.pointerDown(thumb, { clientX: 80, pointerId: 1 })
    await fireEvent.pointerUp(thumb, { pointerId: 1 })

    expect(values()).toEqual([80])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('valueCommit')).toBeUndefined()
  })

  it('leaves the model alone when the bounds change after the slider is disabled mid-drag', async () => {
    const { wrapper, slider, values } = mountDragged()

    await fireEvent.pointerDown(slider, { clientX: 50, pointerId: 1 })
    await fireEvent.pointerMove(slider, { clientX: 85, pointerId: 1 })
    await wrapper.setProps({ disabled: true })
    await wrapper.setProps({ max: 60 })

    expect(values()).toEqual([85])
    expect(wrapper.emitted<[number[]]>('update:modelValue')!.map(([value]) => value)).toEqual([[85]])
  })

  it('lets beforeUpdate cancel the move into range', async () => {
    const onBeforeUpdate = vi.fn((_value: number[], details: ChangeEventDetails<SliderChangeReason>) => details.cancel())
    const { wrapper, slider, values } = mountDragged()

    await fireEvent.pointerDown(slider, { clientX: 50, pointerId: 1 })
    await fireEvent.pointerMove(slider, { clientX: 85, pointerId: 1 })
    await wrapper.setProps({ 'onBeforeUpdate:modelValue': onBeforeUpdate, 'max': 60 })

    expect(onBeforeUpdate).toHaveBeenCalledWith([60], expect.objectContaining({ reason: 'drag' }))
    expect(values()).toEqual([85])
  })

  it('leaves the model alone when the bounds change outside a drag', async () => {
    const { wrapper, slider, values } = mountDragged({ defaultValue: [85] })

    await wrapper.setProps({ max: 60 })
    expect(values()).toEqual([85])

    // 50px of a 0..60 track
    await fireEvent.pointerDown(slider, { clientX: 50, pointerId: 1 })
    await fireEvent.pointerUp(slider, { pointerId: 1 })
    expect(values()).toEqual([30])
    await wrapper.setProps({ max: 20 })

    expect(values()).toEqual([30])
    expect(wrapper.emitted<[number[]]>('update:modelValue')!.map(([value]) => value)).toEqual([[30]])
  })
})

describe('given default Slider', () => {
  let wrapper: VueWrapper<InstanceType<typeof Slider>>

  beforeEach(() => {
    wrapper = mount(Slider, { props: { disabled: false } })
  })

  it('should pass axe accessibility tests', async () => {
    wrapper = mount(Slider)
    expect(await axe(wrapper.element, {
      rules: {
        'label': { enabled: false },
        'nested-interactive': { enabled: false },
      },
    })).toHaveNoViolations()
  })

  it('should have default value', () => {
    expect(wrapper.html()).toContain('aria-valuenow="50"')
  })

  it('should not mark the thumb as disabled', () => {
    expect(wrapper.find('[role="slider"]').attributes('aria-disabled')).toBeUndefined()
  })

  describe('when disabled', () => {
    beforeEach(async () => {
      await wrapper.setProps({ disabled: true })
    })

    it('should disable the thumb', () => {
      const thumb = wrapper.find('[role="slider"]')
      expect(thumb.attributes('data-disabled')).toBe('')
      expect(thumb.attributes('aria-disabled')).toBe('true')
      expect(thumb.attributes('aria-valuemin')).toBe('0')
      expect(thumb.attributes('aria-valuemax')).toBe('100')
      expect(thumb.attributes('aria-valuenow')).toBe('50')
      expect(wrapper.html()).toContain('aria-valuenow="50"')
    })
  })

  describe('when inverted', () => {
    beforeEach(async () => {
      await wrapper.setProps({ inverted: true })
    })

    describe('after pressing navigation key', () => {
      let slider: DOMWrapper<HTMLElement>

      beforeEach(() => {
        slider = wrapper.find('[role="slider"]')
      })

      it('arrowRight should decrease by 1', async () => {
        const currentValue = slider.attributes('aria-valuenow')
        await slider.trigger('keydown', { key: 'ArrowRight' })
        const newValue = slider.attributes('aria-valuenow')
        const diff = Number(newValue) - Number(currentValue)
        expect(slider.attributes('aria-valuenow')).toBe('49')
        expect(diff).toBe(-1)
      })

      it('arrowLeft should increase by 1', async () => {
        const currentValue = slider.attributes('aria-valuenow')
        await slider.trigger('keydown', { key: 'ArrowLeft' })
        const newValue = slider.attributes('aria-valuenow')
        const diff = Number(newValue) - Number(currentValue)
        expect(slider.attributes('aria-valuenow')).toBe('51')
        expect(diff).toBe(1)
      })

      it('arrowUp should increase by 1', async () => {
        const currentValue = slider.attributes('aria-valuenow')
        await slider.trigger('keydown', { key: 'ArrowUp' })
        const newValue = slider.attributes('aria-valuenow')
        const diff = Number(newValue) - Number(currentValue)
        expect(slider.attributes('aria-valuenow')).toBe('51')
        expect(diff).toBe(1)
      })

      it('arrowDown should decrease by 1', async () => {
        const currentValue = slider.attributes('aria-valuenow')
        await slider.trigger('keydown', { key: 'ArrowDown' })
        const newValue = slider.attributes('aria-valuenow')
        const diff = Number(newValue) - Number(currentValue)
        expect(slider.attributes('aria-valuenow')).toBe('49')
        expect(diff).toBe(-1)
      })

      it('pageUp should increase by 10', async () => {
        const currentValue = slider.attributes('aria-valuenow')
        await slider.trigger('keydown', { key: 'PageUp' })
        const newValue = slider.attributes('aria-valuenow')
        const diff = Number(newValue) - Number(currentValue)
        expect(slider.attributes('aria-valuenow')).toBe('60')
        expect(diff).toBe(10)
      })

      it('pageDown should decrease by 10', async () => {
        const currentValue = slider.attributes('aria-valuenow')
        await slider.trigger('keydown', { key: 'PageDown' })
        const newValue = slider.attributes('aria-valuenow')
        const diff = Number(newValue) - Number(currentValue)
        expect(slider.attributes('aria-valuenow')).toBe('40')
        expect(diff).toBe(-10)
      })

      it('home should set value to 0', async () => {
        await slider.trigger('keydown', { key: 'Home' })
        expect(slider.attributes('aria-valuenow')).toBe('0')
      })

      it('end should set value to max', async () => {
        await slider.trigger('keydown', { key: 'End' })
        expect(slider.attributes('aria-valuenow')).toBe('100')
      })
    })
  })

  describe('when vertical', () => {
    beforeEach(async () => {
      await wrapper.setProps({ orientation: 'vertical' })
    })

    describe('when inverted', () => {
      beforeEach(async () => {
        await wrapper.setProps({ inverted: true })
      })

      describe('after pressing navigation key', () => {
        let slider: DOMWrapper<HTMLElement>

        beforeEach(() => {
          slider = wrapper.find('[role="slider"]')
        })

        it('arrowRight should increase by 1', async () => {
          const currentValue = slider.attributes('aria-valuenow')
          await slider.trigger('keydown', { key: 'ArrowRight' })
          const newValue = slider.attributes('aria-valuenow')
          const diff = Number(newValue) - Number(currentValue)
          expect(slider.attributes('aria-valuenow')).toBe('51')
          expect(diff).toBe(1)
        })

        it('arrowLeft should decrease by 1', async () => {
          const currentValue = slider.attributes('aria-valuenow')
          await slider.trigger('keydown', { key: 'ArrowLeft' })
          const newValue = slider.attributes('aria-valuenow')
          const diff = Number(newValue) - Number(currentValue)
          expect(slider.attributes('aria-valuenow')).toBe('49')
          expect(diff).toBe(-1)
        })

        it('arrowUp should decrease by 1', async () => {
          const currentValue = slider.attributes('aria-valuenow')
          await slider.trigger('keydown', { key: 'ArrowUp' })
          const newValue = slider.attributes('aria-valuenow')
          const diff = Number(newValue) - Number(currentValue)
          expect(slider.attributes('aria-valuenow')).toBe('49')
          expect(diff).toBe(-1)
        })

        it('arrowDown should increase by 1', async () => {
          const currentValue = slider.attributes('aria-valuenow')
          await slider.trigger('keydown', { key: 'ArrowDown' })
          const newValue = slider.attributes('aria-valuenow')
          const diff = Number(newValue) - Number(currentValue)
          expect(slider.attributes('aria-valuenow')).toBe('51')
          expect(diff).toBe(1)
        })

        it('pageUp should decrease by 10', async () => {
          const currentValue = slider.attributes('aria-valuenow')
          await slider.trigger('keydown', { key: 'PageUp' })
          const newValue = slider.attributes('aria-valuenow')
          const diff = Number(newValue) - Number(currentValue)
          expect(slider.attributes('aria-valuenow')).toBe('40')
          expect(diff).toBe(-10)
        })

        it('pageDown should increase by 10', async () => {
          const currentValue = slider.attributes('aria-valuenow')
          await slider.trigger('keydown', { key: 'PageDown' })
          const newValue = slider.attributes('aria-valuenow')
          const diff = Number(newValue) - Number(currentValue)
          expect(slider.attributes('aria-valuenow')).toBe('60')
          expect(diff).toBe(10)
        })

        it('home should set value to 100', async () => {
          await slider.trigger('keydown', { key: 'Home' })
          expect(slider.attributes('aria-valuenow')).toBe('0')
        })

        it('end should set value to 0', async () => {
          await slider.trigger('keydown', { key: 'End' })
          expect(slider.attributes('aria-valuenow')).toBe('100')
        })
      })
    })

    describe('after pressing navigation key', () => {
      let slider: DOMWrapper<HTMLElement>

      beforeEach(() => {
        slider = wrapper.find('[role="slider"]')
      })

      it('arrowRight should increase by 1', async () => {
        const currentValue = slider.attributes('aria-valuenow')
        await slider.trigger('keydown', { key: 'ArrowRight' })
        const newValue = slider.attributes('aria-valuenow')
        const diff = Number(newValue) - Number(currentValue)
        expect(slider.attributes('aria-valuenow')).toBe('51')
        expect(diff).toBe(1)
      })

      it('arrowLeft should decrease by 1', async () => {
        const currentValue = slider.attributes('aria-valuenow')
        await slider.trigger('keydown', { key: 'ArrowLeft' })
        const newValue = slider.attributes('aria-valuenow')
        const diff = Number(newValue) - Number(currentValue)
        expect(slider.attributes('aria-valuenow')).toBe('49')
        expect(diff).toBe(-1)
      })

      it('arrowUp should increase by 1', async () => {
        const currentValue = slider.attributes('aria-valuenow')
        await slider.trigger('keydown', { key: 'ArrowUp' })
        const newValue = slider.attributes('aria-valuenow')
        const diff = Number(newValue) - Number(currentValue)
        expect(slider.attributes('aria-valuenow')).toBe('51')
        expect(diff).toBe(1)
      })

      it('arrowDown should decrease by 1', async () => {
        const currentValue = slider.attributes('aria-valuenow')
        await slider.trigger('keydown', { key: 'ArrowDown' })
        const newValue = slider.attributes('aria-valuenow')
        const diff = Number(newValue) - Number(currentValue)
        expect(slider.attributes('aria-valuenow')).toBe('49')
        expect(diff).toBe(-1)
      })

      it('pageUp should increase by 10', async () => {
        const currentValue = slider.attributes('aria-valuenow')
        await slider.trigger('keydown', { key: 'PageUp' })
        const newValue = slider.attributes('aria-valuenow')
        const diff = Number(newValue) - Number(currentValue)
        expect(slider.attributes('aria-valuenow')).toBe('60')
        expect(diff).toBe(10)
      })

      it('pageDown should decrease by 10', async () => {
        const currentValue = slider.attributes('aria-valuenow')
        await slider.trigger('keydown', { key: 'PageDown' })
        const newValue = slider.attributes('aria-valuenow')
        const diff = Number(newValue) - Number(currentValue)
        expect(slider.attributes('aria-valuenow')).toBe('40')
        expect(diff).toBe(-10)
      })

      it('home should set value to 0', async () => {
        await slider.trigger('keydown', { key: 'Home' })
        expect(slider.attributes('aria-valuenow')).toBe('0')
      })

      it('end should set value to max', async () => {
        await slider.trigger('keydown', { key: 'End' })
        expect(slider.attributes('aria-valuenow')).toBe('100')
      })
    })
  })

  describe('after pointerdown event on slider-impl', () => {
    let sliderImpl: DOMWrapper<HTMLElement>
    beforeEach(async () => {
      sliderImpl = wrapper.find('[data-slider-impl]')
      await fireEvent.pointerDown(sliderImpl.element, { clientX: 10, pointerId: 1 })
    })

    // Temporary hide emitted
    // it('should emit slideStart', async () => {
    //   expect(sliderImpl.emitted('slideStart')?.[0].length).toBe(1)
    // })

    describe('after pointermove', () => {
      beforeEach(async () => {
        await fireEvent.pointerMove(sliderImpl.element, { clientX: 50, pointerId: 1 })
      })

      // it('should emit slideMove', async () => {
      //   expect(sliderImpl.emitted('slideMove')?.[0]?.length).toBe(1)
      // })

      describe('after pointerup', () => {
        beforeEach(async () => {
          await fireEvent.pointerUp(sliderImpl.element, { pointerId: 1 })
        })

        // it('should emit slideEnd', async () => {
        //   expect(sliderImpl.emitted('slideEnd')?.[0].length).toBe(0)
        // })

        it('should emit valueCommit on wrapper', async () => {
          expect(wrapper.emitted('valueCommit')?.[0].length).toBe(1)
        })
      })

      describe('after pointerup and then lostpointercapture', () => {
        beforeEach(async () => {
          await fireEvent.pointerUp(sliderImpl.element, { pointerId: 1 })
          await fireEvent.lostPointerCapture(sliderImpl.element, { pointerId: 1 })
        })

        it('should emit valueCommit on wrapper once', async () => {
          expect(wrapper.emitted('valueCommit')).toHaveLength(1)
        })
      })

      describe('after lostpointercapture and then pointerup', () => {
        beforeEach(async () => {
          await fireEvent.lostPointerCapture(sliderImpl.element, { pointerId: 1 })
          await fireEvent.pointerUp(sliderImpl.element, { pointerId: 1 })
        })

        it('should emit valueCommit on wrapper once', async () => {
          expect(wrapper.emitted('valueCommit')).toHaveLength(1)
        })
      })

      describe('after pointerup once capture is gone, with no lostpointercapture on the slider', () => {
        beforeEach(async () => {
          vi.mocked(window.HTMLElement.prototype.hasPointerCapture).mockReturnValueOnce(false)
          await fireEvent.pointerUp(sliderImpl.element, { pointerId: 1 })
        })

        it('should emit valueCommit on wrapper', async () => {
          expect(wrapper.emitted('valueCommit')).toHaveLength(1)
        })
      })

      describe('after pointercancel', () => {
        beforeEach(async () => {
          await fireEvent.pointerCancel(sliderImpl.element, { pointerId: 1 })
          await fireEvent.lostPointerCapture(sliderImpl.element, { pointerId: 1 })
        })

        it('should emit valueCommit on wrapper', async () => {
          expect(wrapper.emitted('valueCommit')).toHaveLength(1)
        })
      })

      describe('after a second pointer slides and both lift', () => {
        const onSlideEnd = vi.fn()
        beforeEach(async () => {
          onSlideEnd.mockClear()
          await wrapper.setProps({ onSlideEnd } as any)
          await fireEvent.pointerDown(sliderImpl.element, { clientX: 50, pointerId: 2 })
          await fireEvent.pointerUp(sliderImpl.element, { pointerId: 1 })
          await fireEvent.pointerMove(sliderImpl.element, { clientX: 90, pointerId: 2 })
          await fireEvent.pointerUp(sliderImpl.element, { pointerId: 2 })
        })

        it('should end the slide for each pointer, committing the slides that changed the value', async () => {
          expect(onSlideEnd).toHaveBeenCalledTimes(2)
          // jsdom lays the track out at zero width, so every pointer position maps to 0. The first
          // pointer's slide (50 → 0) commits; the second pointer's press and move change nothing.
          expect(wrapper.emitted('valueCommit')).toEqual([[[0]]])
        })
      })
    })
  })

  describe('after pressing navigation key', () => {
    let slider: DOMWrapper<HTMLElement>

    beforeEach(() => {
      slider = wrapper.find('[role="slider"]')
    })

    it('arrowRight should increase by 1', async () => {
      const currentValue = slider.attributes('aria-valuenow')
      await slider.trigger('keydown', { key: 'ArrowRight' })
      const newValue = slider.attributes('aria-valuenow')
      const diff = Number(newValue) - Number(currentValue)
      expect(slider.attributes('aria-valuenow')).toBe('51')
      expect(diff).toBe(1)
    })

    it('arrowLeft should decrease by 1', async () => {
      const currentValue = slider.attributes('aria-valuenow')
      await slider.trigger('keydown', { key: 'ArrowLeft' })
      const newValue = slider.attributes('aria-valuenow')
      const diff = Number(newValue) - Number(currentValue)
      expect(slider.attributes('aria-valuenow')).toBe('49')
      expect(diff).toBe(-1)
    })

    it('arrowUp should increase by 1', async () => {
      const currentValue = slider.attributes('aria-valuenow')
      await slider.trigger('keydown', { key: 'ArrowUp' })
      const newValue = slider.attributes('aria-valuenow')
      const diff = Number(newValue) - Number(currentValue)
      expect(slider.attributes('aria-valuenow')).toBe('51')
      expect(diff).toBe(1)
    })

    it('arrowDown should decrease by 1', async () => {
      const currentValue = slider.attributes('aria-valuenow')
      await slider.trigger('keydown', { key: 'ArrowDown' })
      const newValue = slider.attributes('aria-valuenow')
      const diff = Number(newValue) - Number(currentValue)
      expect(slider.attributes('aria-valuenow')).toBe('49')
      expect(diff).toBe(-1)
    })

    it('pageUp should increase by 10', async () => {
      const currentValue = slider.attributes('aria-valuenow')
      await slider.trigger('keydown', { key: 'PageUp' })
      const newValue = slider.attributes('aria-valuenow')
      const diff = Number(newValue) - Number(currentValue)
      expect(slider.attributes('aria-valuenow')).toBe('60')
      expect(diff).toBe(10)
    })

    it('pageDown should decrease by 10', async () => {
      const currentValue = slider.attributes('aria-valuenow')
      await slider.trigger('keydown', { key: 'PageDown' })
      const newValue = slider.attributes('aria-valuenow')
      const diff = Number(newValue) - Number(currentValue)
      expect(slider.attributes('aria-valuenow')).toBe('40')
      expect(diff).toBe(-10)
    })

    it('home should set value to 0', async () => {
      await slider.trigger('keydown', { key: 'Home' })
      expect(slider.attributes('aria-valuenow')).toBe('0')
    })

    it('end should set value to max', async () => {
      await slider.trigger('keydown', { key: 'End' })
      expect(slider.attributes('aria-valuenow')).toBe('100')
    })
  })
})

describe('given slider in a form', async () => {
  const wrapper = mount({
    props: ['handleSubmit'],
    components: { Slider },
    template: '<form @submit="handleSubmit"><Slider value="true" /></form>',
  }, {
    props: { handleSubmit },
  })

  it('should have hidden input field', async () => {
    expect(wrapper.find('[type="number"]').exists()).toBe(true)
  })

  describe('after clicking submit button', () => {
    beforeEach(async () => {
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ 'slider[0]': '50' })
    })
  })

  describe('after uncheck and click submit button again', () => {
    beforeEach(async () => {
      const slider = wrapper.find('[role="slider"]')
      await slider.trigger('focus')
      await slider.trigger('keydown', { key: 'ArrowRight' })
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ 'slider[0]': '51' })
    })
  })
})

// Inside a Suspense, an out-in transition defers the leaving branch's `isUnmounted` until the leave
// ends, while its template refs are already null. Its DOM listeners still fire and emit meanwhile:
// this is how Nuxt's `<NuxtPage>` leaves a route.
describe('given slider on a page that leaves through an out-in transition', () => {
  it.each(['horizontal', 'vertical'] as const)('should keep responding to pointer input while the page leaves (%s)', async (orientation) => {
    const errors: unknown[] = []
    const emitted: number[][] = []
    const page = ref<'slider' | 'next'>('slider')
    let finishLeave = () => {}
    const NextPage = defineComponent({
      async setup() {
        await Promise.resolve()
        return () => h('div')
      },
    })
    const Pages = defineComponent(() => () => h(
      Transition,
      { mode: 'out-in', css: false, onLeave: (_el: Element, done: () => void) => { finishLeave = done } },
      () => h(Suspense, null, {
        default: () => page.value === 'slider'
          ? h(Slider, { 'key': 'slider', orientation, 'onUpdate:modelValue': (v: number[]) => emitted.push(v) })
          : h(NextPage, { key: 'next' }),
      }),
    ))
    const wrapper = mount(Pages, {
      attachTo: document.body,
      global: { stubs: { transition: false }, config: { errorHandler: error => errors.push(error) } },
    })
    try {
      await flushPromises()
      const sliderImpl = wrapper.find('[data-slider-impl]').element
      const thumb = wrapper.find('[role="slider"]').element
      vi.spyOn(sliderImpl, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 100))

      page.value = 'next'
      await flushPromises()
      expect(thumb.isConnected).toBe(true)
      // Horizontal reads clientX from the left; vertical reads clientY from the bottom.
      await fireEvent.pointerDown(sliderImpl, { clientX: 10, clientY: 90, pointerId: 1 })
      // The leaving branch no longer re-renders, so assert on the model rather than aria-valuenow.
      expect(emitted).toEqual([[10]])
      await fireEvent.pointerMove(thumb, { clientX: 50, clientY: 50, pointerId: 1 })

      expect(errors).toEqual([])
    }
    finally {
      finishLeave()
      wrapper.unmount()
    }
  })
})

function mountRangeSlider(thumbs: Ref<string[]>, value: Ref<number[]>) {
  return mount(defineComponent(() => () => h(
    SliderRoot,
    { 'modelValue': value.value, 'onUpdate:modelValue': (v: number[] | undefined) => { value.value = v! } },
    () => [h(SliderTrack), ...thumbs.value.map(key => h(SliderThumb, { key, 'data-key': key }))],
  )), { attachTo: document.body })
}

describe('given a range slider whose thumbs change', () => {
  it('should not throw when an earlier thumb is removed while a later one is active', async () => {
    const thumbs = ref(['a', 'b'])
    const value = ref([20, 80])
    const wrapper = mountRangeSlider(thumbs, value)
    try {
      await nextTick()
      await wrapper.find('[data-key="b"]').trigger('focus')
      thumbs.value = ['b']
      value.value = [80]
      await nextTick()
      const sliderImpl = wrapper.find('[data-slider-impl]').element
      vi.spyOn(sliderImpl, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 20))

      await fireEvent.pointerDown(sliderImpl, { clientX: 30, clientY: 10, pointerId: 1 })

      expect(value.value).toEqual([30])
    }
    finally {
      wrapper.unmount()
    }
  })

  it('should move and focus the thumb nearest the pointer after a thumb is reinserted', async () => {
    const thumbs = ref(['a', 'b'])
    const value = ref([20, 80])
    const wrapper = mountRangeSlider(thumbs, value)
    try {
      await nextTick()
      thumbs.value = ['b']
      value.value = [80]
      await nextTick()
      thumbs.value = ['a', 'b']
      value.value = [20, 80]
      await nextTick()
      const sliderImpl = wrapper.find('[data-slider-impl]').element
      vi.spyOn(sliderImpl, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 20))

      await fireEvent.pointerDown(sliderImpl, { clientX: 10, clientY: 10, pointerId: 1 })

      expect(value.value).toEqual([10, 80])
      expect(document.activeElement).toBe(wrapper.find('[data-key="a"]').element)
    }
    finally {
      wrapper.unmount()
    }
  })
})

describe('given a range slider whose thumb is reinserted before the focused one', () => {
  it('should keep stepping the focused thumb with the keyboard', async () => {
    const thumbs = ref(['a', 'b'])
    const value = ref([20, 80])
    const wrapper = mountRangeSlider(thumbs, value)
    try {
      await nextTick()
      await wrapper.find('[data-key="b"]').trigger('focus')
      thumbs.value = ['b']
      value.value = [80]
      await nextTick()
      thumbs.value = ['a', 'b']
      value.value = [20, 80]
      await nextTick()

      await wrapper.find('[data-key="b"]').trigger('keydown', { key: 'ArrowRight' })

      expect(value.value).toEqual([20, 81])
    }
    finally {
      wrapper.unmount()
    }
  })
})

describe('given a range slider with an asChild thumb that renders no element', () => {
  it('should register the other thumbs', async () => {
    const value = ref([20, 80])
    const errors: unknown[] = []
    const wrapper = mount(defineComponent(() => () => h(
      SliderRoot,
      { 'modelValue': value.value, 'onUpdate:modelValue': (v: number[] | undefined) => { value.value = v! } },
      () => [
        h(SliderTrack),
        h(SliderThumb, { 'data-key': 'a' }),
        h(SliderThumb, { asChild: true }, () => null),
        h(SliderThumb, { 'data-key': 'b' }),
      ],
    )), { attachTo: document.body, global: { config: { errorHandler: error => errors.push(error) } } })
    try {
      await nextTick()
      const sliderImpl = wrapper.find('[data-slider-impl]').element
      vi.spyOn(sliderImpl, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 20))

      await fireEvent.pointerDown(sliderImpl, { clientX: 90, clientY: 10, pointerId: 1 })

      expect(errors).toEqual([])
      expect(value.value).toEqual([20, 90])
      expect(document.activeElement).toBe(wrapper.find('[data-key="b"]').element)
    }
    finally {
      wrapper.unmount()
    }
  })
})

describe('given a range slider whose first thumb is removed', () => {
  it('should focus the remaining thumb, not the detached one, on pointer input', async () => {
    const thumbs = ref(['a', 'b'])
    const value = ref([20, 80])
    const wrapper = mount(defineComponent(() => () => h(
      SliderRoot,
      { 'modelValue': value.value, 'onUpdate:modelValue': (v: number[] | undefined) => { value.value = v! } },
      () => [h(SliderTrack), ...thumbs.value.map(key => h(SliderThumb, { key }))],
    )), { attachTo: document.body })
    try {
      await nextTick()
      thumbs.value = ['b']
      value.value = [80]
      await nextTick()
      const sliderImpl = wrapper.find('[data-slider-impl]').element
      vi.spyOn(sliderImpl, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 20))
      const remaining = wrapper.find('[role="slider"]').element

      await fireEvent.pointerDown(sliderImpl, { clientX: 30, clientY: 10, pointerId: 1 })

      expect(remaining.getAttribute('aria-valuenow')).toBe('30')
      expect(document.activeElement).toBe(remaining)
    }
    finally {
      wrapper.unmount()
    }
  })
})

describe('given a slider pressed by several pointers', () => {
  function mountControlled(initial: number[], props: Record<string, unknown> = {}) {
    const value = ref(initial)
    const max = ref(100)
    const wrapper = mount(defineComponent(() => () => h(
      SliderRoot,
      { 'modelValue': value.value, 'onUpdate:modelValue': (v: number[] | undefined) => { value.value = v! }, 'max': max.value, 'thumbAlignment': 'overflow', ...props },
      () => initial.map((_, key) => h(SliderThumb, { key })),
    )), { attachTo: document.body })
    const root = wrapper.findComponent(SliderRoot)
    const slider = wrapper.get('[data-slider-impl]').element
    vi.spyOn(slider, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 20))
    const thumbs = wrapper.findAll('[role="slider"]').map(thumb => thumb.element as HTMLElement)
    return { value, max, wrapper, root, slider, thumbs }
  }

  it('keeps the first pointer\'s grab offset on a contained thumb', async () => {
    const { value, wrapper, thumbs: [thumb] } = mountControlled([40], { thumbAlignment: 'contain' })
    // A 120px track with a 20px thumb: in `contain` mode the thumb's left edge is at its value in px.
    vi.spyOn(wrapper.get('[data-slider-impl]').element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 120, 20))
    Object.defineProperty(thumb, 'clientWidth', { value: 20 })
    vi.spyOn(thumb, 'getBoundingClientRect').mockImplementation(() => new DOMRect(value.value[0], 0, 20, 20))
    try {
      // The first pointer grabs the thumb 2px in from its edge and drags it 10px.
      await fireEvent.pointerDown(thumb, { clientX: 42, pointerId: 1 })
      await fireEvent.pointerMove(thumb, { clientX: 42, pointerId: 1 })
      await fireEvent.pointerMove(thumb, { clientX: 52, pointerId: 1 })
      expect(value.value).toEqual([50])

      // A second pointer presses the thumb and lifts while the first one is still down.
      await fireEvent.pointerDown(thumb, { clientX: 55, pointerId: 2 })
      await fireEvent.pointerUp(thumb, { pointerId: 2 })

      await fireEvent.pointerMove(thumb, { clientX: 62, pointerId: 1 })
      expect(value.value).toEqual([60])
      await fireEvent.pointerMove(thumb, { clientX: 72, pointerId: 1 })
      expect(value.value).toEqual([70])
    }
    finally {
      wrapper.unmount()
    }
  })

  it('keeps each pointer on the thumb it pressed', async () => {
    const { value, wrapper, thumbs: [first, second] } = mountControlled([10, 90])
    try {
      await fireEvent.pointerDown(first, { clientX: 10, pointerId: 1 })
      await fireEvent.pointerDown(second, { clientX: 90, pointerId: 2 })
      await fireEvent.pointerMove(first, { clientX: 20, pointerId: 1 })
      await fireEvent.pointerMove(second, { clientX: 80, pointerId: 2 })

      expect(value.value).toEqual([20, 80])
    }
    finally {
      wrapper.unmount()
    }
  })

  it('keeps the other pointer on its thumb when one pointer drags past it', async () => {
    const { value, wrapper, thumbs: [first, second] } = mountControlled([20, 80])
    try {
      await fireEvent.pointerDown(first, { clientX: 20, pointerId: 1 })
      await fireEvent.pointerDown(second, { clientX: 80, pointerId: 2 })
      await fireEvent.pointerMove(first, { clientX: 90, pointerId: 1 })
      expect(value.value).toEqual([80, 90])
      // The second pointer still holds the thumb at 80, now the first value.
      await fireEvent.pointerMove(second, { clientX: 70, pointerId: 2 })

      expect(value.value).toEqual([70, 90])
    }
    finally {
      wrapper.unmount()
    }
  })

  it('commits a slide only for the pointer that made it', async () => {
    const { wrapper, root, thumbs: [thumb] } = mountControlled([40])
    try {
      await fireEvent.pointerDown(thumb, { clientX: 40, pointerId: 1 })
      await fireEvent.pointerDown(thumb, { clientX: 40, pointerId: 2 })
      await fireEvent.pointerMove(thumb, { clientX: 50, pointerId: 2 })
      await fireEvent.pointerUp(thumb, { pointerId: 1 })
      expect(root.emitted('valueCommit')).toBeUndefined()
      await fireEvent.pointerUp(thumb, { pointerId: 2 })

      expect(root.emitted('valueCommit')).toEqual([[[50]]])
    }
    finally {
      wrapper.unmount()
    }
  })

  it('commits the first pointer\'s slide when a second pointer pressed and lifted during it', async () => {
    const { wrapper, root, thumbs: [thumb] } = mountControlled([40])
    try {
      await fireEvent.pointerDown(thumb, { clientX: 40, pointerId: 1 })
      await fireEvent.pointerMove(thumb, { clientX: 50, pointerId: 1 })
      await fireEvent.pointerDown(thumb, { clientX: 50, pointerId: 2 })
      await fireEvent.pointerUp(thumb, { pointerId: 2 })
      expect(root.emitted('valueCommit')).toBeUndefined()
      await fireEvent.pointerUp(thumb, { pointerId: 1 })

      expect(root.emitted('valueCommit')).toEqual([[[50]]])
    }
    finally {
      wrapper.unmount()
    }
  })

  it('keeps the keyboard on the focused thumb when another pointer\'s move changes nothing', async () => {
    const { value, wrapper, thumbs: [first, second] } = mountControlled([10, 90])
    try {
      await fireEvent.pointerDown(first, { clientX: 10, pointerId: 1 })
      await fireEvent.pointerDown(second, { clientX: 90, pointerId: 2 })
      // Within the same step: nothing changes, and the second thumb keeps focus.
      await fireEvent.pointerMove(first, { clientX: 10.2, pointerId: 1 })
      await fireEvent.keyDown(second, { key: 'ArrowRight' })

      expect(value.value).toEqual([10, 91])
    }
    finally {
      wrapper.unmount()
    }
  })

  it('keeps the values within the bounds until the last pointer lifts', async () => {
    const { value, max, wrapper, root, thumbs: [first, second] } = mountControlled([20, 80])
    try {
      await fireEvent.pointerDown(first, { clientX: 20, pointerId: 1 })
      await fireEvent.pointerDown(second, { clientX: 80, pointerId: 2 })
      await fireEvent.pointerMove(second, { clientX: 85, pointerId: 2 })
      await fireEvent.pointerUp(first, { pointerId: 1 })
      // The second pointer is still dragging.
      max.value = 60
      await nextTick()

      expect(value.value).toEqual([20, 60])
      await fireEvent.pointerUp(second, { pointerId: 2 })
      expect(root.emitted('valueCommit')).toEqual([[[20, 60]]])

      // Once every pointer has lifted, the bounds are no longer tracked.
      max.value = 40
      await nextTick()
      expect(value.value).toEqual([20, 60])
    }
    finally {
      wrapper.unmount()
    }
  })
})

describe('given a range slider whose bounds narrow during a drag below minStepsBetweenThumbs', () => {
  function mountSpaced(defaultValue: number[]) {
    const wrapper = mount(SliderRoot, {
      props: { defaultValue, minStepsBetweenThumbs: 10, thumbAlignment: 'overflow' },
      slots: { default: () => defaultValue.map((_, key) => h(SliderThumb, { key })) },
    })
    const slider = wrapper.get('[data-slider-impl]').element
    vi.spyOn(slider, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 20))
    const values = () => wrapper.findAll('[role="slider"]').map(thumb => Number(thumb.attributes('aria-valuenow')))
    return { wrapper, slider, values }
  }

  it.each([
    { defaultValue: [50, 80], bounds: { max: 55 }, expected: [45, 55] },
    { defaultValue: [20, 50], bounds: { min: 45 }, expected: [45, 55] },
    { defaultValue: [10, 15, 90], bounds: { min: 40, max: 60 }, expected: [40, 50, 60] },
  ])('pushes the thumbs apart inside the new range ($bounds)', async ({ defaultValue, bounds, expected }) => {
    const { wrapper, slider, values } = mountSpaced(defaultValue)

    await fireEvent.pointerDown(slider, { clientX: defaultValue[0], pointerId: 1 })
    await wrapper.setProps(bounds)

    expect(values()).toEqual(expected)
    await fireEvent.pointerUp(slider, { pointerId: 1 })
    expect(wrapper.emitted('valueCommit')).toEqual([[expected]])
  })

  it('keeps the clamped values when the range is too narrow for the spacing', async () => {
    const { wrapper, slider, values } = mountSpaced([10, 50, 90])

    await fireEvent.pointerDown(slider, { clientX: 10, pointerId: 1 })
    await wrapper.setProps({ min: 45, max: 60 })
    expect(values()).toEqual([45, 50, 60])

    // A move that would break the spacing further is refused, without throwing.
    await fireEvent.pointerMove(slider, { clientX: 55, pointerId: 1 })
    expect(values()).toEqual([45, 50, 60])
    await fireEvent.pointerUp(slider, { pointerId: 1 })
    expect(wrapper.emitted('valueCommit')).toEqual([[[45, 50, 60]]])
  })
})
