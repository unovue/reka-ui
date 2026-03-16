import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import userEvent from '@testing-library/user-event'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { nextTick } from 'vue'
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

  describe('caret handling', () => {
    it('should handle caret at the start of the input', async () => {
      await userEvent.keyboard('a')
      inputs[0].element.focus()
      inputs[0].element.setSelectionRange(0, 0)
      await userEvent.keyboard('b')
      expect(inputs.map(i => i.element.value)).toStrictEqual(['b', '', '', '', ''])
      expect(inputs[1].element).toBe(document.activeElement)
    })

    it('should handle caret at the end of the input (default focus)', async () => {
      await userEvent.keyboard('a')
      inputs[0].element.focus()
      await userEvent.keyboard('b')
      expect(inputs.map(i => i.element.value)).toStrictEqual(['b', '', '', '', ''])
      expect(inputs[1].element).toBe(document.activeElement)
    })
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

        // It should be "*", but the "document.activeElement"
        // is not updated to correctly in the test environment
        // thus the placeholder is not correctly updated in tests.
        // expect(inputs[4].element.placeholder).toBe('*')
      })
    })
  })

  describe('render placeholder', () => {
    it('should render correct placeholder', async () => {
      expect(inputs[0].element.placeholder).toBe('')
      expect(inputs[1].element.placeholder).toBe('*')
      expect(inputs[2].element.placeholder).toBe('*')
      expect(inputs[3].element.placeholder).toBe('*')
      expect(inputs[4].element.placeholder).toBe('*')

      await userEvent.keyboard('a')
      expect(inputs[0].element.placeholder).toBe('*')
      // now focus moved to 2nd input
      expect(inputs[1].element.placeholder).toBe('')

      // focus to hide placeholder
      inputs[2].element.focus()
      await nextTick()
      expect(inputs[1].element.placeholder).toBe('*')
      expect(inputs[2].element.placeholder).toBe('')

      inputs[0].element.focus()
      await inputs[0].trigger('keydown', { key: 'Backspace' })
      expect(inputs[0].element.placeholder).toBe('')
      inputs[1].element.focus()
      await nextTick()
      // input is empty and not focused thus showing placeholder
      expect(inputs[0].element.placeholder).toBe('*')

      // backspace to previous input and delete value
      inputs[0].element.focus()
      await userEvent.keyboard('a')
      await inputs[1].trigger('keydown', { key: 'Backspace' })
      expect(inputs[0].element.placeholder).toBe('')
      expect(inputs[1].element.placeholder).toBe('*')
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

  describe('after user paste mixed alphanumeric text', () => {
    beforeEach(async () => {
      await userEvent.paste('a1b2c3')
    })

    it('should only populate numeric characters', () => {
      expect(inputs.map(i => i.element.value)).toStrictEqual(['1', '2', '3', '', ''])
    })
  })

  describe('after user paste mixed text with enough numeric characters', () => {
    beforeEach(async () => {
      await userEvent.paste('a1b2c3d4e5')
    })

    it('should populate all boxes with numeric characters only', () => {
      expect(inputs.map(i => i.element.value)).toStrictEqual(['1', '2', '3', '4', '5'])
    })

    it('should emit \'complete\' with the result', () => {
      expect(wrapper.emitted('complete')?.[0]?.[0]).toStrictEqual([1, 2, 3, 4, 5])
    })
  })

  describe('after user paste mixed text at 2nd input', () => {
    beforeEach(async () => {
      inputs[1].element.focus()
      await userEvent.paste('a1b2c3')
    })

    it('should populate numeric characters in correct boxes', () => {
      expect(inputs.map(i => i.element.value)).toStrictEqual(['', '1', '2', '3', ''])
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

    it('should delete the last input when pressing Backspace', async () => {
      await inputs[4].trigger('keydown', { key: 'Backspace' })
      expect(inputs[4].element).toBe(document.activeElement)
      expect(inputs.map(i => i.element.value)).toStrictEqual(['1', '2', '3', '4', ''])
    })

    it('should delete all values input when pressing Backspace for each input', async () => {
      // Delete the last value
      await inputs[4].trigger('keydown', { key: 'Backspace' })
      // Press again to move focus to the previous input
      await inputs[4].trigger('keydown', { key: 'Backspace' })
      await inputs[3].trigger('keydown', { key: 'Backspace' })
      await inputs[2].trigger('keydown', { key: 'Backspace' })
      await inputs[1].trigger('keydown', { key: 'Backspace' })
      await inputs[0].trigger('keydown', { key: 'Backspace' })

      expect(inputs[0].element).toBe(document.activeElement)
      expect(inputs.map(i => i.element.value)).toStrictEqual(['', '', '', '', ''])
    })
  })

  describe('after user input numeric word consisting only of zeros', () => {
    beforeEach(async () => {
      await userEvent.keyboard('00000')
    })

    it('should populate the word in each box', () => {
      expect(inputs.map(i => i.element.value)).toStrictEqual(['0', '0', '0', '0', '0'])
    })

    it('should emit \'complete\' with the result', () => {
      expect(wrapper.emitted('complete')?.[0]?.[0]).toStrictEqual([0, 0, 0, 0, 0])
    })
  })

  describe('autofill', () => {
    it('should populate the opt code in each box', async () => {
      /**
       * https://github.com/unovue/reka-ui/issues/2210
       * Password managers (like 1Password, Bitwarden, etc.) fill PIN inputs with `input` events
       */
      for (const input of inputs) {
        input.setValue('0')
        input.trigger('input', { data: undefined })
      }
      await nextTick()

      expect(inputs.map(i => i.element.value)).toStrictEqual(['0', '0', '0', '0', '0'])
      expect(wrapper.emitted('complete')?.[0]?.[0]).toStrictEqual([0, 0, 0, 0, 0])
    })
  })
})

describe('give OTP PinInput', () => {
  // @ts-expect-error aXe throwing error complaining getComputedStyle
  window.getComputedStyle = () => {}
  let wrapper: VueWrapper<InstanceType<typeof PinInput>>
  let inputs: DOMWrapper<HTMLInputElement>[] = []

  beforeEach(() => {
    document.body.innerHTML = ''
    wrapper = mount(PinInput, { attachTo: document.body, props: { otp: true } })
    inputs = wrapper.find('div').findAll('input:not([aria-hidden])')
    inputs[0].element.focus()
  })

  it('should disable later inputs if there are empty inputs before them', async () => {
    inputs[1].element.focus()
    expect(document.activeElement).toBe(inputs[0].element)
  })
})
