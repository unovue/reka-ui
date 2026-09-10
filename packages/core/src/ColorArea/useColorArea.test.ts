import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
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
    expect(area.thumb.props.value['aria-label']).toBe('Saturation, Lightness')
    expect(area.thumb.props.value.style.left).toBe('80.45%')
    expect(area.root.props.value).not.toHaveProperty('data-disabled')
    disabled.value = true
    expect(area.root.attrs.value['data-disabled']).toBe('')
    expect(area.thumb.props.value.tabindex).toBeUndefined()
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
    const model = ref('#ff0000')
    const onUpdate = vi.fn()
    const controlled = setup({ modelValue: model, onUpdate })
    controlled.updateValues(120, 100)
    expect(model.value).toBe('#ff0000')
    expect(onUpdate.mock.calls[0][0]).toBe('#00ff00')
    model.value = '#0000ff'
    await nextTick()
    await nextTick()
    expect(controlled.color.value).toMatchObject({ b: 255 })
    const owned = setup({ modelValue: model })
    owned.updateValues(120, 100)
    expect(model.value).toBe('#00ff00')
  })

  it('runs cancellation even when different channel coordinates serialize to the same hex', () => {
    const before = vi.fn((_, details) => details.cancel())
    const area = setup({ defaultValue: '#808080', onBeforeUpdate: before })
    area.updateValues(120, 0)
    expect(before).toHaveBeenCalledOnce()
    expect(area.xValue.value).toBe(0)
  })

  it('maps captured pointer coordinates, focuses the thumb, and commits on release', () => {
    const emit = vi.fn()
    const area = setup({ emit })
    const element = document.createElement('div')
    element.getBoundingClientRect = () => ({ left: 10, top: 20, width: 100, height: 100 }) as DOMRect
    element.setPointerCapture = vi.fn()
    element.hasPointerCapture = () => true
    element.releasePointerCapture = vi.fn()
    area.thumbRef.value = document.createElement('span')
    const focus = vi.spyOn(area.thumbRef.value, 'focus')
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
})
