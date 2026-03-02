import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import ColorSwatchPicker from './story/_ColorSwatchPicker.vue'

describe('given default ColorSwatchPicker', () => {
  let wrapper: VueWrapper<InstanceType<typeof ColorSwatchPicker>>
  let content: DOMWrapper<Element>
  let items: DOMWrapper<Element>[]

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(ColorSwatchPicker, { attachTo: document.body })
    content = wrapper.find('[role=listbox]')
    items = wrapper.findAll('[role=option]')
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('should render the component', () => {
    expect(wrapper.exists()).toBe(true)
    expect(content.exists()).toBe(true)
    expect(items.length).toBeGreaterThan(0)
  })

  it('should have no accessibility violations', async () => {
    const results = await axe(wrapper.element)
    expect(results).toHaveNoViolations()
  })

  it('should render items with data-color attributes', () => {
    expect(items[0].attributes('data-color')).toBe('#E5484D')
    expect(items[1].attributes('data-color')).toBe('#D6409F')
  })

  it('should set CSS variable on items', () => {
    expect(items[0].attributes('style')).toContain('--reka-color-swatch-picker-item-color: #E5484D')
  })

  it('should have aria-label on items with color name', () => {
    for (const item of items) {
      expect(item.attributes('aria-label')).toBeTruthy()
    }
  })

  describe('selection', () => {
    it('should select an item on click', async () => {
      await items[0].trigger('click')
      expect(items[0].attributes('data-state')).toBe('checked')
    })

    it('should update selection when clicking a different item', async () => {
      await items[0].trigger('click')
      expect(items[0].attributes('data-state')).toBe('checked')

      await items[2].trigger('click')
      expect(items[2].attributes('data-state')).toBe('checked')
      expect(items[0].attributes('data-state')).toBe('unchecked')
    })
  })

  describe('keyboard navigation', () => {
    it('should have horizontal orientation for keyboard navigation', () => {
      expect(content.attributes('aria-orientation')).toBe('horizontal')
    })

    it('should have role=option on items', () => {
      for (const item of items) {
        expect(item.attributes('role')).toBe('option')
      }
    })
  })
})
