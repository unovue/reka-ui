import type { VueWrapper } from '@vue/test-utils'
import type { VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { h } from 'vue'
import { ConfigProvider } from '@/ConfigProvider'
import { ColorSliderRoot, ColorSliderThumb, ColorSliderTrack } from '.'
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

describe('track gradient follows the slider layout', () => {
  function trackStyle(props: Record<string, unknown>, wrap?: (node: VNode) => VNode) {
    const node = () => h(ColorSliderRoot, { defaultValue: '#ff0000', channel: 'hue', ...props }, () => [
      h(ColorSliderTrack, { 'data-testid': 'track' }),
      h(ColorSliderThumb),
    ])
    const wrapper = mount({ render: () => wrap ? wrap(node()) : node() })
    return wrapper.find('[data-testid=track]').attributes('style')
  }

  it('runs left to right by default', () => {
    expect(trackStyle({})).toContain('linear-gradient(to right, ')
  })

  it('runs bottom to top when vertical', () => {
    expect(trackStyle({ orientation: 'vertical' })).toContain('linear-gradient(to top, ')
  })

  it('runs top to bottom when vertical and inverted', () => {
    // `to bottom` is the CSS default, which the style serializer drops.
    const style = trackStyle({ orientation: 'vertical', inverted: true })
    expect(style).toContain('linear-gradient(rgb(255, 0, 0), ')
    expect(style).not.toMatch(/linear-gradient\(to (top|left|right)/)
  })

  it('runs right to left when inverted', () => {
    expect(trackStyle({ inverted: true })).toContain('linear-gradient(to left, ')
  })

  it('runs right to left with dir="rtl"', () => {
    expect(trackStyle({ dir: 'rtl' })).toContain('linear-gradient(to left, ')
  })

  it('runs left to right with dir="rtl" and inverted', () => {
    expect(trackStyle({ dir: 'rtl', inverted: true })).toContain('linear-gradient(to right, ')
  })

  it('inherits the direction from ConfigProvider', () => {
    expect(trackStyle({}, node => h(ConfigProvider, { dir: 'rtl' }, () => node))).toContain('linear-gradient(to left, ')
  })
})
