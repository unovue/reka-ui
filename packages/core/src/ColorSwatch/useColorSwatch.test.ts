import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useColorSwatch } from './useColorSwatch'

describe('useColorSwatch', () => {
  it('derives reactive accessibility and semantic state separately from props', () => {
    const color = ref('#ff0000')
    const label = ref<string>()
    const swatch = useColorSwatch({ color, label })
    expect(swatch.root.props.value.role).toBe('img')
    expect(swatch.root.props.value).not.toHaveProperty('data-color-contrast')
    expect(swatch.root.attrs.value['data-color-contrast']).toBeTruthy()
    color.value = '#00000000'
    expect(swatch.alpha.value).toBe(0)
    expect(swatch.root.attrs.value['data-no-color']).toBe('')
    expect(swatch.root.props.value['aria-label']).toBe('transparent')
    label.value = 'Clear'
    expect(swatch.root.props.value['aria-label']).toBe('Clear')
  })

  it('does not warn for omitted or empty colors but still warns for invalid colors', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      for (const color of [undefined, '']) {
        const swatch = useColorSwatch({ color })
        expect(swatch.root.attrs.value['data-no-color']).toBe('')
        expect(swatch.colorContrast.value).toBeUndefined()
      }
      expect(warn).not.toHaveBeenCalled()
      expect(useColorSwatch({ color: 'invalid' }).colorContrast.value).toBeUndefined()
      expect(warn).toHaveBeenCalledOnce()
    }
    finally {
      warn.mockRestore()
    }
  })

  it('supports color objects, empty values and invalid color fallback', () => {
    const swatch = useColorSwatch({ color: { space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 } })
    expect(swatch.colorString.value).toBe('#ff0000')
    expect(useColorSwatch().label.value).toBe('transparent')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const invalid = useColorSwatch({ color: 'invalid' })
    expect(invalid.root.attrs.value['data-no-color']).toBe('')
    expect(invalid.label.value).toBe('transparent')
    warn.mockRestore()
  })
})
