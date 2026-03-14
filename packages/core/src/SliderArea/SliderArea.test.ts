import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { handleSubmit } from '@/test'
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

      it('home should set X to max (inverted)', async () => {
        await slider.trigger('keydown', { key: 'Home' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[100, 50]])
      })

      it('end should set X to min (inverted)', async () => {
        await slider.trigger('keydown', { key: 'End' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[0, 50]])
      })

      it('pageUp should set Y to min', async () => {
        await slider.trigger('keydown', { key: 'PageUp' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 0]])
      })

      it('pageDown should set Y to max', async () => {
        await slider.trigger('keydown', { key: 'PageDown' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 100]])
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

      it('pageUp should set Y to max (inverted)', async () => {
        await slider.trigger('keydown', { key: 'PageUp' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 100]])
      })

      it('pageDown should set Y to min (inverted)', async () => {
        await slider.trigger('keydown', { key: 'PageDown' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 0]])
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

      it('pageUp should set Y to max (inverted)', async () => {
        await slider.trigger('keydown', { key: 'PageUp' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 100]])
      })

      it('pageDown should set Y to min (inverted)', async () => {
        await slider.trigger('keydown', { key: 'PageDown' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 0]])
      })

      it('home should set X to max (inverted)', async () => {
        await slider.trigger('keydown', { key: 'Home' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[100, 50]])
      })

      it('end should set X to min (inverted)', async () => {
        await slider.trigger('keydown', { key: 'End' })
        expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[0, 50]])
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

    it('pageUp should set Y to min', async () => {
      await slider.trigger('keydown', { key: 'PageUp' })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 0]])
    })

    it('pageDown should set Y to max', async () => {
      await slider.trigger('keydown', { key: 'PageDown' })
      expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toStrictEqual([[50, 100]])
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
