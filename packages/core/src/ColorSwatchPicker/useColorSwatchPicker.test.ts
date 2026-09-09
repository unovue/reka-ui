import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useColorSwatchPicker } from './useColorSwatchPicker'

describe('useColorSwatchPicker', () => {
  it('supports single and multiple selection with reactive disabled and selection behavior', () => {
    const disabled = ref(false)
    const selectionBehavior = ref<'toggle' | 'replace'>('toggle')
    const picker = useColorSwatchPicker({ multiple: true, disabled, selectionBehavior })
    picker.select('#ff0000')
    picker.select('#00ff00')
    expect(picker.modelValue.value).toEqual(['#ff0000', '#00ff00'])
    picker.select('#ff0000')
    expect(picker.modelValue.value).toEqual(['#00ff00'])
    disabled.value = true
    picker.select('#ff0000')
    expect(picker.modelValue.value).toEqual(['#00ff00'])
    disabled.value = false
    selectionBehavior.value = 'replace'
    picker.select('#ff0000')
    expect(picker.modelValue.value).toEqual(['#ff0000'])
    const single = useColorSwatchPicker()
    single.select('#ff0000')
    single.select('#ff0000')
    expect(single.modelValue.value).toBeUndefined()
  })

  it('cancels delegated selection and preserves controlled ownership', () => {
    const onUpdate = vi.fn()
    const picker = useColorSwatchPicker({ onUpdate, onBeforeUpdate: (_, details) => details.cancel() })
    picker.root.props.value['onUpdate:modelValue']('#ff0000')
    expect(picker.modelValue.value).toBe('')
    expect(onUpdate).not.toHaveBeenCalled()
    expect(picker.lastChangeDetails.value).toMatchObject({ reason: 'selection', isCanceled: true })
    const modelValue = ref('#000000')
    const controlled = useColorSwatchPicker({ modelValue, onUpdate })
    controlled.select('#ffffff')
    expect(modelValue.value).toBe('#000000')
    expect(onUpdate.mock.calls[0][0]).toBe('#ffffff')
    const owned = useColorSwatchPicker({ modelValue })
    owned.select('#ffffff')
    expect(modelValue.value).toBe('#ffffff')
  })

  it('shares reactive item and swatch surfaces, including invalid label fallback', () => {
    const picker = useColorSwatchPicker()
    const value = ref('#ff0000')
    const item = picker.getItemSurface(value)
    const swatch = picker.getItemSwatchSurface(value)
    expect(item.attrs.value['data-color']).toBe('#ff0000')
    expect(item.props.value).not.toHaveProperty('data-color')
    expect(swatch.props.value.color).toBe('#ff0000')
    value.value = 'invalid'
    expect(item.props.value['aria-label']).toBe('invalid')
    expect(swatch.props.value.color).toBe('invalid')
  })
})
