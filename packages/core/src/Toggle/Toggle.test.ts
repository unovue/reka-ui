import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { Toggle } from '.'

describe('given default Toggle', () => {
  let wrapper: VueWrapper<InstanceType<typeof Toggle>>
  let button: DOMWrapper<HTMLButtonElement>

  beforeEach(() => {
    wrapper = mount(Toggle, {
      attrs: { 'aria-label': 'Toggle italic' },
    })
    button = wrapper.find('button')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(button.element)).toHaveNoViolations()
  })

  it('should not be toggled yet', () => {
    expect(button.attributes('data-state')).toBe('off')
  })

  describe('after toggling', () => {
    beforeEach(async () => {
      await button.trigger('click')
    })

    it('should be toggled on', () => {
      expect(button.attributes('data-state')).toBe('on')
    })

    describe('after toggling again', () => {
      beforeEach(async () => {
        await button.trigger('click')
      })

      it('should be toggled off', () => {
        expect(button.attributes('data-state')).toBe('off')
      })
    })
  })
})

describe('given disabled Toggle', () => {
  let wrapper: VueWrapper<InstanceType<typeof Toggle>>
  let button: DOMWrapper<HTMLButtonElement>

  beforeEach(() => {
    wrapper = mount(Toggle, {
      props: { disabled: true },
      attrs: { 'aria-label': 'Toggle italic' },
    })
    button = wrapper.find('button')
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should not be toggled yet', () => {
    expect(button.attributes('data-state')).toBe('off')
  })

  describe('try toggling', () => {
    beforeEach(async () => {
      await button.trigger('click')
    })

    it('should be toggled off', () => {
      expect(button.attributes('data-state')).toBe('off')
    })

    it('should render disable attributes', () => {
      expect(button.attributes('data-disabled')).toBe('')
      expect(button.attributes('disabled')).toBe('')
    })
  })
})

describe('given a Toggle in a form', () => {
  const wrapper = mount({
    components: { Toggle },
    template: '<form><Toggle name="test" aria-label="Toggle" /></form>',
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })
})
