import type { NumberFieldChangeReason } from './useNumberField'
import type { ChangeEventDetails } from '@/shared'
import { fireEvent, render } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, effectScope, h, nextTick, ref } from 'vue'
import * as Reka from '../index'
import NumberFieldRoot from './NumberFieldRoot.vue'
import { useNumberField } from './useNumberField'

const scopes: ReturnType<typeof effectScope>[] = []
function setup(props: Parameters<typeof useNumberField>[0] = {}) {
  const scope = effectScope()
  scopes.push(scope)
  return scope.run(() => useNumberField(props))!
}
afterEach(() => {
  scopes.splice(0).forEach(scope => scope.stop())
  document.body.innerHTML = ''
})

describe('useNumberField — model', () => {
  it('is uncontrolled by default and steps from the default value', () => {
    const field = setup({ defaultValue: 5 })
    expect(field.isControlled.value).toBe(false)
    field.increment()
    expect(field.modelValue.value).toBe(6)
    field.decrement(10)
    expect(field.modelValue.value).toBe(-4)
    expect(field.textValue.value).toBe('-4')
  })

  it('starts from min (or startingValue) when empty', () => {
    expect((() => {
      const f = setup({ min: 3 })
      f.increment()
      return f.modelValue.value
    })()).toBe(3)
    const f = setup({ startingValue: 40, max: 20 })
    f.increment()
    expect(f.modelValue.value).toBe(20)
  })

  it('controlled with onUpdate: nothing is written, onUpdate receives value + details', () => {
    const model = ref(1)
    const onUpdate = vi.fn()
    const field = setup({ modelValue: model, onUpdate })
    expect(field.isControlled.value).toBe(true)
    field.increment(1, 'increment-press')
    expect(model.value).toBe(1)
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][0]).toBe(2)
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ reason: 'increment-press' })
  })

  it('ref-owned mode writes the passed ref', () => {
    const model = ref<number | undefined>(1)
    const field = setup({ modelValue: model })
    field.increment()
    expect(model.value).toBe(2)
  })

  it('emits nothing when the value does not change', () => {
    const onUpdate = vi.fn()
    const field = setup({ defaultValue: 10, max: 10, onUpdate })
    field.increment()
    field.applyInputValue('10')
    field.setModelValue(10)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('cancel() in onBeforeUpdate keeps the value and skips onUpdate', () => {
    const onUpdate = vi.fn()
    const field = setup({ defaultValue: 1, onBeforeUpdate: (_v, d) => d.cancel(), onUpdate })
    field.increment()
    field.applyInputValue('7')
    expect(field.modelValue.value).toBe(1)
    expect(field.lastChangeDetails.value.isCanceled).toBe(true)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('bare calls report "imperative-action"', () => {
    const field = setup({ defaultValue: 1 })
    field.increment()
    expect(field.lastChangeDetails.value.reason).toBe('imperative-action')
  })

  it('a context assignment goes through the cancellable model', () => {
    const onBeforeUpdate = vi.fn()
    const field = setup({ defaultValue: 1, onBeforeUpdate })
    field.context.modelValue.value = 4
    expect(field.modelValue.value).toBe(4)
    expect(onBeforeUpdate).toHaveBeenCalledTimes(1)
  })

  it('does not change while disabled or readonly', () => {
    const field = setup({ defaultValue: 1, disabled: true })
    field.increment()
    expect(field.modelValue.value).toBe(1)
    const ro = setup({ defaultValue: 1, readonly: true })
    ro.decrement()
    expect(ro.modelValue.value).toBe(1)
  })
})

describe('useNumberField — surfaces and reasons', () => {
  function reasons(props: Parameters<typeof useNumberField>[0] = {}) {
    const calls: ChangeEventDetails<NumberFieldChangeReason>[] = []
    const field = setup({ defaultValue: 5, min: 0, max: 100, ...props, onUpdate: (_v, d) => calls.push(d) })
    return { field, calls, input: effectScope().run(() => field.createInputSurface())! }
  }

  it('keyboard steps and Enter report "keyboard" with the native event', () => {
    const { field, calls, input } = reasons()
    for (const key of ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']) {
      const event = new KeyboardEvent('keydown', { key, cancelable: true })
      input.props.value.onKeydown(event)
      expect(event.defaultPrevented).toBe(true)
    }
    expect(calls.map(d => d.reason)).toEqual(Array.from({ length: 6 }).fill('keyboard'))
    expect(calls[0].event).toBeInstanceOf(KeyboardEvent)
    expect(field.modelValue.value).toBe(100)

    const target = document.createElement('input')
    target.value = '42'
    const enter = new KeyboardEvent('keydown', { key: 'Enter' })
    Object.defineProperty(enter, 'target', { value: target })
    input.props.value.onKeydown(enter)
    expect(field.modelValue.value).toBe(42)
    expect(calls.at(-1)).toMatchObject({ reason: 'keyboard', event: enter })
  })

  it('blur commits with "blur"', () => {
    const { field, calls, input } = reasons()
    const target = document.createElement('input')
    target.value = '12'
    const blur = new FocusEvent('blur')
    Object.defineProperty(blur, 'target', { value: target })
    input.props.value.onBlur(blur)
    expect(field.modelValue.value).toBe(12)
    expect(calls[0]).toMatchObject({ reason: 'blur', event: blur })
  })

  it('wheel on the focused input reports "wheel"', () => {
    const { field, calls, input } = reasons()
    const target = document.createElement('input')
    document.body.append(target)
    target.focus()
    const wheel = new WheelEvent('wheel', { deltaY: 10, cancelable: true })
    Object.defineProperty(wheel, 'target', { value: target })
    input.props.value.onWheel(wheel)
    expect(field.modelValue.value).toBe(6)
    expect(calls[0]).toMatchObject({ reason: 'wheel', event: wheel })
  })

  it('button surfaces step on click with "increment-press" / "decrement-press"', () => {
    const { field, calls } = reasons()
    field.incrementButton.props.value.onClick(new MouseEvent('click'))
    field.decrementButton.props.value.onClick(new MouseEvent('click'))
    expect(calls.map(d => d.reason)).toEqual(['increment-press', 'decrement-press'])
  })

  it('surfaces carry state as data-* and no data-* in props', () => {
    const field = setup({ defaultValue: 10, max: 10, readonly: true })
    expect(field.root.attrs.value).toMatchObject({ 'role': 'group', 'data-readonly': '' })
    expect(Object.keys(field.root.props.value).some(k => k.startsWith('data-'))).toBe(false)
    expect(field.incrementButton.attrs.value).toMatchObject({ 'aria-label': 'Increase', 'disabled': '', 'data-disabled': '' })
    expect(field.incrementButton.attrs.value['data-pressed']).toBeUndefined()
  })
})

describe('useNumberField — rendered standalone', () => {
  const Fixture = defineComponent({
    props: { disabled: Boolean },
    setup(props) {
      const field = useNumberField({ defaultValue: 3, min: 0, max: 10, id: 'qty', disabled: () => props.disabled })
      const input = field.createInputSurface()
      return () => h('div', field.root.attrs.value, [
        h('label', { for: 'qty' }, 'Quantity'),
        h('button', { ...field.decrementButton.attrs.value, type: 'button' }, '-'),
        h('input', { ...input.attrs.value, ref: field.setInputElement as any }),
        h('button', { ...field.incrementButton.attrs.value, type: 'button' }, '+'),
      ])
    },
  })

  it('binds attrs onto real elements and passes axe', async () => {
    const { container } = render(Fixture)
    const input = container.querySelector('input')!
    expect(input.getAttribute('role')).toBe('spinbutton')
    expect(input.value).toBe('3')
    expect(input.getAttribute('aria-valuenow')).toBe('3')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('steps through the bound handlers and re-renders', async () => {
    const { container } = render(Fixture)
    const [, increment] = container.querySelectorAll('button')
    const input = container.querySelector('input')!
    increment.click()
    await nextTick()
    expect(input.value).toBe('4')
    await fireEvent.keyDown(input, { key: 'End' })
    expect(input.value).toBe('10')
    expect(increment.hasAttribute('disabled')).toBe(true)
  })

  it('renders disabled and passes axe', async () => {
    const { container } = render(Fixture, { props: { disabled: true } })
    expect(container.firstElementChild!.getAttribute('data-disabled')).toBe('')
    expect(container.querySelector('input')!.hasAttribute('disabled')).toBe(true)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('numberFieldRoot — change details', () => {
  it('emits beforeUpdate then update with details; cancel keeps the value', async () => {
    const order: string[] = []
    const { getByTestId } = render(() => h(NumberFieldRoot, {
      'defaultValue': 1,
      'onBeforeUpdate:modelValue': (v: number | undefined, d: ChangeEventDetails) => {
        order.push(`before:${d.reason}`)
        if (v === 3)
          d.cancel()
      },
      'onUpdate:modelValue': (_v: number | undefined, d: ChangeEventDetails) => order.push(`update:${d.reason}`),
    }, () => h(Reka.NumberFieldInput, { 'data-testid': 'input' })))
    const input = getByTestId('input') as HTMLInputElement
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    await nextTick()
    expect(input.value).toBe('2')
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    await nextTick()
    expect(input.value).toBe('2')
    expect(order).toEqual(['before:keyboard', 'update:keyboard', 'before:keyboard'])
  })

  it('controlled: update:modelValue carries the reason and no emit fires for an unchanged commit', async () => {
    const onUpdate = vi.fn()
    const wrapper = render(defineComponent({
      setup() {
        const value = ref<number | undefined>(5)
        return () => h(NumberFieldRoot, {
          'modelValue': value.value,
          'max': 5,
          'onUpdate:modelValue': (v: number | undefined, d: ChangeEventDetails) => {
            onUpdate(v, d)
            value.value = v
          },
        }, () => h(Reka.NumberFieldInput, { 'data-testid': 'input' }))
      },
    }))
    const input = wrapper.getByTestId('input') as HTMLInputElement
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    await fireEvent.blur(input)
    expect(onUpdate).not.toHaveBeenCalled()
    await fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][0]).toBe(4)
    expect(onUpdate.mock.calls[0][1]).toMatchObject({ reason: 'keyboard' })
    await nextTick()
    expect(input.value).toBe('4')
  })
})

describe('numberFieldRoot — cancelled text commit', () => {
  it.each([
    ['blur', (input: HTMLInputElement) => fireEvent.blur(input)],
    ['keyboard', (input: HTMLInputElement) => fireEvent.keyDown(input, { key: 'Enter' })],
  ])('a cancelled %s commit shows the model text, also after a re-render', async (reason, commit) => {
    const onBeforeUpdate = vi.fn((_v: number | undefined, d: ChangeEventDetails) => d.cancel())
    const tick = ref(0)
    const { getByTestId } = render(defineComponent({
      setup() {
        return () => h(NumberFieldRoot, {
          'defaultValue': 1,
          'onBeforeUpdate:modelValue': onBeforeUpdate,
        }, () => h(Reka.NumberFieldInput, { 'data-testid': 'input', 'data-tick': tick.value }))
      },
    }))
    const input = getByTestId('input') as HTMLInputElement
    await fireEvent.update(input, '7')
    // Typing proposes the value live (cancelled too), and the typed text stays.
    expect(onBeforeUpdate).toHaveBeenCalledTimes(1)
    expect(onBeforeUpdate.mock.calls[0][1].reason).toBe('input-change')
    expect(input.value).toBe('7')
    await commit(input)
    expect(onBeforeUpdate).toHaveBeenCalledTimes(2)
    expect(onBeforeUpdate.mock.calls[1][1].reason).toBe(reason)
    expect(input.value).toBe('1')
    tick.value++
    await nextTick()
    expect(input.getAttribute('data-tick')).toBe('1')
    expect(input.value).toBe('1')
  })
})

describe('numberFieldRoot — cancelled clear', () => {
  it('a cancelled clear restores the model text, and the next step increments the model', async () => {
    const onBeforeUpdate = vi.fn((v: number | undefined, d: ChangeEventDetails) => {
      if (v === undefined)
        d.cancel()
    })
    const onUpdate = vi.fn()
    const { getByTestId } = render(defineComponent({
      setup() {
        return () => h(NumberFieldRoot, {
          'defaultValue': 1,
          'onBeforeUpdate:modelValue': onBeforeUpdate,
          'onUpdate:modelValue': onUpdate,
        }, () => h(Reka.NumberFieldInput, { 'data-testid': 'input' }))
      },
    }))
    const input = getByTestId('input') as HTMLInputElement
    input.focus()
    await fireEvent.update(input, '')
    expect(onBeforeUpdate).toHaveBeenCalledTimes(1)
    expect(onBeforeUpdate.mock.calls[0][1].reason).toBe('input-clear')
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onBeforeUpdate).toHaveBeenCalledTimes(2)
    expect(onBeforeUpdate.mock.calls[1][0]).toBeUndefined()
    expect(input.value).toBe('1')
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][0]).toBe(2)
    expect(input.value).toBe('2')
  })

  it('an accepted clear keeps the input empty', async () => {
    const onUpdate = vi.fn()
    const { getByTestId } = render(defineComponent({
      setup() {
        return () => h(NumberFieldRoot, { 'defaultValue': 1, 'onUpdate:modelValue': onUpdate }, () => h(Reka.NumberFieldInput, { 'data-testid': 'input' }))
      },
    }))
    const input = getByTestId('input') as HTMLInputElement
    await fireEvent.update(input, '')
    await fireEvent.blur(input)
    expect(onUpdate.mock.calls[0][0]).toBeUndefined()
    expect(input.value).toBe('')
  })
})

describe('useNumberField — public export', () => {
  it('is exported from the barrel; builders are internal', () => {
    expect(typeof Reka.useNumberField).toBe('function')
    expect((Reka as Record<string, unknown>).createNumberFieldInputSurface).toBeUndefined()
    expect((Reka as Record<string, unknown>).getNumberFieldButtonSurface).toBeUndefined()
  })
})

describe('useNumberField lean surfaces', () => {
  it('builds the button surfaces on first read, once', () => {
    const field = useNumberField({ defaultValue: 5, max: 5 })
    expect(field.incrementButton).toBe(field.incrementButton)
    expect(field.decrementButton).toBe(field.decrementButton)
    expect(field.incrementButton.attrs.value.disabled).toBe('')
    expect(field.decrementButton.attrs.value.disabled).toBeUndefined()
  })

  it('formats `textValue` with the field formatter', () => {
    const field = useNumberField({ defaultValue: 1234.5, locale: 'de-DE' })
    expect(field.textValue.value).toBe('1.234,5')
  })
})

describe('numberFieldRoot — live value while typing (Base UI parity, #1720)', () => {
  function renderLive(props: Record<string, unknown> = {}) {
    const onUpdate = vi.fn()
    const onCommit = vi.fn()
    const utils = render(defineComponent({
      setup() {
        return () => h(NumberFieldRoot, {
          'onUpdate:modelValue': onUpdate,
          'onValueCommit': onCommit,
          ...props,
        }, () => [
          h(Reka.NumberFieldInput, { 'data-testid': 'input' }),
          h(Reka.NumberFieldIncrement, { 'data-testid': 'increment' }),
        ])
      },
    }))
    const input = utils.getByTestId('input') as HTMLInputElement
    return { ...utils, input, onUpdate, onCommit }
  }

  it('emits update:modelValue on each parseable keystroke and leaves the typed text alone', async () => {
    const { input, onUpdate, onCommit } = renderLive({ defaultValue: 0 })
    input.focus()
    await fireEvent.update(input, '1')
    await fireEvent.update(input, '12')
    await fireEvent.update(input, '12.')
    await nextTick()
    expect(onUpdate.mock.calls.map(c => [c[0], c[1].reason])).toEqual([[1, 'input-change'], [12, 'input-change']])
    // "12." parses to the current value: no emit, and the text is not reformatted to "12".
    expect(input.value).toBe('12.')
    expect(onCommit).not.toHaveBeenCalled()
    await fireEvent.blur(input)
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith(12)
    expect(input.value).toBe('12')
  })

  it('emits the value the blur would commit (clamped and snapped), and formats only on blur', async () => {
    const { input, onUpdate, onCommit } = renderLive({ defaultValue: 0, min: 0, max: 10, step: 2 })
    await fireEvent.update(input, '7')
    expect(onUpdate.mock.calls.at(-1)?.[0]).toBe(8)
    expect(input.value).toBe('7')
    await fireEvent.blur(input)
    expect(input.value).toBe('8')
    expect(onCommit).toHaveBeenCalledWith(8)
  })

  it('emits undefined (input-clear) when the text is emptied', async () => {
    const { input, onUpdate } = renderLive({ defaultValue: 5 })
    await fireEvent.update(input, '')
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onUpdate.mock.calls[0][0]).toBeUndefined()
    expect(onUpdate.mock.calls[0][1].reason).toBe('input-clear')
  })

  it('does not commit on a focus and blur without changes', async () => {
    const { input, onCommit } = renderLive({ defaultValue: 5 })
    input.focus()
    await fireEvent.blur(input)
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commits keyboard steps together with the change, and Enter after typing', async () => {
    const { input, onCommit } = renderLive({ defaultValue: 5 })
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(onCommit).toHaveBeenLastCalledWith(6)
    await fireEvent.update(input, '9')
    expect(onCommit).toHaveBeenCalledTimes(1)
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(onCommit).toHaveBeenCalledTimes(2)
    expect(onCommit).toHaveBeenLastCalledWith(9)
  })

  it('a step while editing replaces the typed text with the formatted result', async () => {
    const { input } = renderLive({ defaultValue: 0 })
    await fireEvent.update(input, '3.')
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    await nextTick()
    expect(input.value).toBe('4')
  })

  it('does not overwrite the typed text when a controlled parent echoes the value', async () => {
    const model = ref<number | undefined>(0)
    const { getByTestId } = render(defineComponent({
      setup() {
        return () => h(NumberFieldRoot, {
          'modelValue': model.value,
          'onUpdate:modelValue': (v: number | undefined) => { model.value = v },
          'step': 0.01,
          'formatOptions': { minimumFractionDigits: 2 },
        }, () => h(Reka.NumberFieldInput, { 'data-testid': 'input' }))
      },
    }))
    const input = getByTestId('input') as HTMLInputElement
    await fireEvent.update(input, '1.5')
    await nextTick()
    expect(model.value).toBe(1.5)
    expect(input.value).toBe('1.5')
    await fireEvent.blur(input)
    await nextTick()
    expect(input.value).toBe('1.50')
  })

  it('commits a held step button once, on release', async () => {
    const { getByTestId, onCommit, onUpdate } = renderLive({ defaultValue: 0 })
    const increment = getByTestId('increment')
    await fireEvent.pointerDown(increment, { button: 0, pointerId: 1, pointerType: 'mouse' })
    await nextTick()
    expect(onUpdate).toHaveBeenCalledTimes(1)
    expect(onCommit).not.toHaveBeenCalled()
    await fireEvent.pointerUp(window, { button: 0, pointerId: 1, pointerType: 'mouse' })
    await nextTick()
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith(1)
  })
})

describe('numberFieldRoot — valueCommit value', () => {
  it('commits the applied step value of a controlled field, not the stale prop', async () => {
    const model = ref<number | undefined>(5)
    const onCommit = vi.fn()
    const { getByTestId } = render(defineComponent({
      setup() {
        return () => h(NumberFieldRoot, {
          'modelValue': model.value,
          'onUpdate:modelValue': (v: number | undefined) => { model.value = v },
          'onValueCommit': onCommit,
        }, () => h(Reka.NumberFieldInput, { 'data-testid': 'input' }))
      },
    }))
    const input = getByTestId('input') as HTMLInputElement
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(model.value).toBe(6)
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith(6)
  })

  it('a step that lands on the live value still commits the pending typed change', async () => {
    const onCommit = vi.fn()
    const { getByTestId } = render(defineComponent({
      setup() {
        return () => h(NumberFieldRoot, { defaultValue: 0, step: 2, onValueCommit: onCommit }, () => h(Reka.NumberFieldInput, { 'data-testid': 'input' }))
      },
    }))
    const input = getByTestId('input') as HTMLInputElement
    // "7" snaps to 8 live; ArrowUp from 7 lands on 8 too.
    await fireEvent.update(input, '7')
    expect(onCommit).not.toHaveBeenCalled()
    await fireEvent.keyDown(input, { key: 'ArrowUp' })
    await nextTick()
    expect(input.value).toBe('8')
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith(8)
  })
})
