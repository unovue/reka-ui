import type { NumberFieldRootProps } from './NumberFieldRoot.vue'
import userEvent from '@testing-library/user-event'
import { fireEvent, render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { useKbd } from '@/shared'
import { handleSubmit } from '@/test'
import NumberField from './story/_NumberField.vue'

function setup(props?: NumberFieldRootProps) {
  const user = userEvent.setup()
  const returned = render(NumberField, { props })
  const root = returned.getByTestId('root')
  const input = returned.getByTestId('input') as HTMLInputElement
  const label = returned.getByTestId('label')
  const increment = returned.getByTestId('increment')
  const decrement = returned.getByTestId('decrement')
  expect(root).toBeVisible()
  return { ...returned, user, root, input, label, increment, decrement }
}

const kbd = useKbd()
describe('numberField', () => {
  beforeEach(() => {
    // @ts-expect-error aXe throwing error complaining getComputedStyle
    window.getComputedStyle = () => ({
      display: '',
    })
    document.body.innerHTML = ''
  })

  it('should pass axe accessibility tests', async () => {
    const { root } = setup()
    expect(await axe(root)).toHaveNoViolations()
  })

  it('should show a default value if provided', async () => {
    const { input } = setup({ defaultValue: 5 })
    expect(input.value).toBe('5')
  })

  it('should show modelValue if provided', async () => {
    const { input } = setup({ modelValue: 10 })
    expect(input.value).toBe('10')
  })

  it('should show negative sign if less than 0', async () => {
    const { input } = setup({ modelValue: -10 })
    expect(input.value).toBe('-10')
  })

  it('should restart from 0 when clearing the value', async () => {
    const { input, increment } = setup({ defaultValue: 5 })

    await userEvent.clear(input)

    expect(input.value).toBe('')
    await userEvent.click(document.body)
    await userEvent.click(increment)
    expect(input.value).toBe('0')
  })

  it('should increase and decrease based on default step', async () => {
    const { input, increment, decrement } = setup({ defaultValue: 10 })
    expect(input.value).toBe('10')

    await userEvent.click(increment)
    expect(input.value).toBe('11')
    await userEvent.click(increment)
    expect(input.value).toBe('12')

    await userEvent.click(decrement)
    expect(input.value).toBe('11')
    await userEvent.click(decrement)
    expect(input.value).toBe('10')
  })

  it('should increase and decrease based on given step', async () => {
    const { input, increment, decrement } = setup({ defaultValue: 0, step: 3 })
    expect(input.value).toBe('0')

    await userEvent.click(increment)
    expect(input.value).toBe('3')
    await userEvent.click(increment)
    expect(input.value).toBe('6')

    await userEvent.click(decrement)
    expect(input.value).toBe('3')
    await userEvent.click(decrement)
    expect(input.value).toBe('0')
  })

  it('should increase and decrease based on keyboard navigation on input', async () => {
    const { input } = setup({ defaultValue: 0, min: 0, max: 10 })

    await fireEvent.keyDown(input, { key: kbd.ARROW_UP })
    expect(input.value).toBe('1')
    await fireEvent.keyDown(input, { key: kbd.ARROW_DOWN })
    expect(input.value).toBe('0')
    await fireEvent.keyDown(input, { key: kbd.END })
    expect(input.value).toBe('10')
    await fireEvent.keyDown(input, { key: kbd.HOME })
    expect(input.value).toBe('0')
  })

  it('should not be changed when disabled', async () => {
    const { root, input, increment, decrement } = setup({ defaultValue: 0, disabled: true })

    expect(root.getAttribute('data-disabled')).toBe('')
    expect(input.getAttribute('data-disabled')).toBe('')
    await fireEvent.keyDown(input, { key: kbd.ARROW_UP })
    expect(input.value).toBe('0')
    await fireEvent.keyDown(input, { key: kbd.ARROW_DOWN })
    expect(input.value).toBe('0')
    await userEvent.click(increment)
    expect(input.value).toBe('0')
    await userEvent.click(decrement)
    expect(input.value).toBe('0')
  })

  describe('with disable wheel change option', () => {
    it('should update value when scroll by default', async () => {
      const { input } = setup({
        defaultValue: 10,
      })
      input.focus()
      expect(input.value).toBe('10')
      await fireEvent.wheel(input, {
        deltaY: 100, // Positive value for scrolling down
      })
      expect(input.value).toBe('11')
      await fireEvent.wheel(input, {
        deltaY: -100, // Negative value for scrolling up
      })
      expect(input.value).toBe('10')
    })

    it('should invert update value when `invertWheelChange` is `true`', async () => {
      const { input } = setup({
        defaultValue: 10,
        invertWheelChange: true,
      })
      input.focus()
      expect(input.value).toBe('10')
      await fireEvent.wheel(input, {
        deltaY: 100, // Positive value for scrolling down
      })
      expect(input.value).toBe('9')
      await fireEvent.wheel(input, {
        deltaY: -100, // Negative value for scrolling up
      })
      expect(input.value).toBe('10')
    })

    it('should not update value when `disableWheelChange` is `true`', async () => {
      const { input } = setup({
        defaultValue: 10,
        disableWheelChange: true,
      })
      input.focus()
      expect(input.value).toBe('10')
      await fireEvent.wheel(input, {
        deltaY: 100, // Positive value for scrolling down
      })
      expect(input.value).toBe('10')
    })
  })

  describe('with different formatOptions', () => {
    it('should show decimal point', async () => {
      const { input } = setup({
        defaultValue: 10,
        formatOptions: {
          signDisplay: 'exceptZero',
          minimumFractionDigits: 1,
        },
      })
      expect(input.value).toBe('+10.0')
    })

    it('should show percentage', async () => {
      const { input } = setup({
        defaultValue: 0.05,
        step: 0.01,
        formatOptions: {
          style: 'percent',
        },
      })
      expect(input.value).toBe('5%')
    })

    it('should show currency', async () => {
      const { input } = setup({
        defaultValue: 5,
        formatOptions: {
          style: 'currency',
          currency: 'EUR',
          currencyDisplay: 'code',
          currencySign: 'accounting',
        },
      })
      expect(input.value).toBe('EUR 5.00')
    })

    it('should show units', async () => {
      const { input } = setup({
        defaultValue: 5,
        formatOptions: {
          style: 'unit',
          unit: 'inch',
          unitDisplay: 'long',
        },
      })
      expect(input.value).toBe('5 inches')
    })

    it('should change format based on reactive options', async () => {
      const { input, rerender } = setup({
        defaultValue: 5,
        formatOptions: {
          style: 'currency',
          currency: 'EUR',
          currencyDisplay: 'code',
          currencySign: 'accounting',
        },
      })
      expect(input.value).toBe('EUR 5.00')
      await rerender({
        defaultValue: 5,
        formatOptions: {
          style: 'currency',
          currency: 'USD',
          currencyDisplay: 'code',
          currencySign: 'accounting',
        },
      })
      expect(input.value).toBe('USD 5.00')
    })
  })

  describe('given min/max with step condition', () => {
    it('should compute min with step correctly', async () => {
      const { input } = setup({ min: 2, step: 3 })

      expect(input.value).toBe('')
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP })
      expect(input.value).toBe('2')
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP })
      expect(input.value).toBe('5')
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP })
      expect(input.value).toBe('8')
    })

    it('should compute min-max with step correctly', async () => {
      const { input } = setup({ min: 2, max: 21, step: 3, stepSnapping: true })

      expect(input.value).toBe('')
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP }) // 2
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP }) // 5
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP }) // 8
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP }) // 11
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP }) // 14
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP }) // 17
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP }) // 20
      expect(input.value).toBe('20')
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP }) // 20 (max snapped to step)
      expect(input.value).toBe('20')
    })

    it('should compute min-max with step correctly when stepSnapping false', async () => {
      const { input } = setup({ min: 17, max: 21, step: 3, stepSnapping: false })

      expect(input.value).toBe('')
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP }) // 17
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP }) // 20
      expect(input.value).toBe('20')
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP }) // 21 (max not snapped to step)
      expect(input.value).toBe('21')
    })
  })

  describe('given setting the input value manually', async () => {
    it('should it increase/decrease the value appropriately', async () => {
      const { input, increment, decrement } = setup({ defaultValue: 6 })

      input.value = '100'
      await userEvent.click(increment)
      expect(input.value).toBe('101')

      input.value = '100'
      await userEvent.click(decrement)
      expect(input.value).toBe('99')

      input.value = ''
      await userEvent.click(decrement)
      expect(input.value).toBe('0')

      input.value = '0'
      await userEvent.click(decrement)
      expect(input.value).toBe('-1')
    })
  })

  describe('given setting the input value manually and keydown enter', async () => {
    it('should it update the value appropriately', async () => {
      const { input } = setup({
        defaultValue: 6,
        formatOptions: {
          style: 'currency',
          currency: 'EUR',
          currencyDisplay: 'code',
          currencySign: 'accounting',
        },
      })

      input.value = '7'
      expect(input.value).toBe('7')
      await fireEvent.keyDown(input, { key: kbd.ENTER })
      expect(input.value).toBe('EUR 7.00')
    })
  })
})

describe('given checkbox in a form', async () => {
  const wrapper = mount({
    props: ['handleSubmit'],
    components: { NumberField },
    template: '<form @submit="handleSubmit"><NumberField name="test" :defaultValue="5" /></form>',
  }, {
    props: { handleSubmit },
  })

  it('should have hidden input field', async () => {
    expect(wrapper.find('[type="text"]').exists()).toBe(true)
  })

  describe('after clicking submit button', () => {
    beforeEach(async () => {
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ test: '5' })
    })
  })

  describe('after changing value and click submit button again', () => {
    beforeEach(async () => {
      const increment = wrapper.find('[data-testid="increment"]').element
      await userEvent.click(increment)
      await wrapper.find('form').trigger('submit')
    })

    it('should trigger submit once', () => {
      expect(handleSubmit).toHaveBeenCalledTimes(2)
      expect(handleSubmit.mock.results[1].value).toStrictEqual({ test: '6' })
    })
  })
})
