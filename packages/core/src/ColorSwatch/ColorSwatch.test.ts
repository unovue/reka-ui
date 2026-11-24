import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { ColorSwatch } from '.'

describe('colorSwatch', () => {
  describe('given a default ColorSwatch', () => {
    it('should pass axe accessibility tests', async () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '#E5484D' },
        attachTo: document.body,
      })
      expect(await axe(wrapper.element)).toHaveNoViolations()
    })

    it('should render with role="img"', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '#E5484D' },
      })
      expect(wrapper.attributes('role')).toBe('img')
    })

    it('should render with aria-roledescription="color swatch"', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '#E5484D' },
      })
      expect(wrapper.attributes('aria-roledescription')).toBe('color swatch')
    })
  })

  describe('aria-label', () => {
    it('should derive color name as aria-label for hex color', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '#ff0000' },
      })
      const label = wrapper.attributes('aria-label')
      expect(label).toBeTruthy()
      expect(label).not.toBe('#ff0000')
    })

    it('should use custom label when provided', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '#E5484D', label: 'Brand Red' },
      })
      expect(wrapper.attributes('aria-label')).toBe('Brand Red')
    })

    it('should show "transparent" for alpha=0 color', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '#ff000000' },
      })
      expect(wrapper.attributes('aria-label')).toBe('transparent')
    })

    it('should show "transparent" for empty color', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '' },
      })
      expect(wrapper.attributes('aria-label')).toBe('transparent')
    })

    it('should show "transparent" when no color prop provided', () => {
      const wrapper = mount(ColorSwatch)
      expect(wrapper.attributes('aria-label')).toBe('transparent')
    })
  })

  describe('color object support', () => {
    it('should accept Color object', () => {
      const wrapper = mount(ColorSwatch, {
        props: {
          color: { space: 'hsl' as const, h: 120, s: 50, l: 50, alpha: 1 },
        },
      })
      expect(wrapper.element).toBeTruthy()
      expect(wrapper.attributes('aria-label')).toBeTruthy()
    })
  })

  describe('data attributes', () => {
    it('should set data-no-color when alpha is 0', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '#ff000000' },
      })
      expect(wrapper.attributes('data-no-color')).toBe('')
    })

    it('should set data-no-color when no color', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '' },
      })
      expect(wrapper.attributes('data-no-color')).toBe('')
    })

    it('should not set data-no-color for opaque color', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '#E5484D' },
      })
      expect(wrapper.attributes('data-no-color')).toBeUndefined()
    })

    it('should set data-color-contrast to light for dark colors', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '#000000' },
      })
      // "light" means text should be light on this dark background
      expect(wrapper.attributes('data-color-contrast')).toBe('light')
    })

    it('should set data-color-contrast to dark for bright colors', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '#ffffff' },
      })
      // "dark" means text should be dark on this light background
      expect(wrapper.attributes('data-color-contrast')).toBe('dark')
    })
  })

  describe('cSS variables', () => {
    it('should set --reka-color-swatch-color', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '#E5484D' },
      })
      expect(wrapper.attributes('style')).toContain('--reka-color-swatch-color: #E5484D')
    })

    it('should set --reka-color-swatch-alpha', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '#E5484D' },
      })
      expect(wrapper.attributes('style')).toContain('--reka-color-swatch-alpha: 1')
    })
  })

  describe('slot', () => {
    it('should expose color and alpha via slot', () => {
      const wrapper = mount(ColorSwatch, {
        props: { color: '#E5484D' },
        slots: {
          default: ({ color, alpha }: { color: string, alpha: number }) => {
            return `${color}-${alpha}`
          },
        },
      })
      expect(wrapper.text()).toContain('#E5484D')
      expect(wrapper.text()).toContain('1')
    })
  })
})
