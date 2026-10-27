import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, ref } from 'vue'
import * as Reka from '../index'
import { useLabel } from './useLabel'

describe('useLabel', () => {
  it('returns `for` and the mousedown guard, no data-*', () => {
    const { root } = useLabel({ for: 'name' })
    expect(root.attrs.value.for).toBe('name')
    expect(typeof root.attrs.value.onMousedown).toBe('function')
    expect(Object.keys(root.attrs.value).some(key => key.startsWith('data-'))).toBe(false)
  })

  it('tracks a reactive `for`', () => {
    const target = ref('a')
    const { root } = useLabel({ for: target })
    target.value = 'b'
    expect(root.attrs.value.for).toBe('b')
  })

  it('prevents text selection on a double-click mousedown only', () => {
    const { root } = useLabel()
    const double = new MouseEvent('mousedown', { detail: 2, cancelable: true })
    root.attrs.value.onMousedown(double)
    expect(double.defaultPrevented).toBe(true)
    const single = new MouseEvent('mousedown', { detail: 1, cancelable: true })
    root.attrs.value.onMousedown(single)
    expect(single.defaultPrevented).toBe(false)
  })

  it('renders standalone and passes axe', async () => {
    const wrapper = mount(defineComponent({
      setup() {
        const { root } = useLabel({ for: 'field' })
        return () => h('div', [h('label', root.attrs.value, 'Name'), h('input', { id: 'field' })])
      },
    }))
    expect(wrapper.find('label').attributes('for')).toBe('field')
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('is exported from the package barrel', () => {
    expect(typeof Reka.useLabel).toBe('function')
  })
})
