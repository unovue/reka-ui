import type { Color } from '@/shared/color'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { colorToHex, normalizeColor } from '@/shared/color'
import { useColorArea } from './useColorArea'

describe('useColorArea', () => {
  const scopes: ReturnType<typeof effectScope>[] = []
  function setup(props: Parameters<typeof useColorArea>[0] = {}) {
    const scope = effectScope()
    scopes.push(scope)
    return scope.run(() => useColorArea(props))!
  }
  afterEach(() => scopes.splice(0).forEach(scope => scope.stop()))

  it('exposes reactive surfaces and clamps channel values without rounding precision', async () => {
    const disabled = ref(false)
    const area = setup({ disabled, xChannel: 'saturation', yChannel: 'lightness', defaultValue: '#bf40bf' })
    area.updateValues(80.45, 120)
    await nextTick()
    expect(area.xValue.value).toBe(80.45)
    expect(area.yValue.value).toBe(100)
    expect(area.xInput.props.value['aria-label']).toBe('Saturation')
    expect(area.yInput.props.value['aria-label']).toBe('Lightness')
    // The thumb is the visual marker only; the inputs carry the semantics.
    expect(area.thumb.props.value).not.toHaveProperty('role')
    expect(area.thumb.props.value).not.toHaveProperty('tabindex')
    expect(area.thumb.props.value.style.left).toBe('80.45%')
    expect(area.root.props.value).not.toHaveProperty('data-disabled')
    disabled.value = true
    expect(area.root.attrs.value['data-disabled']).toBe('')
    expect(area.xInput.props.value.disabled).toBe(true)
    expect(area.yInput.attrs.value['data-disabled']).toBe('')
  })

  it('exposes one range input per channel with its own name, value and orientation', () => {
    const area = setup({ xChannel: 'saturation', yChannel: 'lightness', defaultValue: { space: 'hsl', h: 300, s: 40.4, l: 61.6, alpha: 1 } })
    expect(area.xInput.props.value).toMatchObject({
      'type': 'range',
      'min': 0,
      'max': 100,
      'step': 1,
      'value': 40,
      'tabindex': 0,
      'aria-label': 'Saturation',
      'aria-roledescription': '2D slider',
      'aria-orientation': 'horizontal',
      'aria-valuetext': '40, Lightness 62',
    })
    expect(area.yInput.props.value).toMatchObject({
      'type': 'range',
      'value': 62,
      'tabindex': -1,
      'aria-label': 'Lightness',
      'aria-orientation': 'vertical',
      'aria-valuetext': '62, Saturation 40',
    })
  })

  it('moves the single tab stop to the input that takes focus', () => {
    const area = setup()
    area.yInput.props.value.onFocus()
    expect(area.xInput.props.value.tabindex).toBe(-1)
    expect(area.yInput.props.value.tabindex).toBe(0)
    area.xInput.props.value.onFocus()
    expect(area.xInput.props.value.tabindex).toBe(0)
    expect(area.yInput.props.value.tabindex).toBe(-1)
  })

  it('writes one channel and commits when assistive technology sets an input', () => {
    const onChangeEnd = vi.fn()
    const area = setup({ xChannel: 'saturation', yChannel: 'lightness', defaultValue: { space: 'hsl', h: 300, s: 40, l: 60, alpha: 1 }, onChangeEnd })
    const input = document.createElement('input')
    input.value = '75'
    area.yInput.props.value.onInput({ target: input } as unknown as Event)
    expect(area.xValue.value).toBe(40)
    expect(area.yValue.value).toBe(75)
    expect(area.lastChangeDetails.value.reason).toBe('keyboard')
    expect(onChangeEnd).toHaveBeenCalledExactlyOnceWith({ space: 'hsl', h: 300, s: 40, l: 75, alpha: 1 })
  })

  it('restores an input whose value a controlled parent rejects', async () => {
    const area = setup({ modelValue: () => '#ff0000', onUpdate: () => {} })
    const input = document.createElement('input')
    input.value = '120'
    area.xInput.props.value.onInput({ target: input } as unknown as Event)
    await nextTick()
    expect(area.xValue.value).toBe(0)
    expect(input.value).toBe('0')
  })

  it('focuses the input of the axis an arrow key moves', () => {
    const area = setup()
    const x = document.createElement('input')
    const y = document.createElement('input')
    document.body.append(x, y)
    area.setInputElement('x', x)
    area.setInputElement('y', y)
    const surface = area.createAreaSurface(ref())
    x.focus()
    const up = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true })
    Object.defineProperty(up, 'target', { value: x })
    surface.props.value.onKeydown(up)
    expect(document.activeElement).toBe(y)
    const left = new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true })
    Object.defineProperty(left, 'target', { value: y })
    surface.props.value.onKeydown(left)
    expect(document.activeElement).toBe(x)
    x.remove()
    y.remove()
  })

  it('focuses the last focused input on pointer down', () => {
    const area = setup()
    const element = document.createElement('div')
    element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect
    element.setPointerCapture = vi.fn()
    const x = document.createElement('input')
    const y = document.createElement('input')
    area.setInputElement('x', x)
    area.setInputElement('y', y)
    const focusX = vi.spyOn(x, 'focus')
    const focusY = vi.spyOn(y, 'focus')
    const surface = area.createAreaSurface(ref(element))
    const event = { target: element, pointerId: 1, clientX: 50, clientY: 50, preventDefault: vi.fn() }
    surface.props.value.onPointerdown(event)
    expect(focusX).toHaveBeenCalledOnce()
    area.yInput.props.value.onFocus()
    surface.props.value.onPointerdown(event)
    expect(focusY).toHaveBeenCalledOnce()
  })

  it('cancels a keyboard change before exact coordinates or color events are written', () => {
    const emit = vi.fn()
    const area = setup({ emit, onBeforeUpdate: (_, details) => details.cancel() })
    const surface = area.createAreaSurface(ref())
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
    surface.props.value.onKeydown(event)
    expect(event.defaultPrevented).toBe(true)
    expect(area.xValue.value).toBe(0)
    expect(area.modelValue.value).toBe('#ff0000')
    expect(area.lastChangeDetails.value).toMatchObject({ reason: 'keyboard', event, isCanceled: true })
    expect(emit.mock.calls.map(call => call[0])).toEqual(['beforeUpdate:modelValue'])
  })

  it('keeps controlled ownership and writes a standalone ref-owned model', async () => {
    const model = ref<string | Color>('#ff0000')
    const onUpdate = vi.fn()
    const controlled = setup({ modelValue: model, onUpdate })
    controlled.updateValues(120, 100)
    expect(model.value).toBe('#ff0000')
    // The emitted model is a Color in the area's space, not a hex string.
    expect(onUpdate.mock.calls[0][0]).toEqual({ space: 'hsl', h: 120, s: 100, l: 50, alpha: 1 })
    model.value = '#0000ff'
    await nextTick()
    expect(controlled.color.value).toMatchObject({ b: 255 })
    expect(controlled.xValue.value).toBe(240)
    const owned = setup({ modelValue: model })
    owned.updateValues(120, 100)
    expect(model.value).toEqual({ space: 'hsl', h: 120, s: 100, l: 50, alpha: 1 })
    expect(colorToHex(normalizeColor(model.value))).toBe('#00ff00')
  })

  it('runs cancellation even when different channel coordinates serialize to the same hex', () => {
    const before = vi.fn((_, details) => details.cancel())
    const area = setup({ defaultValue: '#808080', onBeforeUpdate: before })
    area.updateValues(120, 0)
    expect(before).toHaveBeenCalledOnce()
    expect(area.xValue.value).toBe(0)
  })

  it.each(['hsl', 'hsb'] as const)('uses external grayscale hue updates in %s', async (space) => {
    const initial: Color = space === 'hsl'
      ? { space, h: 0, s: 0, l: 50, alpha: 1 }
      : { space, h: 0, s: 0, b: 50, alpha: 1 }
    const model = ref<Color>(initial)
    const onUpdate = vi.fn()
    const onColorUpdate = vi.fn()
    const area = setup({ modelValue: model, colorSpace: space, xChannel: 'saturation', yChannel: space === 'hsl' ? 'lightness' : 'brightness', onUpdate, onColorUpdate })
    model.value = { ...initial, h: 240 }
    await nextTick()
    expect(onUpdate).not.toHaveBeenCalled()
    area.updateValues(100, 50)
    expect(onColorUpdate).toHaveBeenCalledOnce()
    expect(onColorUpdate.mock.calls[0][0]).toMatchObject({ space, h: 240, s: 100 })
  })

  it('maps captured pointer coordinates, focuses the thumb when no input is bound, and commits on release', () => {
    const emit = vi.fn()
    const area = setup({ emit })
    const element = document.createElement('div')
    element.getBoundingClientRect = () => ({ left: 10, top: 20, width: 100, height: 100 }) as DOMRect
    element.setPointerCapture = vi.fn()
    element.hasPointerCapture = () => true
    element.releasePointerCapture = vi.fn()
    area.setThumbElement(document.createElement('span'))
    const focus = vi.spyOn(area.thumbRef.value!, 'focus')
    const surface = area.createAreaSurface(ref(element))
    const event = { target: element, pointerId: 1, clientX: 60, clientY: 45, preventDefault: vi.fn() }
    surface.props.value.onPointerdown(event)
    expect(area.xValue.value).toBe(180)
    expect(area.yValue.value).toBe(75)
    expect(focus).toHaveBeenCalledOnce()
    surface.props.value.onPointermove({ ...event, clientX: 85 })
    expect(area.xValue.value).toBe(270)
    surface.props.value.onPointerup(event)
    expect(emit.mock.calls.at(-1)?.[0]).toBe('changeEnd')
  })

  it('commits each keyboard step with the written color once a controlled parent applies it', async () => {
    const model = ref<string | Color>('#ff0000')
    const onChangeEnd = vi.fn()
    // The parent re-renders later, like a component parent: the prop is still the old color at commit time.
    const emit = vi.fn((name: string, value: Color) => {
      if (name === 'update:modelValue')
        Promise.resolve().then(() => { model.value = value })
    })
    const area = setup({ modelValue: () => model.value, emit, onChangeEnd })
    const surface = area.createAreaSurface(ref())
    surface.props.value.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }))
    expect(emit.mock.calls.map(call => call[0])).toEqual(['beforeUpdate:modelValue', 'update:modelValue', 'update:color', 'update:hex', 'change'])
    expect(emit.mock.calls.find(call => call[0] === 'update:hex')).toEqual(['update:hex', '#ff0400'])
    await nextTick()
    const written = { space: 'hsl', h: 1, s: 100, l: 50, alpha: 1 }
    expect(onChangeEnd).toHaveBeenCalledExactlyOnceWith(written)
    expect(emit.mock.calls.at(-1)).toEqual(['changeEnd', written])
  })

  it('does not commit updates a controlled parent rejects', async () => {
    const onChangeEnd = vi.fn()
    const area = setup({ modelValue: () => '#ff0000', onUpdate: () => {}, onChangeEnd })
    const element = document.createElement('div')
    element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect
    element.setPointerCapture = vi.fn()
    element.hasPointerCapture = () => true
    element.releasePointerCapture = vi.fn()
    const surface = area.createAreaSurface(ref(element))
    surface.props.value.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }))
    const event = { target: element, pointerId: 1, clientX: 50, clientY: 50, preventDefault: vi.fn() }
    surface.props.value.onPointerdown(event)
    surface.props.value.onPointerup(event)
    await nextTick()
    expect(onChangeEnd).not.toHaveBeenCalled()
  })

  it('does not commit a drag that returns to its start', () => {
    const onChangeEnd = vi.fn()
    const onChange = vi.fn()
    const area = setup({ defaultValue: { space: 'hsl', h: 180, s: 50, l: 50, alpha: 1 }, onChange, onChangeEnd })
    const element = document.createElement('div')
    element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect
    element.setPointerCapture = vi.fn()
    element.hasPointerCapture = () => true
    element.releasePointerCapture = vi.fn()
    const surface = area.createAreaSurface(ref(element))
    const event = { target: element, pointerId: 1, clientX: 60, clientY: 50, preventDefault: vi.fn() }
    surface.props.value.onPointerdown(event)
    surface.props.value.onPointermove({ ...event, clientX: 50 })
    surface.props.value.onPointerup(event)
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChangeEnd).not.toHaveBeenCalled()
    surface.props.value.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }))
    expect(onChangeEnd).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ h: 181 }))
  })

  it('does not commit a keyboard step that is cancelled or clamped', () => {
    const onChangeEnd = vi.fn()
    const area = setup({ onChangeEnd, onBeforeUpdate: (_, details) => details.cancel() })
    const surface = area.createAreaSurface(ref())
    surface.props.value.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }))
    expect(onChangeEnd).not.toHaveBeenCalled()
    const clamped = setup({ onChangeEnd })
    clamped.createAreaSurface(ref()).props.value.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }))
    expect(onChangeEnd).not.toHaveBeenCalled()
  })
})

describe('useColorArea lean surfaces', () => {
  it('builds the thumb and input surfaces on first read, once', () => {
    const area = useColorArea({ defaultValue: '#ff0000' })
    expect(area.thumb).toBe(area.thumb)
    expect(area.xInput).toBe(area.xInput)
    expect(area.yInput).toBe(area.yInput)
  })

  it('keeps a centered input style that never changes, and follows the thumb when anchored to the area', () => {
    const area = useColorArea({ defaultValue: '#ff0000' })
    expect(area.xInput.attrs.value.style).toMatchObject({ left: '50%', top: '50%' })
    expect(area.xInput.attrs.value.style).toEqual(area.yInput.attrs.value.style)
  })
})
