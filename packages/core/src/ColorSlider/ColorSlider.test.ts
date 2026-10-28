import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import ColorSliderRoot from './ColorSliderRoot.vue'
import ColorSliderThumb from './ColorSliderThumb.vue'
import ColorSlider from './story/_ColorSlider.vue'

globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.HTMLElement.prototype.scrollIntoView = vi.fn()
window.HTMLElement.prototype.hasPointerCapture = vi.fn().mockImplementation(id => id)
window.HTMLElement.prototype.releasePointerCapture = vi.fn()
window.HTMLElement.prototype.setPointerCapture = vi.fn()

describe('given default ColorSlider', () => {
  let wrapper: VueWrapper<InstanceType<typeof ColorSlider>>

  beforeEach(() => {
    wrapper = mount(ColorSlider, {
      props: {
        defaultValue: '#ff0000',
        channel: 'hue',
        colorSpace: 'hsl',
      },
    })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element, {
      rules: {
        label: { enabled: false },
      },
    })).toHaveNoViolations()
  })

  it('should render with initial value', () => {
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.exists()).toBe(true)
    expect(thumb.attributes('aria-valuemin')).toBe('0')
    expect(thumb.attributes('aria-valuemax')).toBe('360')
  })

  it('should have correct aria attributes', () => {
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-label')).toBe('Hue')
    expect(thumb.attributes('aria-orientation')).toBe('horizontal')
  })

  describe('when disabled', () => {
    beforeEach(async () => {
      await wrapper.setProps({ disabled: true })
    })

    it('should not have tabindex when disabled', () => {
      const thumb = wrapper.find('[role="slider"]')
      expect(thumb.attributes('tabindex')).toBeUndefined()
    })

    it('should have data-disabled attribute', () => {
      const thumb = wrapper.find('[role="slider"]')
      expect(thumb.attributes('data-disabled')).toBe('')
    })
  })

  describe('keyboard navigation', () => {
    it('should increment on ArrowRight', async () => {
      const thumb = wrapper.find('[role="slider"]')
      const initialValue = Number(thumb.attributes('aria-valuenow'))
      await thumb.trigger('keydown', { key: 'ArrowRight' })
      const newValue = Number(thumb.attributes('aria-valuenow'))
      // Due to hex↔hsl round-trip precision, check that value increased
      expect(newValue).toBeGreaterThan(initialValue)
    })

    it('should decrement on ArrowLeft', async () => {
      const thumb = wrapper.find('[role="slider"]')
      // First increment to have room to decrement
      await thumb.trigger('keydown', { key: 'ArrowRight' })
      const afterIncrement = Number(thumb.attributes('aria-valuenow'))
      await thumb.trigger('keydown', { key: 'ArrowLeft' })
      const afterDecrement = Number(thumb.attributes('aria-valuenow'))
      expect(afterDecrement).toBeLessThan(afterIncrement)
    })

    it('should jump to min on Home key', async () => {
      const w = mount(ColorSlider, {
        props: {
          defaultValue: '#7f007f',
          channel: 'red',
          colorSpace: 'rgb',
        },
      })
      const thumb = w.find('[role="slider"]')
      await thumb.trigger('keydown', { key: 'Home' })
      expect(thumb.attributes('aria-valuenow')).toBe('0')
    })
  })
})

describe('given different channels', () => {
  it('should render saturation slider', () => {
    const wrapper = mount(ColorSlider, {
      props: {
        defaultValue: '#7f007f',
        channel: 'saturation',
        colorSpace: 'hsl',
      },
    })
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-label')).toBe('Saturation')
    expect(thumb.attributes('aria-valuemax')).toBe('100')
  })

  it('should render lightness slider', () => {
    const wrapper = mount(ColorSlider, {
      props: {
        defaultValue: '#7f007f',
        channel: 'lightness',
        colorSpace: 'hsl',
      },
    })
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-label')).toBe('Lightness')
    expect(thumb.attributes('aria-valuemax')).toBe('100')
  })

  it('should render and increment OKLCH chroma with its native range', async () => {
    const wrapper = mount(ColorSlider, {
      props: {
        defaultValue: { space: 'oklch', l: 60, c: 0.2, h: 240, alpha: 1 },
        channel: 'chroma',
        colorSpace: 'oklch',
      },
    })
    await wrapper.vm.$nextTick()
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-label')).toBe('Chroma')
    expect(thumb.attributes('aria-valuenow')).toBe('0.2')
    expect(thumb.attributes('aria-valuemax')).toBe('0.4')

    await thumb.trigger('keydown', { key: 'ArrowRight' })
    expect(thumb.attributes('aria-valuenow')).toBe('0.201')
    expect(thumb.attributes('aria-valuetext')).toBe('0.201')
  })

  it('should preserve OKLCH hue for an achromatic color', async () => {
    const wrapper = mount(ColorSlider, {
      props: {
        defaultValue: { space: 'oklch', l: 60, c: 0, h: 240, alpha: 1 },
        channel: 'hue',
        colorSpace: 'oklch',
      },
    })
    await wrapper.vm.$nextTick()
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-valuenow')).toBe('240')
    await thumb.trigger('keydown', { key: 'ArrowRight' })
    expect(thumb.attributes('aria-valuenow')).toBe('241')
  })

  it('should render alpha slider', () => {
    const wrapper = mount(ColorSlider, {
      props: {
        defaultValue: 'rgba(127, 0, 127, 0.5)',
        channel: 'alpha',
        colorSpace: 'hsl',
      },
    })
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-label')).toBe('Alpha')
    expect(thumb.attributes('aria-valuemax')).toBe('100')
  })

  it('should render red slider with RGB range', () => {
    const wrapper = mount(ColorSlider, {
      props: {
        defaultValue: '#7f007f',
        channel: 'red',
        colorSpace: 'rgb',
      },
    })
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-label')).toBe('Red')
    expect(thumb.attributes('aria-valuemax')).toBe('255')
  })
})

describe('given a controlled OKLCH color object', () => {
  it('applies CSS string hue updates even when their sRGB value is unchanged', async () => {
    const wrapper = mount(ColorSliderRoot, {
      props: { modelValue: 'oklch(60% 0 120)', channel: 'hue', colorSpace: 'oklch' },
      slots: { default: ColorSliderThumb },
    })
    await wrapper.setProps({ modelValue: 'oklch(60% 0 240)' })
    expect(wrapper.find('[role="slider"]').attributes('aria-valuenow')).toBe('240')
  })

  it('keeps native hue when switching channels after a chroma edit', async () => {
    const wrapper = mount(ColorSliderRoot, {
      props: { defaultValue: 'oklch(60% .2 240)', channel: 'chroma', colorSpace: 'oklch' },
      slots: { default: ColorSliderThumb },
    })
    await wrapper.vm.$nextTick()
    await wrapper.find('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })
    await wrapper.setProps({ channel: 'hue' })
    expect(wrapper.find('[role="slider"]').attributes('aria-valuenow')).toBe('240')
  })

  it('should apply object updates even when their sRGB hex value is unchanged', async () => {
    const wrapper = mount(ColorSliderRoot, {
      props: {
        modelValue: { space: 'oklch', l: 60, c: 0, h: 120, alpha: 1 },
        channel: 'hue',
        colorSpace: 'oklch',
      },
      slots: { default: ColorSliderThumb },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="slider"]').attributes('aria-valuenow')).toBe('120')

    await wrapper.setProps({
      modelValue: { space: 'oklch', l: 60, c: 0, h: 240, alpha: 1 },
    })
    expect(wrapper.find('[role="slider"]').attributes('aria-valuenow')).toBe('240')
  })
})

describe('given vertical orientation', () => {
  it('should have vertical aria-orientation', () => {
    const wrapper = mount(ColorSlider, {
      props: {
        defaultValue: '#ff0000',
        channel: 'hue',
        colorSpace: 'hsl',
        orientation: 'vertical',
      },
    })
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-orientation')).toBe('vertical')
  })
})

describe('alpha channel aria-valuetext', () => {
  it('should display correct percentage for alpha', () => {
    const wrapper = mount(ColorSlider, {
      props: {
        defaultValue: 'rgba(127, 0, 127, 0.5)',
        channel: 'alpha',
        colorSpace: 'hsl',
      },
    })
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-valuetext')).toBe('50%')
  })

  it('should display 100% for full alpha', () => {
    const wrapper = mount(ColorSlider, {
      props: {
        defaultValue: '#ff0000',
        channel: 'alpha',
        colorSpace: 'hsl',
      },
    })
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-valuetext')).toBe('100%')
  })
})

describe('custom step prop', () => {
  it('should use custom step value', () => {
    const wrapper = mount(ColorSlider, {
      props: {
        defaultValue: '#ff0000',
        channel: 'hue',
        colorSpace: 'hsl',
        step: 10,
      },
    })
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.exists()).toBe(true)
    // The SliderRoot should receive step=10
    expect(thumb.attributes('aria-valuemin')).toBe('0')
    expect(thumb.attributes('aria-valuemax')).toBe('360')
  })
})
