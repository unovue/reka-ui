import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, nextTick, ref } from 'vue'
import { handleSubmit } from '@/test'
import { SliderAreaArea, SliderAreaRoot, SliderAreaThumb } from '.'
import SliderArea from './story/_SliderArea.vue'

describe('given default SliderArea', () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn().mockImplementation(id => id)
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.setPointerCapture = vi.fn()

  let wrapper: VueWrapper<InstanceType<typeof SliderArea>>

  beforeEach(() => {
    wrapper = mount(SliderArea, { props: { disabled: false } })
  })

  it('should pass axe accessibility tests', async () => {
    wrapper = mount(SliderArea)
    expect(await axe(wrapper.element, {
      rules: {
        label: { enabled: false },
      },
    })).toHaveNoViolations()
  })

  it('should have 2D slider role description on the thumb', () => {
    const thumb = wrapper.find('[aria-roledescription="2D slider"]')
    expect(thumb.exists()).toBe(true)
  })

  it('should have a slider with correct ARIA attributes', () => {
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.exists()).toBe(true)
    expect(thumb.attributes('aria-valuenow')).toBe('50')
    expect(thumb.attributes('aria-valuetext')).toBe('50, 50')
    expect(thumb.attributes('aria-valuemin')).toBe('0')
    expect(thumb.attributes('aria-valuemax')).toBe('100')
  })

  describe('when disabled', () => {
    beforeEach(async () => {
      await wrapper.setProps({ disabled: true })
    })

    it('should disable the thumb', () => {
      const thumb = wrapper.find('[aria-roledescription="2D slider"]')
      expect(thumb.attributes('data-disabled')).toBe('')
    })

    it('should remove tabindex from thumb', () => {
      const thumb = wrapper.find('[role="slider"]')
      expect(thumb.attributes('tabindex')).toBeUndefined()
    })
  })

  describe('when enabled', () => {
    it('should have tabindex 0 on thumb', () => {
      const thumb = wrapper.find('[role="slider"]')
      expect(thumb.attributes('tabindex')).toBe('0')
    })
  })

  describe('when invertedX', () => {
    beforeEach(async () => {
      await wrapper.setProps({ invertedX: true })
    })

    describe('after pressing navigation key', () => {
      let slider: DOMWrapper<HTMLElement>

      beforeEach(() => {
        slider = wrapper.find('[role="slider"]')
      })

      it('arrowRight should decrease X by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowRight' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[49, 50]])
      })

      it('arrowLeft should increase X by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowLeft' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[51, 50]])
      })

      it('arrowUp should still decrease Y by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowUp' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 49]])
      })

      it('arrowDown should still increase Y by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowDown' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 51]])
      })

      it('home should still set X to min', async () => {
        await slider.trigger('keydown', { key: 'Home' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[0, 50]])
      })

      it('end should still set X to max', async () => {
        await slider.trigger('keydown', { key: 'End' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[100, 50]])
      })

      it('pageUp should still decrease Y by 10', async () => {
        await slider.trigger('keydown', { key: 'PageUp' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 40]])
      })

      it('pageDown should still increase Y by 10', async () => {
        await slider.trigger('keydown', { key: 'PageDown' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 60]])
      })
    })
  })

  describe('when invertedY', () => {
    beforeEach(async () => {
      await wrapper.setProps({ invertedY: true })
    })

    describe('after pressing navigation key', () => {
      let slider: DOMWrapper<HTMLElement>

      beforeEach(() => {
        slider = wrapper.find('[role="slider"]')
      })

      it('arrowUp should increase Y by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowUp' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 51]])
      })

      it('arrowDown should decrease Y by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowDown' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 49]])
      })

      it('arrowRight should still increase X by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowRight' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[51, 50]])
      })

      it('arrowLeft should still decrease X by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowLeft' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[49, 50]])
      })

      it('pageUp should increase Y by 10', async () => {
        await slider.trigger('keydown', { key: 'PageUp' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 60]])
      })

      it('pageDown should decrease Y by 10', async () => {
        await slider.trigger('keydown', { key: 'PageDown' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 40]])
      })

      it('home should set X to min', async () => {
        await slider.trigger('keydown', { key: 'Home' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[0, 50]])
      })

      it('end should set X to max', async () => {
        await slider.trigger('keydown', { key: 'End' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[100, 50]])
      })
    })
  })

  describe('when both invertedX and invertedY', () => {
    beforeEach(async () => {
      await wrapper.setProps({ invertedX: true, invertedY: true })
    })

    describe('after pressing navigation key', () => {
      let slider: DOMWrapper<HTMLElement>

      beforeEach(() => {
        slider = wrapper.find('[role="slider"]')
      })

      it('arrowRight should decrease X by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowRight' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[49, 50]])
      })

      it('arrowLeft should increase X by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowLeft' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[51, 50]])
      })

      it('arrowUp should increase Y by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowUp' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 51]])
      })

      it('arrowDown should decrease Y by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowDown' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 49]])
      })

      it('pageUp should increase Y by 10', async () => {
        await slider.trigger('keydown', { key: 'PageUp' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 60]])
      })

      it('pageDown should decrease Y by 10', async () => {
        await slider.trigger('keydown', { key: 'PageDown' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 40]])
      })

      it('home should still set X to min', async () => {
        await slider.trigger('keydown', { key: 'Home' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[0, 50]])
      })

      it('end should still set X to max', async () => {
        await slider.trigger('keydown', { key: 'End' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[100, 50]])
      })
    })
  })

  describe('after pressing shift+arrow key', () => {
    let slider: DOMWrapper<HTMLElement>

    beforeEach(() => {
      slider = wrapper.find('[role="slider"]')
    })

    it('shift+arrowRight should increase X by 10', async () => {
      await slider.trigger('keydown', { key: 'ArrowRight', shiftKey: true })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[60, 50]])
    })

    it('shift+arrowLeft should decrease X by 10', async () => {
      await slider.trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[40, 50]])
    })

    it('shift+arrowUp should decrease Y by 10', async () => {
      await slider.trigger('keydown', { key: 'ArrowUp', shiftKey: true })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 40]])
    })

    it('shift+arrowDown should increase Y by 10', async () => {
      await slider.trigger('keydown', { key: 'ArrowDown', shiftKey: true })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 60]])
    })
  })

  describe('after pointerdown event on root', () => {
    let root: DOMWrapper<HTMLElement>
    beforeEach(async () => {
      root = wrapper.find('[data-disabled]') as DOMWrapper<HTMLElement>
      if (!root.exists())
        root = wrapper.find('[aria-disabled]') as DOMWrapper<HTMLElement>
      await root.trigger('pointerdown', { clientX: 10, clientY: 10, pointerId: 1 })
    })

    describe('after pointermove', () => {
      beforeEach(async () => {
        await root.trigger('pointermove', { clientX: 50, clientY: 50, pointerId: 1 })
      })

      describe('after pointerup', () => {
        beforeEach(async () => {
          await root.trigger('pointerup', { pointerId: 1 })
        })

        it('should emit valueCommit on wrapper', async () => {
          expect(wrapper.emitted('valueCommit')?.[0].length).toBe(1)
        })
      })

      describe('after pointerup and then lostpointercapture', () => {
        beforeEach(async () => {
          await root.trigger('pointerup', { pointerId: 1 })
          await root.trigger('lostpointercapture', { pointerId: 1 })
        })

        it('should emit valueCommit on wrapper once', async () => {
          expect(wrapper.emitted('valueCommit')).toHaveLength(1)
        })
      })

      describe('after lostpointercapture and then pointerup', () => {
        beforeEach(async () => {
          await root.trigger('lostpointercapture', { pointerId: 1 })
          // The area no longer holds capture once it has lost it.
          vi.mocked(window.HTMLElement.prototype.hasPointerCapture).mockReturnValueOnce(false)
          await root.trigger('pointerup', { pointerId: 1 })
        })

        it('should emit valueCommit on wrapper once', async () => {
          expect(wrapper.emitted('valueCommit')).toHaveLength(1)
        })
      })

      describe('after pointerup once capture is gone, with no lostpointercapture on the area', () => {
        beforeEach(async () => {
          vi.mocked(window.HTMLElement.prototype.hasPointerCapture).mockReturnValueOnce(false)
          await root.trigger('pointerup', { pointerId: 1 })
        })

        it('should emit valueCommit on wrapper', async () => {
          expect(wrapper.emitted('valueCommit')).toHaveLength(1)
        })
      })

      describe('after pointercancel', () => {
        beforeEach(async () => {
          await root.trigger('pointercancel', { pointerId: 1 })
          await root.trigger('lostpointercapture', { pointerId: 1 })
        })

        it('should emit valueCommit on wrapper', async () => {
          expect(wrapper.emitted('valueCommit')).toHaveLength(1)
        })
      })
    })
  })

  describe('after a second pointer slides and both lift', () => {
    beforeEach(async () => {
      const root = wrapper.find('[aria-disabled]')
      vi.spyOn(root.element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 100))
      await root.trigger('pointerdown', { clientX: 10, clientY: 10, pointerId: 1 })
      await root.trigger('pointerdown', { clientX: 50, clientY: 50, pointerId: 2 })
      await root.trigger('pointerup', { pointerId: 1 })
      await root.trigger('pointermove', { clientX: 90, clientY: 90, pointerId: 2 })
      await root.trigger('pointerup', { pointerId: 2 })
    })

    it('should end the slide for each pointer', async () => {
      expect(wrapper.emitted('valueCommit')).toEqual([[[[50, 50]]], [[[90, 90]]]])
    })
  })

  describe('after a slide that ends while disabled', () => {
    it('should read where the area is now on the next slide', async () => {
      const root = wrapper.find('[aria-disabled]')
      const rect = vi.spyOn(root.element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 100))
      await root.trigger('pointerdown', { clientX: 10, clientY: 10, pointerId: 1 })
      await wrapper.setProps({ disabled: true })
      await root.trigger('pointerup', { pointerId: 1 })
      await wrapper.setProps({ disabled: false })
      // The area moves between the two slides, as when the page scrolls.
      rect.mockReturnValue(new DOMRect(0, 100, 100, 100))

      await root.trigger('pointerdown', { clientX: 30, clientY: 130, pointerId: 2 })

      expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([[30, 30]])
      expect(wrapper.emitted('valueCommit')).toBeUndefined()
    })
  })

  describe('after a press that starts while disabled and moves once enabled', () => {
    it('should slide, commit once and read where the area is now on the next slide', async () => {
      const root = wrapper.find('[aria-disabled]')
      const rect = vi.spyOn(root.element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 100))
      await wrapper.setProps({ disabled: true })
      // Touch and pen capture the pointer to the pressed element even when the area ignores the press.
      await root.trigger('pointerdown', { clientX: 10, clientY: 10, pointerId: 1 })
      await wrapper.setProps({ disabled: false })
      await root.trigger('pointermove', { clientX: 60, clientY: 60, pointerId: 1 })
      expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([[60, 60]])
      await root.trigger('pointerup', { pointerId: 1 })
      expect(wrapper.emitted('valueCommit')).toEqual([[[[60, 60]]]])
      // The area moves between the two presses, as when the page scrolls.
      rect.mockReturnValue(new DOMRect(0, 100, 100, 100))

      await root.trigger('pointerdown', { clientX: 30, clientY: 130, pointerId: 2 })

      expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([[30, 30]])
    })

    it('should commit a slide back to where the slide before it started', async () => {
      const root = wrapper.find('[aria-disabled]')
      vi.spyOn(root.element, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 100))
      await root.trigger('pointerdown', { clientX: 50, clientY: 50, pointerId: 1 })
      await root.trigger('pointermove', { clientX: 70, clientY: 70, pointerId: 1 })
      await root.trigger('pointerup', { pointerId: 1 })
      await wrapper.setProps({ disabled: true })
      await root.trigger('pointerdown', { clientX: 70, clientY: 70, pointerId: 2 })
      await wrapper.setProps({ disabled: false })

      await root.trigger('pointermove', { clientX: 50, clientY: 50, pointerId: 2 })
      await root.trigger('pointerup', { pointerId: 2 })

      expect(wrapper.emitted('valueCommit')).toEqual([[[[70, 70]]], [[[50, 50]]]])
    })
  })

  describe('after pressing navigation key', () => {
    let slider: DOMWrapper<HTMLElement>

    beforeEach(() => {
      slider = wrapper.find('[role="slider"]')
    })

    it('arrowRight should increase X by 1', async () => {
      await slider.trigger('keydown', { key: 'ArrowRight' })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[51, 50]])
    })

    it('arrowLeft should decrease X by 1', async () => {
      await slider.trigger('keydown', { key: 'ArrowLeft' })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[49, 50]])
    })

    it('arrowUp should decrease Y by 1', async () => {
      await slider.trigger('keydown', { key: 'ArrowUp' })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 49]])
    })

    it('arrowDown should increase Y by 1', async () => {
      await slider.trigger('keydown', { key: 'ArrowDown' })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 51]])
    })

    it('pageUp should decrease Y by 10 steps', async () => {
      await slider.trigger('keydown', { key: 'PageUp' })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 40]])
    })

    it('pageDown should increase Y by 10 steps', async () => {
      await slider.trigger('keydown', { key: 'PageDown' })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 60]])
    })

    it('home should set X to 0', async () => {
      await slider.trigger('keydown', { key: 'Home' })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[0, 50]])
    })

    it('end should set X to max', async () => {
      await slider.trigger('keydown', { key: 'End' })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[100, 50]])
    })
  })
})

describe('given slider area in a form', () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn().mockImplementation(id => id)
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.setPointerCapture = vi.fn()

  let wrapper: VueWrapper

  beforeEach(() => {
    handleSubmit.mockClear()
    wrapper = mount({
      props: ['handleSubmit'],
      components: { SliderArea },
      template: '<form @submit="handleSubmit"><SliderArea /></form>',
    }, {
      props: { handleSubmit },
    })
  })

  it('should have hidden input field', async () => {
    expect(wrapper.find('[type="hidden"]').exists()).toBe(true)
  })

  describe('after clicking submit button', () => {
    beforeEach(async () => {
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ 'slider-area': '[[50,50]]' })
    })
  })

  describe('after changing value and click submit button again', () => {
    beforeEach(async () => {
      const slider = wrapper.find('[role="slider"]')
      await slider.trigger('focus')
      await slider.trigger('keydown', { key: 'ArrowRight' })
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ 'slider-area': '[[51,50]]' })
    })
  })
})

describe('given SliderAreaRoot with direction and step props', () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  function mountRoot(props: Record<string, unknown>) {
    return mount(defineComponent({
      components: { SliderAreaRoot, SliderAreaThumb },
      setup() {
        return { props }
      },
      template: `<SliderAreaRoot v-bind="props" :default-value="[[50, 50]]"><SliderAreaThumb /></SliderAreaRoot>`,
    }))
  }

  function lastValue(wrapper: VueWrapper) {
    const emitted = wrapper.findComponent(SliderAreaRoot).emitted('update:modelValue')
    return emitted?.at(-1)?.[0]
  }

  describe('when dir is rtl', () => {
    it('arrowRight should decrease X by 1', async () => {
      const wrapper = mountRoot({ dir: 'rtl' })
      await wrapper.find('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })
      expect(lastValue(wrapper)).toStrictEqual([[49, 50]])
    })

    it('home should set X to min', async () => {
      const wrapper = mountRoot({ dir: 'rtl' })
      await wrapper.find('[role="slider"]').trigger('keydown', { key: 'Home' })
      expect(lastValue(wrapper)).toStrictEqual([[0, 50]])
    })

    it('end should set X to max', async () => {
      const wrapper = mountRoot({ dir: 'rtl' })
      await wrapper.find('[role="slider"]').trigger('keydown', { key: 'End' })
      expect(lastValue(wrapper)).toStrictEqual([[100, 50]])
    })
  })

  it('pageDown should move Y by stepY times 10', async () => {
    const wrapper = mountRoot({ stepY: 2 })
    await wrapper.find('[role="slider"]').trigger('keydown', { key: 'PageDown' })
    expect(lastValue(wrapper)).toStrictEqual([[50, 70]])
  })

  it('shift+pageDown should not multiply the page step again', async () => {
    const wrapper = mountRoot({ stepY: 2 })
    await wrapper.find('[role="slider"]').trigger('keydown', { key: 'PageDown', shiftKey: true })
    expect(lastValue(wrapper)).toStrictEqual([[50, 70]])
  })
})

describe('given slider area whose thumbs mount out of DOM order', () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  const Multi = defineComponent({
    components: { SliderAreaRoot, SliderAreaArea, SliderAreaThumb },
    props: { showFirst: Boolean },
    setup() {
      return { value: ref([[10, 10], [80, 80]]) }
    },
    template: `
      <SliderAreaRoot v-model="value">
        <SliderAreaArea />
        <SliderAreaThumb v-if="showFirst" data-testid="first" />
        <SliderAreaThumb data-testid="second" />
      </SliderAreaRoot>
      <span data-testid="value">{{ JSON.stringify(value) }}</span>
    `,
  })

  it('keeps focus and keyboard on the thumb at the same index as its value', async () => {
    // The second thumb mounts first; the first thumb is inserted before it afterwards.
    const wrapper = mount(Multi, { props: { showFirst: false }, attachTo: document.body })
    await wrapper.setProps({ showFirst: true })
    await nextTick()

    const first = wrapper.find('[data-testid="first"]')
    ;(first.element as HTMLElement).focus()
    await first.trigger('keydown', { key: 'ArrowRight' })
    await nextTick()

    expect(document.activeElement).toBe(first.element)
    await (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await nextTick()

    expect(wrapper.find('[data-testid="value"]').text()).toBe('[[12,10],[80,80]]')
    wrapper.unmount()
  })
})
