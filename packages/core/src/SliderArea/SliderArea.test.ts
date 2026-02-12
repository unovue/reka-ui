import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import type SliderAreaImpl from './SliderAreaImpl.vue'
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
        'label': { enabled: false },
        'nested-interactive': { enabled: false },
      },
    })).toHaveNoViolations()
  })

  it('should have default value', () => {
    expect(wrapper.html()).toContain('aria-valuenow="50,50"')
  })

  it('should have 2D slider role description', () => {
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-roledescription')).toBe('2D slider')
  })

  it('should have aria-valuetext', () => {
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-valuetext')).toBe('X: 50, Y: 50')
  })

  describe('when disabled', () => {
    beforeEach(async () => {
      await wrapper.setProps({ disabled: true })
    })

    it('should disable the thumb', () => {
      const thumb = wrapper.find('[role="slider"]')
      expect(thumb.attributes('data-disabled')).toBe('')
      expect(thumb.attributes('aria-valuenow')).toBe('50,50')
    })

    it('should remove tabindex from the thumb', () => {
      const thumb = wrapper.find('[role="slider"]')
      expect(thumb.attributes('tabindex')).toBeUndefined()
    })
  })

  describe('when enabled', () => {
    it('should have tabindex on the thumb', () => {
      const thumb = wrapper.find('[role="slider"]')
      expect(thumb.attributes('tabindex')).toBe('0')
    })
  })

  describe('when invertX', () => {
    beforeEach(async () => {
      await wrapper.setProps({ invertX: true })
    })

    describe('after pressing navigation key', () => {
      let slider: DOMWrapper<HTMLElement>

      beforeEach(() => {
        slider = wrapper.find('[role="slider"]')
      })

      it('arrowRight should decrease X by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowRight' })
        expect(slider.attributes('aria-valuenow')).toBe('49,50')
      })

      it('arrowLeft should increase X by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowLeft' })
        expect(slider.attributes('aria-valuenow')).toBe('51,50')
      })

      it('arrowUp should still decrease Y by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowUp' })
        expect(slider.attributes('aria-valuenow')).toBe('50,49')
      })

      it('arrowDown should still increase Y by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowDown' })
        expect(slider.attributes('aria-valuenow')).toBe('50,51')
      })

      it('pageUp should still decrease Y by 10', async () => {
        await slider.trigger('keydown', { key: 'PageUp' })
        expect(slider.attributes('aria-valuenow')).toBe('50,40')
      })

      it('pageDown should still increase Y by 10', async () => {
        await slider.trigger('keydown', { key: 'PageDown' })
        expect(slider.attributes('aria-valuenow')).toBe('50,60')
      })

      it('home should set X to 0', async () => {
        await slider.trigger('keydown', { key: 'Home' })
        expect(slider.attributes('aria-valuenow')).toBe('0,50')
      })

      it('end should set X to max', async () => {
        await slider.trigger('keydown', { key: 'End' })
        expect(slider.attributes('aria-valuenow')).toBe('100,50')
      })
    })
  })

  describe('when invertY', () => {
    beforeEach(async () => {
      await wrapper.setProps({ invertY: true })
    })

    describe('after pressing navigation key', () => {
      let slider: DOMWrapper<HTMLElement>

      beforeEach(() => {
        slider = wrapper.find('[role="slider"]')
      })

      it('arrowUp should increase Y by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowUp' })
        expect(slider.attributes('aria-valuenow')).toBe('50,51')
      })

      it('arrowDown should decrease Y by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowDown' })
        expect(slider.attributes('aria-valuenow')).toBe('50,49')
      })

      it('arrowRight should still increase X by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowRight' })
        expect(slider.attributes('aria-valuenow')).toBe('51,50')
      })

      it('arrowLeft should still decrease X by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowLeft' })
        expect(slider.attributes('aria-valuenow')).toBe('49,50')
      })

      it('pageUp should increase Y by 10', async () => {
        await slider.trigger('keydown', { key: 'PageUp' })
        expect(slider.attributes('aria-valuenow')).toBe('50,60')
      })

      it('pageDown should decrease Y by 10', async () => {
        await slider.trigger('keydown', { key: 'PageDown' })
        expect(slider.attributes('aria-valuenow')).toBe('50,40')
      })

      it('home should still set X to 0', async () => {
        await slider.trigger('keydown', { key: 'Home' })
        expect(slider.attributes('aria-valuenow')).toBe('0,50')
      })

      it('end should still set X to max', async () => {
        await slider.trigger('keydown', { key: 'End' })
        expect(slider.attributes('aria-valuenow')).toBe('100,50')
      })
    })
  })

  describe('when both invertX and invertY', () => {
    beforeEach(async () => {
      await wrapper.setProps({ invertX: true, invertY: true })
    })

    describe('after pressing navigation key', () => {
      let slider: DOMWrapper<HTMLElement>

      beforeEach(() => {
        slider = wrapper.find('[role="slider"]')
      })

      it('arrowRight should decrease X by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowRight' })
        expect(slider.attributes('aria-valuenow')).toBe('49,50')
      })

      it('arrowLeft should increase X by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowLeft' })
        expect(slider.attributes('aria-valuenow')).toBe('51,50')
      })

      it('arrowUp should increase Y by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowUp' })
        expect(slider.attributes('aria-valuenow')).toBe('50,51')
      })

      it('arrowDown should decrease Y by 1', async () => {
        await slider.trigger('keydown', { key: 'ArrowDown' })
        expect(slider.attributes('aria-valuenow')).toBe('50,49')
      })

      it('pageUp should increase Y by 10', async () => {
        await slider.trigger('keydown', { key: 'PageUp' })
        expect(slider.attributes('aria-valuenow')).toBe('50,60')
      })

      it('pageDown should decrease Y by 10', async () => {
        await slider.trigger('keydown', { key: 'PageDown' })
        expect(slider.attributes('aria-valuenow')).toBe('50,40')
      })

      it('home should set X to 0', async () => {
        await slider.trigger('keydown', { key: 'Home' })
        expect(slider.attributes('aria-valuenow')).toBe('0,50')
      })

      it('end should set X to max', async () => {
        await slider.trigger('keydown', { key: 'End' })
        expect(slider.attributes('aria-valuenow')).toBe('100,50')
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
      expect(slider.attributes('aria-valuenow')).toBe('60,50')
    })

    it('shift+arrowLeft should decrease X by 10', async () => {
      await slider.trigger('keydown', { key: 'ArrowLeft', shiftKey: true })
      expect(slider.attributes('aria-valuenow')).toBe('40,50')
    })

    it('shift+arrowUp should decrease Y by 10', async () => {
      await slider.trigger('keydown', { key: 'ArrowUp', shiftKey: true })
      expect(slider.attributes('aria-valuenow')).toBe('50,40')
    })

    it('shift+arrowDown should increase Y by 10', async () => {
      await slider.trigger('keydown', { key: 'ArrowDown', shiftKey: true })
      expect(slider.attributes('aria-valuenow')).toBe('50,60')
    })
  })

  describe('after pointerdown event on slider-area-impl', () => {
    let sliderImpl: VueWrapper<InstanceType<typeof SliderAreaImpl>>
    beforeEach(async () => {
      sliderImpl = wrapper.findComponent('[data-slider-area-impl]') as any
      await sliderImpl.trigger('pointerdown', { clientX: 10, clientY: 10, pointerId: 1 })
    })

    describe('after pointermove', () => {
      beforeEach(async () => {
        await sliderImpl.trigger('pointermove', { clientX: 50, clientY: 50, pointerId: 1 })
      })

      describe('after pointerup', () => {
        beforeEach(async () => {
          await sliderImpl.trigger('pointerup', { pointerId: 1 })
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
      expect(slider.attributes('aria-valuenow')).toBe('51,50')
    })

    it('arrowLeft should decrease X by 1', async () => {
      await slider.trigger('keydown', { key: 'ArrowLeft' })
      expect(slider.attributes('aria-valuenow')).toBe('49,50')
    })

    it('arrowUp should decrease Y by 1', async () => {
      await slider.trigger('keydown', { key: 'ArrowUp' })
      expect(slider.attributes('aria-valuenow')).toBe('50,49')
    })

    it('arrowDown should increase Y by 1', async () => {
      await slider.trigger('keydown', { key: 'ArrowDown' })
      expect(slider.attributes('aria-valuenow')).toBe('50,51')
    })

    it('pageUp should decrease Y by 10', async () => {
      await slider.trigger('keydown', { key: 'PageUp' })
      expect(slider.attributes('aria-valuenow')).toBe('50,40')
    })

    it('pageDown should increase Y by 10', async () => {
      await slider.trigger('keydown', { key: 'PageDown' })
      expect(slider.attributes('aria-valuenow')).toBe('50,60')
    })

    it('home should set X to 0', async () => {
      await slider.trigger('keydown', { key: 'Home' })
      expect(slider.attributes('aria-valuenow')).toBe('0,50')
    })

    it('end should set X to max', async () => {
      await slider.trigger('keydown', { key: 'End' })
      expect(slider.attributes('aria-valuenow')).toBe('100,50')
    })
  })
})

describe('given slider area in a form', async () => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn().mockImplementation(id => id)
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.setPointerCapture = vi.fn()

  const wrapper = mount({
    props: ['handleSubmit'],
    components: { SliderArea },
    template: '<form @submit="handleSubmit"><SliderArea value="true" /></form>',
  }, {
    props: { handleSubmit },
  })

  it('should have hidden input field', async () => {
    expect(wrapper.find('[type="text"]').exists()).toBe(true)
  })

  describe('after clicking submit button', () => {
    beforeEach(async () => {
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ 'slider-area': '[{"x":50,"y":50}]' })
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
      expect(handleSubmit).toHaveBeenCalledTimes(2)
      expect(handleSubmit.mock.results[1].value).toStrictEqual({ 'slider-area': '[{"x":51,"y":50}]' })
    })
  })
})
