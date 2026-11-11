import type { NumberFieldRootProps } from './NumberFieldRoot.vue'
import userEvent from '@testing-library/user-event'
import { fireEvent, render } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useKbd } from '@/shared'
import { handleSubmit } from '@/test'
import { NumberFieldIncrement, NumberFieldInput, NumberFieldRoot } from '.'
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

async function dispatchPointerEvent(
  target: EventTarget,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  init: MouseEventInit & { pointerId?: number, pointerType?: string } = {},
) {
  await nextTick()
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  })
  Object.defineProperties(event, {
    pointerId: { value: init.pointerId ?? 1 },
    pointerType: { value: init.pointerType ?? 'touch' },
  })
  target.dispatchEvent(event)
  await nextTick()
  return event
}

describe('numberField', () => {
  beforeEach(() => {
    // @ts-expect-error aXe throwing error complaining getComputedStyle
    window.getComputedStyle = () => ({
      display: '',
    })
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.useRealTimers()
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

  describe('with startingValue', () => {
    it('should start at starting value on increment/decrement, when no value present', async () => {
      const { input, increment, decrement } = setup({ startingValue: 40, stepSnapping: true })
      expect(input.value).toBe('')

      await userEvent.click(increment)
      expect(input.value).toBe('40')
      await userEvent.click(increment)
      expect(input.value).toBe('41')

      await userEvent.clear(input)
      await userEvent.click(decrement)
      expect(input.value).toBe('40')
      await userEvent.click(decrement)
      expect(input.value).toBe('39')
    })

    it('should not snap the starting value to the step grid', async () => {
      const { input, increment, decrement } = setup({ step: 3, startingValue: 40, stepSnapping: true })

      await userEvent.click(increment)
      expect(input.value).toBe('40')
      // the next tick aligns to the grid in the requested direction
      await userEvent.click(increment)
      expect(input.value).toBe('42')

      await userEvent.clear(input)
      await userEvent.click(decrement)
      expect(input.value).toBe('40')
      await userEvent.click(decrement)
      expect(input.value).toBe('39')
    })

    it('should clamp the starting value to max', async () => {
      const { input, increment } = setup({ min: 0, max: 20, startingValue: 40, stepSnapping: true })

      await userEvent.click(increment)
      expect(input.value).toBe('20')
    })

    it('should clamp the starting value to min', async () => {
      const { input, decrement } = setup({ min: 10, max: 20, startingValue: 4, stepSnapping: true })

      await userEvent.click(decrement)
      expect(input.value).toBe('10')
    })

    it('should fall back to min when no starting value is given', async () => {
      const { input, increment } = setup({ min: 5, stepSnapping: true })

      await userEvent.click(increment)
      expect(input.value).toBe('5')
    })
  })

  describe('with pointer hold controls', () => {
    it('should preserve immediate mouse activation', async () => {
      const { input, increment } = setup({ defaultValue: 0 })

      const pointerDown = await dispatchPointerEvent(increment, 'pointerdown', { pointerType: 'mouse' })
      expect(pointerDown.defaultPrevented).toBe(true)
      expect(input.value).toBe('1')

      await dispatchPointerEvent(window, 'pointerup', { pointerType: 'mouse' })
      expect(input.value).toBe('1')
    })

    it('should activate a touch tap on release', async () => {
      const { input, increment } = setup({ defaultValue: 0 })

      const pointerDown = await dispatchPointerEvent(increment, 'pointerdown')
      expect(pointerDown.defaultPrevented).toBe(true)
      expect(input.value).toBe('0')

      await dispatchPointerEvent(window, 'pointerup')
      expect(input.value).toBe('1')
    })

    it('should ignore a touch press while disabled', async () => {
      vi.useFakeTimers()
      const { input, increment } = setup({ defaultValue: 0, disabled: true })

      await dispatchPointerEvent(increment, 'pointerdown')
      expect(increment).not.toHaveAttribute('data-pressed')

      await vi.advanceTimersByTimeAsync(500)
      await dispatchPointerEvent(window, 'pointerup')
      expect(input.value).toBe('0')
    })

    it('should cancel a touch press when movement exceeds the tolerance', async () => {
      vi.useFakeTimers()
      const { input, increment } = setup({ defaultValue: 0 })

      await dispatchPointerEvent(increment, 'pointerdown', { clientX: 10, clientY: 10 })
      await dispatchPointerEvent(window, 'pointermove', { clientX: 21, clientY: 10 })
      await vi.advanceTimersByTimeAsync(500)
      await dispatchPointerEvent(window, 'pointerup', { clientX: 21, clientY: 10 })

      expect(input.value).toBe('0')
    })

    it('should repeat a stationary touch press after the hold delay', async () => {
      vi.useFakeTimers()
      const { input, increment } = setup({ defaultValue: 0 })

      await dispatchPointerEvent(increment, 'pointerdown')
      await vi.advanceTimersByTimeAsync(399)
      expect(input.value).toBe('0')

      await vi.advanceTimersByTimeAsync(1)
      await nextTick()
      expect(input.value).toBe('1')

      await vi.advanceTimersByTimeAsync(60)
      await nextTick()
      expect(input.value).toBe('2')

      await dispatchPointerEvent(window, 'pointerup')
      await vi.advanceTimersByTimeAsync(60)
      expect(input.value).toBe('2')
    })

    it('should stop an active touch hold when movement exceeds the tolerance', async () => {
      vi.useFakeTimers()
      const { input, increment } = setup({ defaultValue: 0 })

      await dispatchPointerEvent(increment, 'pointerdown', { clientX: 10, clientY: 10 })
      await vi.advanceTimersByTimeAsync(400)
      await nextTick()
      expect(input.value).toBe('1')

      await dispatchPointerEvent(window, 'pointermove', { clientX: 21, clientY: 10 })
      await vi.advanceTimersByTimeAsync(120)
      expect(input.value).toBe('1')
    })

    it('should tolerate minor movement after a touch hold starts', async () => {
      vi.useFakeTimers()
      const { input, increment } = setup({ defaultValue: 0 })

      await dispatchPointerEvent(increment, 'pointerdown', { clientX: 10, clientY: 10 })
      await vi.advanceTimersByTimeAsync(400)
      await nextTick()
      expect(input.value).toBe('1')

      await dispatchPointerEvent(window, 'pointermove', { clientX: 15, clientY: 10 })
      await vi.advanceTimersByTimeAsync(60)
      await nextTick()
      expect(input.value).toBe('2')

      await dispatchPointerEvent(window, 'pointerup', { clientX: 15, clientY: 10 })
      await vi.advanceTimersByTimeAsync(60)
      expect(input.value).toBe('2')
    })

    it('should cancel a touch press on pointercancel', async () => {
      vi.useFakeTimers()
      const { input, increment } = setup({ defaultValue: 0 })

      await dispatchPointerEvent(increment, 'pointerdown')
      await dispatchPointerEvent(window, 'pointercancel')
      await vi.advanceTimersByTimeAsync(500)

      expect(input.value).toBe('0')
    })
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

  it('should not be changed when readonly', async () => {
    const { root, input, increment, decrement } = setup({ defaultValue: 0, readonly: true })

    expect(root.getAttribute('data-readonly')).toBe('')
    expect(input.getAttribute('data-readonly')).toBe('')
    await fireEvent.keyDown(input, { key: kbd.ARROW_UP })
    expect(input.value).toBe('0')
    await fireEvent.keyDown(input, { key: kbd.ARROW_DOWN })
    expect(input.value).toBe('0')
    await userEvent.click(increment)
    expect(input.value).toBe('0')
    await userEvent.click(decrement)
    expect(input.value).toBe('0')
  })

  it('should be be focusable when readonly', async () => {
    const { input } = setup({ defaultValue: 0, readonly: true })

    await userEvent.tab()
    expect(input).toBe(document.activeElement)
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

    it('should allow backspacing through the unit suffix', async () => {
      const { input, user } = setup({
        defaultValue: 13,
        formatOptions: {
          style: 'unit',
          unit: 'minute',
          unitDisplay: 'short',
        },
      })
      expect(input.value).toBe('13 min')

      input.focus()
      await user.keyboard('{Backspace}')
      expect(input.value).toBe('13 mi')

      await user.keyboard('{Backspace}')
      await user.keyboard('{Backspace}')
      expect(input.value).toBe('13 ')
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

    it('should snap an off-grid value to the next grid line when incrementing', async () => {
      // Seed the off-grid value via defaultValue: typing it would snap on commit.
      const { input, increment } = setup({ step: 1, stepSnapping: true, defaultValue: 18.98 })

      await userEvent.click(increment) // snap up to the nearest grid line, not 18.98 + 1 -> 20
      expect(input.value).toBe('19')
    })

    it('should snap an off-grid value to the previous grid line when decrementing', async () => {
      const { input, decrement } = setup({ step: 1, stepSnapping: true, defaultValue: 18.11 })

      await userEvent.click(decrement) // snap down to the nearest grid line, not 18.11 - 1 -> 17
      expect(input.value).toBe('18')
    })

    it('should add a full step when the value is already on the grid', async () => {
      const { input, increment, decrement } = setup({ step: 1, stepSnapping: true, defaultValue: 5 })

      await userEvent.click(increment)
      expect(input.value).toBe('6')
      await userEvent.click(decrement)
      expect(input.value).toBe('5')
    })
  })

  describe('given step alignment near min/max boundaries', () => {
    it('should keep increment enabled when an off-grid value can still align below max', async () => {
      const { input, increment } = setup({ max: 10, step: 3, stepSnapping: true, defaultValue: 8 })

      expect(increment).not.toHaveAttribute('disabled')
      await userEvent.click(increment) // aligns to 9, not 8 + 3
      expect(input.value).toBe('9')
    })

    it('should keep decrement enabled when an off-grid value can still align above min', async () => {
      const { input, decrement } = setup({ min: 2, step: 3, stepSnapping: true, defaultValue: 4 })

      expect(decrement).not.toHaveAttribute('disabled')
      await userEvent.click(decrement) // aligns to 2, not 4 - 3
      expect(input.value).toBe('2')
    })

    it('should disable increment once the next aligned value cannot exceed max', async () => {
      const { increment } = setup({ max: 10, step: 3, stepSnapping: true, defaultValue: 9 })

      expect(increment).toHaveAttribute('disabled')
    })

    it('should disable decrement once the next aligned value cannot go below min', async () => {
      const { decrement } = setup({ min: 2, step: 3, stepSnapping: true, defaultValue: 2 })

      expect(decrement).toHaveAttribute('disabled')
    })

    it('should clamp the empty/NaN fallback to the range', async () => {
      const { input, increment } = setup({ max: -5 })

      // Empty input: the bare fallback would be 0, which is above max; it must be clamped.
      await userEvent.click(increment)
      expect(input.value).toBe('-5')
    })
  })

  describe('given allowInvalid prop', async () => {
    it('should keep a typed value above max without clamping', async () => {
      const { input } = setup({ max: 10, allowInvalid: true })

      input.value = '50'
      await fireEvent.keyDown(input, { key: kbd.ENTER })
      expect(input.value).toBe('50')
    })

    it('should keep a typed value below min without clamping', async () => {
      const { input } = setup({ min: 5, allowInvalid: true })

      input.value = '1'
      await fireEvent.keyDown(input, { key: kbd.ENTER })
      expect(input.value).toBe('1')
    })

    it('should keep an off-grid typed value without snapping', async () => {
      const { input } = setup({ step: 1, stepSnapping: true, allowInvalid: true })

      input.value = '2.5'
      await fireEvent.keyDown(input, { key: kbd.ENTER })
      expect(input.value).toBe('2.5')
    })

    it('should still clamp and snap a typed value when allowInvalid is false', async () => {
      const { input } = setup({ max: 10 })

      input.value = '50'
      await fireEvent.keyDown(input, { key: kbd.ENTER })
      expect(input.value).toBe('10')
    })

    it('should still clamp step interactions even when allowInvalid is true', async () => {
      const { input, decrement } = setup({ max: 10, allowInvalid: true })

      input.value = '50'
      await fireEvent.keyDown(input, { key: kbd.ENTER })
      expect(input.value).toBe('50')
      await userEvent.click(decrement) // stepping clamps back into range
      expect(input.value).toBe('10')
    })

    it('should not step against the requested direction when the value is out of range', async () => {
      const { input } = setup({ min: 0, max: 10, allowInvalid: true })

      input.value = '50'
      await fireEvent.keyDown(input, { key: kbd.ENTER })
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP })
      expect(input.value).toBe('50')
      input.focus()
      await fireEvent.wheel(input, { deltaY: 10 })
      expect(input.value).toBe('50')
      await fireEvent.keyDown(input, { key: kbd.ARROW_DOWN })
      expect(input.value).toBe('10')

      input.value = '-5'
      await fireEvent.keyDown(input, { key: kbd.ENTER })
      await fireEvent.keyDown(input, { key: kbd.ARROW_DOWN })
      expect(input.value).toBe('-5')
      await fireEvent.keyDown(input, { key: kbd.ARROW_UP })
      expect(input.value).toBe('0')
    })

    // The tests above assign `input.value` directly, which bypasses the `beforeinput` guard.
    // These type key by key so the guard is actually exercised.
    describe('when typing key by key', () => {
      it('should allow typing a negative value below a non-negative min', async () => {
        const { user, input } = setup({ min: 0, allowInvalid: true })

        await user.type(input, '-5')
        expect(input.value).toBe('-5')

        await user.tab()
        expect(input.value).toBe('-5')
      })

      it('should allow typing a value above max', async () => {
        const { user, input } = setup({ max: 10, allowInvalid: true })

        await user.type(input, '50')
        expect(input.value).toBe('50')

        await user.tab()
        expect(input.value).toBe('50')
      })

      it('should still reject non-numeric characters', async () => {
        const { user, input } = setup({ allowInvalid: true })

        await user.type(input, '1a2')
        expect(input.value).toBe('12')
      })

      it('should block the minus sign when allowInvalid is false and min is non-negative', async () => {
        const { user, input } = setup({ min: 0 })

        await user.type(input, '-5')
        expect(input.value).toBe('5')
      })
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

  describe('given committed input that cannot be parsed', () => {
    // Mounts the parts under a real `v-model`, and records every `update:modelValue`.
    function setupModel(props: NumberFieldRootProps = {}, initial: number | null = 5) {
      const model = ref<number | undefined>(initial ?? undefined)
      const emitted: (number | undefined)[] = []
      const view = render(defineComponent({
        setup: () => () => h(NumberFieldRoot, {
          ...props,
          'modelValue': model.value,
          'onUpdate:modelValue': (value: number | undefined) => {
            emitted.push(value)
            model.value = value
          },
        }, () => [h(NumberFieldInput), h(NumberFieldIncrement, () => '+')]),
      }))
      const input = view.getByRole('spinbutton') as HTMLInputElement
      const commit = async (text: string, how: 'enter' | 'blur') => {
        input.focus()
        await fireEvent.update(input, text)
        if (how === 'enter')
          await fireEvent.keyDown(input, { key: kbd.ENTER })
        else
          await fireEvent.blur(input)
        await nextTick()
      }
      return { ...view, input, model, emitted, commit }
    }

    const ways = ['enter', 'blur'] as const
    const cases = ways.flatMap(how => ['.', '-', 'abc', '1.2.3'].map(text => [text, how] as const))

    describe('by default', () => {
      it.each(cases)('should clear the value when committing "%s" with %s', async (text, how) => {
        const { input, model, emitted, commit } = setupModel()
        await commit(text, how)
        expect(model.value).toBeUndefined()
        expect(emitted).toEqual([undefined])
        expect(input.value).toBe('')
      })

      it.each(ways)('should clear the value when committing leftover currency text with %s', async (how) => {
        const { input, emitted, commit } = setupModel({ formatOptions: { style: 'currency', currency: 'USD' } })
        expect(input.value).toBe('$5.00')
        await commit('$', how)
        expect(emitted).toEqual([undefined])
        expect(input.value).toBe('')
      })

      it.each(ways)('should clear the value when committing whitespace with %s', async (how) => {
        const { input, emitted, commit } = setupModel()
        await commit(' ', how)
        expect(emitted).toEqual([undefined])
        expect(input.value).toBe('')
      })
    })

    describe('with keepValueOnUnparsableInput', () => {
      const keep = { keepValueOnUnparsableInput: true }

      it.each(cases)('should keep the value and not emit when committing "%s" with %s', async (text, how) => {
        const { input, model, emitted, commit } = setupModel(keep)
        await commit(text, how)
        expect(model.value).toBe(5)
        expect(emitted).toEqual([])
        expect(input.value).toBe('5')
      })

      it('should restore the formatted text of an uncontrolled value and keep stepping from it', async () => {
        const { user, input, increment } = setup({ defaultValue: 5, ...keep })
        await user.clear(input)
        await user.type(input, '.{Enter}')
        expect(input.value).toBe('5')
        await user.click(increment)
        expect(input.value).toBe('6')
      })

      it.each([
        ['de-DE', ',', '5'],
        ['ar-EG', '٫', '٥'],
      ])('should keep the value for a lone decimal separator in %s', async (locale, text, formatted) => {
        const { input, model, emitted, commit } = setupModel({ ...keep, locale })
        await commit(text, 'enter')
        expect(model.value).toBe(5)
        expect(emitted).toEqual([])
        expect(input.value).toBe(formatted)
      })

      it.each([
        ['de-DE', '1.234', 1234, '1.234'],
        ['ar-EG', '١٢٣', 123, '١٢٣'],
        ['zh-CN-u-nu-hanidec', '一二三', 123, '一二三'],
      ])('should still parse localized input in %s', async (locale, text, value, formatted) => {
        const { input, model, emitted, commit } = setupModel({ ...keep, locale })
        await commit(text, 'enter')
        expect(model.value).toBe(value)
        expect(emitted).toEqual([value])
        expect(input.value).toBe(formatted)
      })

      it.each(ways)('should keep the value for leftover currency or unit text with %s', async (how) => {
        const currency = setupModel({ ...keep, formatOptions: { style: 'currency', currency: 'USD' } })
        await currency.commit('$', how)
        expect(currency.emitted).toEqual([])
        expect(currency.input.value).toBe('$5.00')
        currency.unmount()

        const unit = setupModel({ ...keep, formatOptions: { style: 'unit', unit: 'kilometer' } })
        await unit.commit(' km', how)
        expect(unit.emitted).toEqual([])
        expect(unit.input.value).toBe('5 km')
      })

      it.each(ways.flatMap(how => ['', ' ', '   '].map(text => [JSON.stringify(text), text, how] as const)))('should still clear the value when committing %s with %s', async (_label, text, how) => {
        const { input, model, emitted, commit } = setupModel({ ...keep, formatOptions: { style: 'currency', currency: 'USD' } })
        await commit(text, how)
        expect(model.value).toBeUndefined()
        expect(emitted).toEqual([undefined])
        expect(input.value).toBe('')
      })

      it('should still clamp parsable input to min and max', async () => {
        const { input, model, commit } = setupModel({ ...keep, min: 0, max: 10 })
        await commit('999', 'enter')
        expect(model.value).toBe(10)
        expect(input.value).toBe('10')
      })

      it('should leave an empty field empty', async () => {
        const { input, model, emitted, commit } = setupModel(keep, null)
        await commit('.', 'enter')
        expect(model.value).toBeUndefined()
        expect(emitted).toEqual([])
        expect(input.value).toBe('')
      })
    })

    // The number parser reads empty and numeral-free percent text as zero rather than as unparsable.
    describe('with percent formatting', () => {
      const percent = { step: 0.01, formatOptions: { style: 'percent' } } as const
      const keep = { ...percent, keepValueOnUnparsableInput: true }
      const blank = ways.flatMap(how => ['', ' '].map(text => [JSON.stringify(text), text, how] as const))

      it.each(blank)('should clear the value by default when committing %s with %s', async (_label, text, how) => {
        const { input, model, emitted, commit } = setupModel(percent, 0.5)
        expect(input.value).toBe('50%')
        await commit(text, how)
        expect(model.value).toBeUndefined()
        expect(emitted).toEqual([undefined])
        expect(input.value).toBe('')
      })

      it.each(blank)('should clear the value with keepValueOnUnparsableInput when committing %s with %s', async (_label, text, how) => {
        const { input, model, emitted, commit } = setupModel(keep, 0.5)
        await commit(text, how)
        expect(model.value).toBeUndefined()
        expect(emitted).toEqual([undefined])
        expect(input.value).toBe('')
      })

      it.each(ways.flatMap(how => ['%', ' %', '.', '-', '-%'].map(text => [text, how] as const)))('should keep the value with keepValueOnUnparsableInput when committing "%s" with %s', async (text, how) => {
        const { input, model, emitted, commit } = setupModel(keep, 0.5)
        await commit(text, how)
        expect(model.value).toBe(0.5)
        expect(emitted).toEqual([])
        expect(input.value).toBe('50%')
      })

      it.each([
        ['en-US', '0%', 0],
        ['en-US', '٢٥', 0.25],
        ['ar-EG', '٢٥', 0.25],
        ['zh-CN-u-nu-hanidec', '二五', 0.25],
        ['hi-IN-u-nu-deva', '२५', 0.25],
      ])('should still parse numerals with keepValueOnUnparsableInput in %s ("%s")', async (locale, text, value) => {
        const { model, emitted, commit } = setupModel({ ...keep, locale }, 0.5)
        await commit(text, 'enter')
        expect(model.value).toBe(value)
        expect(emitted).toEqual([value])
      })

      it('should keep reading numeral-free text as zero by default', async () => {
        const { model, emitted, commit } = setupModel(percent, 0.5)
        await commit('%', 'enter')
        expect(model.value).toBe(0)
        expect(emitted).toEqual([0])
      })
    })
  })

  describe('given focusOnChange prop', () => {
    it('should focus input when clicking increment by default', async () => {
      const { input, increment } = setup({ defaultValue: 0, focusOnChange: true })
      await userEvent.click(increment)
      expect(input).toHaveFocus()
    })

    it('should not focus input when clicking increment if focusOnChange is false', async () => {
      const { input, increment } = setup({ defaultValue: 0, focusOnChange: false })
      await userEvent.click(increment)
      expect(input).not.toHaveFocus()
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
      expect(handleSubmit).toHaveBeenCalledTimes(1)
      expect(handleSubmit.mock.results[0].value).toStrictEqual({ test: '6' })
    })
  })
})

describe('handle IME composition', () => {
  it('should not block beforeinput during IME composition', () => {
    const { input } = setup()
    input.focus()

    const event = new InputEvent('beforeinput', {
      data: 'あ',
      cancelable: true,
    })
    Object.defineProperty(event, 'isComposing', { value: true })
    input.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('should block invalid beforeinput when NOT composing', () => {
    const { input } = setup()
    input.focus()

    const event = new InputEvent('beforeinput', {
      data: 'abc',
      cancelable: true,
    })
    Object.defineProperty(event, 'isComposing', { value: false })
    input.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('should not step the value during composition (arrow keys are IME candidate navigation)', async () => {
    const { input } = setup({ defaultValue: 0, min: 0, max: 10 })

    // Arrow keys mid-composition navigate IME candidates, they must not step the value
    await fireEvent.keyDown(input, { key: kbd.ARROW_UP, isComposing: true })
    expect(input.value).toBe('0')
    await fireEvent.keyDown(input, { key: kbd.END, isComposing: true })
    expect(input.value).toBe('0')

    // Once composition ends, stepping works again
    await fireEvent.keyDown(input, { key: kbd.ARROW_UP })
    expect(input.value).toBe('1')
  })
})
