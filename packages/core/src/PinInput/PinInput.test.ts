import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import userEvent from '@testing-library/user-event'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import PinInput from './story/_PinInput.vue'

describe('given default PinInput', () => {
  // @ts-expect-error aXe throwing error complaining getComputedStyle
  window.getComputedStyle = () => {}
  let wrapper: VueWrapper<InstanceType<typeof PinInput>>
  let inputs: DOMWrapper<HTMLInputElement>[] = []

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(PinInput, { attachTo: document.body })
    inputs = wrapper.find('div').findAll('input:not([aria-hidden])')
    inputs[0].element.focus()
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('should display input placeholders', () => {
    expect(inputs[0].element.placeholder).toBe('') // first input was focused thus not showing placeholder
    expect(inputs[1].element.placeholder).toBe('*')
    expect(inputs[2].element.placeholder).toBe('*')
    expect(inputs[3].element.placeholder).toBe('*')
    expect(inputs[4].element.placeholder).toBe('*')
  })

  describe('after user input', () => {
    beforeEach(async () => {
      await userEvent.keyboard('test')
    })

    it('should populate the word in each box', () => {
      expect(inputs.map(i => i.element.value)).toStrictEqual(['t', 'e', 's', 't', ''])
    })

    describe('after user continue to input', () => {
      beforeEach(async () => {
        await userEvent.keyboard('next')
      })

      it('should complete and stop at the last input and populate remaining change', () => {
        expect(inputs.map(i => i.element.value)).toStrictEqual(['t', 'e', 's', 't', 't'])
        expect(inputs.at(-1)?.element).toBe(document.activeElement)
        expect(wrapper.find('div').attributes('data-complete')).toBe('')
      })
    })
  })

  describe('after user paste \'test\'', () => {
    beforeEach(async () => {
      await userEvent.paste('test')
    })

    it('should populate the word in each box', () => {
      expect(inputs.map(i => i.element.value)).toStrictEqual(['t', 'e', 's', 't', ''])
    })
  })

  describe('after user paste \'test\' at 2nd input', () => {
    beforeEach(async () => {
      inputs[1].element.focus()
      await userEvent.paste('test')
    })

    it('should populate the word in correct box', () => {
      expect(inputs.map(i => i.element.value)).toStrictEqual(['', 't', 'e', 's', 't'])
    })
  })

  describe('after pressing ArrowRight key', () => {
    beforeEach(async () => {
      await inputs[0].trigger('keydown', { key: 'ArrowRight' })
    })

    it('should navigate to 2nd box', () => {
      expect(inputs[1].element).toBe(document.activeElement)
    })

    describe('after pressing ArrowRight key', () => {
      beforeEach(async () => {
        await inputs[1].trigger('keydown', { key: 'ArrowRight' })
      })

      it('should navigate to 3rd box', () => {
        expect(inputs[2].element).toBe(document.activeElement)
      })

      describe('after pressing ArrowLeft key twice', () => {
        beforeEach(async () => {
          await inputs[2].trigger('keydown', { key: 'ArrowLeft' })
          await inputs[1].trigger('keydown', { key: 'ArrowLeft' })
        })

        it('should navigate back to 1st box', () => {
          expect(inputs[0].element).toBe(document.activeElement)
        })
      })
    })
  })

  describe('after inserting \'test\' and pressing Backspace key', () => {
    beforeEach(async () => {
      await userEvent.keyboard('test')
      await inputs[4].trigger('keydown', { key: 'Backspace' })
    })

    it('should navigate back to previous box and clear the value', () => {
      expect(inputs[3].element).toBe(document.activeElement)
      expect(inputs[3].element.value).toBe('')
      expect(inputs.map(i => i.element.value)).toStrictEqual(['t', 'e', 's', '', ''])
    })

    describe('after pressing Backspace again', () => {
      beforeEach(async () => {
        await inputs[3].trigger('keydown', { key: 'Backspace' })
      })

      it('should navigate back to previous box and clear the value', () => {
        expect(inputs[2].element).toBe(document.activeElement)
        expect(inputs[2].element.value).toBe('')
        expect(inputs.map(i => i.element.value)).toStrictEqual(['t', 'e', '', '', ''])
      })
    })
  })

  describe('after inserting \'test\' and pressing Delete key', () => {
    beforeEach(async () => {
      await userEvent.keyboard('test')
      inputs[1].element.focus()
      await inputs[1].trigger('keydown', { key: 'Delete' })
    })

    it('should clear the value', () => {
      expect(inputs[1].element).toBe(document.activeElement)
      expect(inputs[1].element.value).toBe('')
      expect(inputs.map(i => i.element.value)).toStrictEqual(['t', '', 's', 't', ''])
    })
  })

  describe('after completing input', async () => {
    beforeEach(async () => {
      await userEvent.keyboard('apple')
    })

    it('should emit \'complete\' with the result', () => {
      expect(wrapper.emitted('complete')?.[0]?.[0]).toStrictEqual(['a', 'p', 'p', 'l', 'e'])
    })

    describe('after resetting value', async () => {
      beforeEach(async () => {
        await userEvent.keyboard('apple')
        const button = wrapper.find('button')
        await button.trigger('click')
      })

      it('should display input placeholders', () => {
        expect(inputs[0].element.placeholder).toBe('*')
        expect(inputs[1].element.placeholder).toBe('*')
        expect(inputs[2].element.placeholder).toBe('*')
        expect(inputs[3].element.placeholder).toBe('*')
        expect(inputs[4].element.placeholder).toBe('*')
      })
    })
  })
})

describe('give PinInput type=number', async () => {
  let wrapper: VueWrapper<InstanceType<typeof PinInput>>
  let inputs: DOMWrapper<HTMLInputElement>[] = []

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(PinInput, { props: { type: 'number' }, attachTo: document.body })
    inputs = wrapper.find('div').findAll('input:not([aria-hidden])')
    inputs[0].element.focus()
  })

  it('should pass axe accessibility tests', async () => {
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  describe('after user input non-numeric word', () => {
    beforeEach(async () => {
      await userEvent.keyboard('test')
    })

    it('should not populate the word', () => {
      expect(inputs.map(i => i.element.value)).toStrictEqual(['', '', '', '', ''])
    })
  })

  describe('after user paste non-numeric word', () => {
    beforeEach(async () => {
      await userEvent.paste('test')
    })

    it('should not populate the word', () => {
      expect(inputs.map(i => i.element.value)).toStrictEqual(['', '', '', '', ''])
    })
  })

  describe('after user input numeric word', () => {
    beforeEach(async () => {
      await userEvent.keyboard('12345')
    })

    it('should populate the word in each box', () => {
      expect(inputs.map(i => i.element.value)).toStrictEqual(['1', '2', '3', '4', '5'])
    })

    it('should emit \'complete\' with the result', () => {
      expect(wrapper.emitted('complete')?.[0]?.[0]).toStrictEqual([1, 2, 3, 4, 5])
    })
  })
})
