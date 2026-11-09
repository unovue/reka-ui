import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import type { Ref } from 'vue'
import { fireEvent } from '@testing-library/vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref, Suspense, Transition } from 'vue'
import { handleSubmit } from '@/test'
import { SliderRoot, SliderThumb, SliderTrack } from '.'
import SliderImpl from './SliderImpl.vue'
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

  describe('when disabled', () => {
    beforeEach(async () => {
      await wrapper.setProps({ disabled: true })
    })

    it('should disable the thumb', () => {
      const thumb = wrapper.find('[role="slider"]')
      expect(thumb.attributes('data-disabled')).toBe('')
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
        beforeEach(async () => {
          await fireEvent.pointerDown(sliderImpl.element, { clientX: 50, pointerId: 2 })
          await fireEvent.pointerUp(sliderImpl.element, { pointerId: 1 })
          await fireEvent.pointerMove(sliderImpl.element, { clientX: 90, pointerId: 2 })
          await fireEvent.pointerUp(sliderImpl.element, { pointerId: 2 })
        })

        it('should end the slide for each pointer', async () => {
          expect(wrapper.findComponent(SliderImpl).emitted('slideEnd')).toHaveLength(2)
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
