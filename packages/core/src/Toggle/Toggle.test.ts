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
    expect(await axe(wrapper.get('button').element)).toHaveNoViolations()
  })

  it('should not be toggled yet', () => {
    expect(wrapper.get('button').attributes('data-state')).toBe('off')
  })

  describe('after toggling', () => {
    beforeEach(async () => {
      await wrapper.get('button').trigger('click')
    })

    it('should be toggled on', () => {
      expect(wrapper.get('button').attributes('data-state')).toBe('on')
    })

    describe('after toggling again', () => {
      beforeEach(async () => {
        await wrapper.get('button').trigger('click')
      })

      it('should be toggled off', () => {
        expect(wrapper.get('button').attributes('data-state')).toBe('off')
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
    expect(await axe(wrapper.get('button').element)).toHaveNoViolations()
  })

  it('should not be toggled yet', () => {
    expect(wrapper.get('button').attributes('data-state')).toBe('off')
  })

  describe('try toggling', () => {
    beforeEach(async () => {
      await wrapper.get('button').trigger('click')
    })

    it('should be toggled off', () => {
      expect(wrapper.get('button').attributes('data-state')).toBe('off')
    })

    it('should render disable attributes', () => {
      expect(wrapper.get('button').attributes('data-disabled')).toBe('')
      expect(wrapper.get('button').attributes('disabled')).toBe('')
    })
  })
})

describe('given Toggle in a form', () => {
  const wrapper = mount({
    components: { Toggle },
    template: '<form><Toggle name="test" aria-label="Toggle italic" /></form>',
  })

  it('should have hidden input field', () => {
    expect(wrapper.find('[type="checkbox"]').exists()).toBe(true)
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should not nest the hidden input inside the interactive control', () => {
    expect(wrapper.find('button input').exists()).toBe(false)
  })
})
