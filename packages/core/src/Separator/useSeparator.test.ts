import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, ref } from 'vue'
import * as Reka from '../index'
import { useSeparator } from './useSeparator'

describe('useSeparator', () => {
  it('defaults to a horizontal separator without aria-orientation', () => {
    const { orientation, root } = useSeparator()
    expect(orientation.value).toBe('horizontal')
    expect(root.attrs.value).toEqual({ 'data-orientation': 'horizontal', 'aria-orientation': undefined, 'role': 'separator' })
  })

  it('sets aria-orientation when vertical and falls back on an invalid value', () => {
    const value = ref<any>('vertical')
    const { root } = useSeparator({ orientation: value })
    expect(root.attrs.value).toMatchObject({ 'data-orientation': 'vertical', 'aria-orientation': 'vertical' })
    value.value = 'diagonal'
    expect(root.attrs.value['data-orientation']).toBe('horizontal')
  })

  it('is removed from the accessibility tree when decorative', () => {
    const { root } = useSeparator({ decorative: true, orientation: 'vertical' })
    expect(root.attrs.value).toEqual({ 'data-orientation': 'vertical', 'role': 'none' })
    expect(root.state.value).toEqual({ orientation: 'vertical' })
  })

  it('renders standalone and passes axe', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        const { root } = useSeparator({ orientation: 'vertical' })
        return () => h('div', root.attrs.value)
      },
    }))
    expect(wrapper.attributes('role')).toBe('separator')
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('is exported from the package barrel', () => {
    expect(typeof Reka.useSeparator).toBe('function')
  })
})
