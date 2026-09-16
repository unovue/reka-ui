import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { effectScope, h, nextTick, ref } from 'vue'
import { useColorArea } from '@/ColorArea'
import { ColorFieldInput, ColorFieldRoot, useColorField } from '@/ColorField'
import { useColorSlider } from '@/ColorSlider'
import { useColorSwatchPicker } from '@/ColorSwatchPicker'

describe('maintainer color regressions', () => {
  it.each([
    ['ArrowUp', 17],
    ['ArrowDown', 15],
    ['PageUp', 26],
    ['PageDown', 6],
    ['Home', 0],
    ['End', 255],
  ] as const)('keeps a controlled field step on blur after typing (%s)', async (key, expected) => {
    const model = ref('#100000')
    const wrapper = mount(() => h(ColorFieldRoot, {
      'modelValue': model.value,
      'channel': 'red',
      'onUpdate:modelValue': (value: string) => { model.value = value },
    }, () => h(ColorFieldInput)))
    try {
      const input = wrapper.find('input')
      await input.setValue('1')
      await input.trigger('keydown', { key })
      expect(input.element.value).toBe(String(expected))
      const stepped = model.value
      await input.trigger('blur')
      expect(model.value).toBe(stepped)
    }
    finally {
      wrapper.unmount()
    }
  })

  it.each(['area', 'slider'] as const)('suppresses repeated boundary updates but preserves fractional changes (%s)', async (family) => {
    const scope = effectScope()
    try {
      const onUpdate = vi.fn()
      const control = scope.run(() => family === 'area'
        ? useColorArea({ defaultValue: '#100000', xChannel: 'red', yChannel: 'green', onUpdate })
        : useColorSlider({ defaultValue: '#100000', channel: 'red', onUpdate }))!
      const update = (value: number) => 'updateValues' in control ? control.updateValues(value, 0) : control.setValue([value])
      update(0)
      await nextTick()
      update(0)
      expect(onUpdate).toHaveBeenCalledOnce()
      update(0.1)
      expect(onUpdate).toHaveBeenCalledTimes(2)
      update(0.1)
      expect(onUpdate).toHaveBeenCalledTimes(2)
    }
    finally {
      scope.stop()
    }
  })

  it.each(['area', 'slider'] as const)('exposes standalone color, change and commit callbacks (%s)', (family) => {
    const scope = effectScope()
    try {
      const onColorUpdate = vi.fn()
      const onChange = vi.fn()
      const onChangeEnd = vi.fn()
      const callbacks = { onColorUpdate, onChange, onChangeEnd }
      const control = scope.run(() => family === 'area'
        ? useColorArea({ ...callbacks, xChannel: 'red', yChannel: 'green', defaultValue: '#000000' })
        : useColorSlider({ ...callbacks, channel: 'red' }))!
      if ('updateValues' in control) {
        control.updateValues(128, 0)
        control.commitValues()
      }
      else {
        control.setValue([128])
        control.handleValueCommit()
      }
      expect(onColorUpdate).toHaveBeenCalledOnce()
      expect(onChange).toHaveBeenCalledExactlyOnceWith('#800000')
      expect(onChangeEnd).toHaveBeenCalledExactlyOnceWith('#800000')
    }
    finally {
      scope.stop()
    }
  })

  it('does not notify accepted-change callbacks after cancellation', () => {
    const scope = effectScope()
    try {
      const onColorUpdate = vi.fn()
      const onChange = vi.fn()
      const onBeforeUpdate = (_: unknown, details: { cancel: () => void }) => details.cancel()
      scope.run(() => {
        useColorArea({ onColorUpdate, onChange, onBeforeUpdate }).updateValues(120, 100)
        useColorSlider({ channel: 'red', onColorUpdate, onChange, onBeforeUpdate }).setValue([128])
        useColorField({ onColorUpdate, onBeforeUpdate }).increment()
      })
      expect(onColorUpdate).not.toHaveBeenCalled()
      expect(onChange).not.toHaveBeenCalled()
    }
    finally {
      scope.stop()
    }
  })

  it('exposes a standalone field color callback', () => {
    const scope = effectScope()
    const onColorUpdate = vi.fn()
    scope.run(() => useColorField({ onColorUpdate }).increment())
    expect(onColorUpdate).toHaveBeenCalledOnce()
    scope.stop()
  })

  it('keeps child bindings out of DOM root surfaces', () => {
    const scope = effectScope()
    try {
      const slider = scope.run(() => useColorSlider({ channel: 'red' }))!
      const picker = useColorSwatchPicker()
      for (const root of [slider.root, picker.root]) {
        for (const key of ['modelValue', 'onUpdate:modelValue', 'onValueCommit', 'selectionBehavior', 'inverted', 'multiple'])
          expect(root.attrs.value).not.toHaveProperty(key)
      }
      expect(slider.sliderProps.value.modelValue).toEqual([0])
      expect(picker.listboxProps.value.modelValue).toBe('')
    }
    finally {
      scope.stop()
    }
  })
})
