import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, ref } from 'vue'
import * as Reka from '../index'
import { useAspectRatio } from './useAspectRatio'

describe('useAspectRatio', () => {
  it('derives the bottom padding from the ratio (default 1)', () => {
    expect(useAspectRatio().aspect.value).toBe(100)
    const ratio = ref(16 / 9)
    const { aspect, wrapper } = useAspectRatio({ ratio })
    expect(aspect.value).toBe(56.25)
    expect(wrapper.attrs.value.style).toMatchObject({ 'padding-bottom': '56.25%' })
    ratio.value = 2
    expect(aspect.value).toBe(50)
  })

  it('renders standalone and passes axe', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        const { wrapper, root } = useAspectRatio({ ratio: 2 })
        return () => h('div', wrapper.attrs.value, [h('div', { ...root.attrs.value, class: 'inner' }, 'content')])
      },
    }))
    expect(wrapper.attributes('data-reka-aspect-ratio-wrapper')).toBe('')
    expect(wrapper.attributes('style')).toBe('position: relative; width: 100%; padding-bottom: 50%;')
    expect(wrapper.find('.inner').attributes('style')).toBe('position: absolute; inset: 0px;')
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('is exported from the package barrel', () => {
    expect(typeof Reka.useAspectRatio).toBe('function')
  })
})
