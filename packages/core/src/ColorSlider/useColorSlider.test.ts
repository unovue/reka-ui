import type { Color } from '@/shared/color'
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
    slider.sliderProps.value['onUpdate:modelValue']([100])
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
    const modelValue = ref<string | Color>('#000000')
    const onUpdate = vi.fn()
    const controlled = setup({ channel: 'red', modelValue, onUpdate })
    controlled.setValue([200])
    expect(modelValue.value).toBe('#000000')
    expect(onUpdate.mock.calls[0][0]).toEqual({ space: 'rgb', r: 200, g: 0, b: 0, alpha: 1 })
    const channel = ref<'red' | 'alpha'>('red')
    const emit = vi.fn()
    const owned = setup({ channel, modelValue })
    owned.setValue([255])
    expect(modelValue.value).toEqual({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 })
    channel.value = 'alpha'
    expect(owned.max.value).toBe(100)
    expect(owned.thumb.props.value['aria-label']).toBe('Alpha')
    const committed = setup({ channel: 'red', emit })
    committed.setValue([255])
    committed.sliderProps.value.onValueCommit([255])
    expect(emit.mock.calls.at(-1)).toEqual(['changeEnd', { space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 }])
    // A commit without an accepted change since the last one reports nothing.
    committed.sliderProps.value.onValueCommit([255])
    expect(emit.mock.calls.filter(call => call[0] === 'changeEnd')).toHaveLength(1)
    await nextTick()
  })
})

describe('useColorSlider changeEnd', () => {
  const scopes: ReturnType<typeof effectScope>[] = []
  function setup(props: Parameters<typeof useColorSlider>[0]) {
    const scope = effectScope()
    scopes.push(scope)
    return scope.run(() => useColorSlider(props))!
  }
  afterEach(() => scopes.splice(0).forEach(scope => scope.stop()))

  // These drive `sliderProps` in SliderRoot's order: a drag writes values and commits
  // the current value on release only when it changed; a keyboard step commits the
  // next value *before* writing it.
  function keyboardStep(slider: ReturnType<typeof useColorSlider>, value: number) {
    slider.sliderProps.value.onValueCommit([value])
    slider.sliderProps.value['onUpdate:modelValue']([value])
  }
  const hues = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls.map(call => Math.round(call[0].h))

  it('does not lag behind after a drag back to its start', () => {
    const onChange = vi.fn()
    const onChangeEnd = vi.fn()
    const slider = setup({ channel: 'hue', defaultValue: { space: 'hsl', h: 120, s: 100, l: 50, alpha: 1 }, onChange, onChangeEnd })
    slider.sliderProps.value['onUpdate:modelValue']([130])
    slider.sliderProps.value['onUpdate:modelValue']([120])
    // SliderRoot sends no valueCommit: the drag ended where it started.
    expect(onChangeEnd).not.toHaveBeenCalled()
    keyboardStep(slider, 121)
    expect(hues(onChangeEnd)).toEqual([121])
    keyboardStep(slider, 122)
    expect(hues(onChange)).toEqual([130, 120, 121, 122])
    expect(hues(onChangeEnd)).toEqual([121, 122])
  })

  it('reports nothing for updates a controlled parent rejects, and does not lag afterwards', async () => {
    const model = ref<Color>({ space: 'hsl', h: 120, s: 100, l: 50, alpha: 1 })
    const accept = ref(false)
    const onChangeEnd = vi.fn()
    const slider = setup({
      channel: 'hue',
      modelValue: () => model.value,
      onUpdate: (value) => {
        if (accept.value)
          model.value = value
      },
      onChangeEnd,
    })
    slider.sliderProps.value['onUpdate:modelValue']([130])
    keyboardStep(slider, 121)
    await nextTick()
    expect(onChangeEnd).not.toHaveBeenCalled()
    accept.value = true
    keyboardStep(slider, 121)
    expect(hues(onChangeEnd)).toEqual([121])
    slider.sliderProps.value['onUpdate:modelValue']([140])
    slider.sliderProps.value.onValueCommit([140])
    keyboardStep(slider, 141)
    expect(hues(onChangeEnd)).toEqual([121, 140, 141])
  })
})
