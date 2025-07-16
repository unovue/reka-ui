import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { Toggle } from '.'

describe('given default Toggle', () => {
  let wrapper: VueWrapper<InstanceType<typeof Toggle>>

  beforeEach(() => {
    wrapper = mount(Toggle, {
      attrs: { 'aria-label': 'Toggle italic' },
    })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should not be toggled yet', () => {
    expect(wrapper.attributes('data-state')).toBe('off')
  })

  describe('after toggling', () => {
    beforeEach(() => {
      wrapper.trigger('click')
    })

    it('should be toggled on', () => {
      expect(wrapper.attributes('data-state')).toBe('on')
    })

    describe('after toggling again', () => {
      beforeEach(() => {
        wrapper.trigger('click')
      })

      it('should be toggled off', () => {
        expect(wrapper.attributes('data-state')).toBe('off')
      })
    })
  })
})

describe('given disabled Toggle', () => {
  let wrapper: VueWrapper<InstanceType<typeof Toggle>>

  beforeEach(() => {
    wrapper = mount(Toggle, {
      props: { disabled: true },
      attrs: { 'aria-label': 'Toggle italic' },
    })
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should not be toggled yet', () => {
    expect(wrapper.attributes('data-state')).toBe('off')
  })

  describe('try toggling', () => {
    beforeEach(() => {
      wrapper.trigger('click')
    })

    it('should be toggled off', () => {
      expect(wrapper.attributes('data-state')).toBe('off')
    })

    it('should render disable attributes', () => {
      expect(wrapper.attributes('data-disabled')).toBe('')
      expect(wrapper.attributes('disabled')).toBe('')
    })
  })
})
