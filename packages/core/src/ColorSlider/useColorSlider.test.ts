import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useColorSlider } from './useColorSlider'

describe('useColorSlider', () => {
  const scopes: ReturnType<typeof effectScope>[] = []
  function setup(props: Parameters<typeof useColorSlider>[0] = { channel: 'red' }) {
    const scope = effectScope()
    scopes.push(scope)
    return scope.run(() => useColorSlider(props))!
  }
  afterEach(() => scopes.splice(0).forEach(scope => scope.stop()))

  it('exposes shared slider surfaces and retains fractional channel precision', async () => {
    const slider = setup({ channel: 'hue', defaultValue: '#ff0000' })
    slider.setValue([120.45])
    await nextTick()
    expect(slider.channelValue.value).toBe(120.45)
    expect(slider.thumb.props.value['aria-label']).toBe('Hue')
    expect(slider.thumb.props.value['aria-valuetext']).toBe('120')
    expect(slider.track.props.value.style).toBeTruthy()
    slider.setValue([999])
    expect(slider.channelValue.value).toBe(360)
  })

  it('cancels delegated slider updates before precision state and change events mutate', () => {
    const emit = vi.fn()
    const slider = setup({ channel: 'red', emit, onBeforeUpdate: (_, details) => details.cancel() })
    slider.root.props.value['onUpdate:modelValue']([100])
    expect(slider.channelValue.value).toBe(0)
    expect(slider.lastChangeDetails.value).toMatchObject({ reason: 'slider', isCanceled: true })
    expect(emit.mock.calls.map(call => call[0])).toEqual(['beforeUpdate:modelValue'])
  })

  it('cancels hue changes that serialize to the same achromatic color', () => {
    const slider = setup({ channel: 'hue', onBeforeUpdate: (_, details) => details.cancel() })
    slider.setValue([120])
    expect(slider.channelValue.value).toBe(0)
    expect(slider.modelValue.value).toBe('#000000')
  })

  it('supports controlled and ref-owned models, reactive ranges and commit events', async () => {
    const modelValue = ref('#000000')
    const onUpdate = vi.fn()
    const controlled = setup({ channel: 'red', modelValue, onUpdate })
    controlled.setValue([200])
    expect(modelValue.value).toBe('#000000')
    expect(onUpdate.mock.calls[0][0]).toBe('#c80000')
    const channel = ref<'red' | 'alpha'>('red')
    const emit = vi.fn()
    const owned = setup({ channel, modelValue })
    owned.setValue([255])
    expect(modelValue.value).toBe('#ff0000')
    channel.value = 'alpha'
    expect(owned.max.value).toBe(100)
    expect(owned.thumb.props.value['aria-label']).toBe('Alpha')
    const committed = setup({ channel: 'red', emit })
    committed.setValue([255])
    committed.root.props.value.onValueCommit([255])
    expect(emit.mock.calls.at(-1)).toEqual(['changeEnd', '#ff0000'])
    await nextTick()
  })
})
