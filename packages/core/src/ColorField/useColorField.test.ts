import type { Color } from '@/shared/color'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { colorToHex, normalizeColor } from '@/shared/color'
import { useColorField } from './useColorField'

describe('useColorField', () => {
  const scopes: ReturnType<typeof effectScope>[] = []
  function setup(props: Parameters<typeof useColorField>[0] = {}) {
    const scope = effectScope()
    scopes.push(scope)
    return scope.run(() => useColorField(props))!
  }
  afterEach(() => scopes.splice(0).forEach(scope => scope.stop()))

  it('steps and commits a ref-owned model, resetting invalid input', () => {
    const modelValue = ref<string | Color>('#000000')
    const field = setup({ modelValue })
    field.increment()
    expect(modelValue.value).toEqual({ space: 'rgb', r: 0, g: 0, b: 1, alpha: 1 })
    field.updateValue('invalid')
    field.commit()
    expect(field.inputValue.value).toBe('#000001')
    field.updateValue('#123456')
    field.commit()
    expect(colorToHex(normalizeColor(modelValue.value))).toBe('#123456')
  })

  it('preserves a draft during external updates and resumes synchronization after commit', async () => {
    const modelValue = ref<string | Color>('#000000')
    const field = setup({ modelValue })
    field.updateValue('#123')
    modelValue.value = '#ffffff'
    await nextTick()
    expect(field.inputValue.value).toBe('#123')
    field.commit()
    expect(colorToHex(normalizeColor(modelValue.value))).toBe('#112233')
    modelValue.value = '#ff0000'
    await nextTick()
    expect(field.inputValue.value).toBe('#ff0000')
  })

  it('cancels keyboard and blur commits and preserves the native event', () => {
    const onUpdate = vi.fn()
    const field = setup({ onUpdate, onBeforeUpdate: (_, details) => details.cancel() })
    const input = field.createInputSurface()
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true })
    input.props.value.onKeydown(event)
    expect(field.modelValue.value).toBe('#000000')
    expect(field.lastChangeDetails.value).toMatchObject({ reason: 'keyboard', event, isCanceled: true })
    field.updateValue('#ffffff')
    input.props.value.onBlur(new FocusEvent('blur'))
    expect(field.inputValue.value).toBe('#000000')
    expect(field.lastChangeDetails.value.reason).toBe('blur')
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('keeps per-input focus and composition state independent', async () => {
    const field = setup()
    const first = field.createInputSurface()
    const second = field.createInputSurface()
    const wheel = new WheelEvent('wheel', { deltaY: -1, cancelable: true })
    first.props.value.onFocus()
    second.props.value.onWheel(wheel)
    expect(field.modelValue.value).toBe('#000000')
    first.props.value.onWheel(wheel)
    expect(colorToHex(field.color.value)).toBe('#000001')
    expect(field.lastChangeDetails.value.reason).toBe('wheel')
    first.props.value.onCompositionstart()
    const key = new KeyboardEvent('keydown', { key: 'ArrowUp' })
    first.props.value.onKeydown(key)
    expect(colorToHex(field.color.value)).toBe('#000001')
    first.props.value.onCompositionend(new CompositionEvent('compositionend'))
    first.props.value.onKeydown(key)
    expect(colorToHex(field.color.value)).toBe('#000001')
    await nextTick()
    first.props.value.onKeydown(key)
    expect(colorToHex(field.color.value)).toBe('#000002')
  })

  it('reacts to disabled, readonly and step inputs and synchronizes external values', async () => {
    const disabled = ref(false)
    const readonly = ref(false)
    const step = ref(2)
    const model = ref<string | Color>('#000000')
    const hex = () => colorToHex(normalizeColor(model.value))
    const field = setup({ modelValue: model, disabled, readonly, step, channel: 'red' })
    const input = field.createInputSurface()
    field.increment()
    expect(hex()).toBe('#020000')
    // Steps snap to the step grid, like NumberField: 2 + 3 lands on 6.
    step.value = 3
    field.increment()
    expect(hex()).toBe('#060000')
    disabled.value = true
    field.increment()
    expect(hex()).toBe('#060000')
    expect(input.attrs.value['data-disabled']).toBe('')
    disabled.value = false
    readonly.value = true
    field.increment()
    expect(hex()).toBe('#060000')
    expect(input.attrs.value['data-readonly']).toBe('')
    model.value = '#ff0000'
    await nextTick()
    expect(field.inputValue.value).toBe('255')
  })

  it('shows an in-place mutation of the parent color', async () => {
    const model = ref<string | Color>({ space: 'hsl', h: 0, s: 100, l: 50, alpha: 1 })
    const field = setup({ modelValue: model, channel: 'hue' })
    expect(field.inputValue.value).toBe('0')
    ;(model.value as Extract<Color, { space: 'hsl' }>).h = 10
    await nextTick()
    expect(field.inputValue.value).toBe('10')
  })

  it('does not report changeEnd for a step a controlled parent rejects', async () => {
    const onChange = vi.fn()
    const onChangeEnd = vi.fn()
    const field = setup({ modelValue: () => '#000000', onUpdate: () => {}, onChange, onChangeEnd })
    field.increment()
    await nextTick()
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChangeEnd).not.toHaveBeenCalled()
  })
})
