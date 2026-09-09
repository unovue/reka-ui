import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
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
    const modelValue = ref('#000000')
    const field = setup({ modelValue })
    field.increment()
    expect(modelValue.value).toBe('#000001')
    field.updateValue('invalid')
    field.commit()
    expect(field.inputValue.value).toBe('#000001')
    field.updateValue('#123456')
    field.commit()
    expect(modelValue.value).toBe('#123456')
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
    expect(field.modelValue.value).toBe('#000001')
    expect(field.lastChangeDetails.value.reason).toBe('wheel')
    first.props.value.onCompositionstart()
    const key = new KeyboardEvent('keydown', { key: 'ArrowUp' })
    first.props.value.onKeydown(key)
    expect(field.modelValue.value).toBe('#000001')
    first.props.value.onCompositionend(new CompositionEvent('compositionend'))
    first.props.value.onKeydown(key)
    expect(field.modelValue.value).toBe('#000001')
    await nextTick()
    first.props.value.onKeydown(key)
    expect(field.modelValue.value).toBe('#000002')
  })

  it('reacts to disabled, readonly and step inputs and synchronizes external values', async () => {
    const disabled = ref(false)
    const readonly = ref(false)
    const step = ref(2)
    const model = ref('#000000')
    const field = setup({ modelValue: model, disabled, readonly, step, channel: 'red' })
    const input = field.createInputSurface()
    field.increment()
    expect(model.value).toBe('#020000')
    step.value = 3
    field.increment()
    expect(model.value).toBe('#050000')
    disabled.value = true
    field.increment()
    expect(model.value).toBe('#050000')
    expect(input.attrs.value['data-disabled']).toBe('')
    disabled.value = false
    readonly.value = true
    field.increment()
    expect(model.value).toBe('#050000')
    expect(input.attrs.value['data-readonly']).toBe('')
    model.value = '#ff0000'
    await nextTick()
    expect(field.inputValue.value).toBe('255')
  })
})
