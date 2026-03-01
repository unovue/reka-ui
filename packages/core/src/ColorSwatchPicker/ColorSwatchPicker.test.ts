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
})
