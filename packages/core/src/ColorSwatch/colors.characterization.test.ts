import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from '@/ColorArea'
import { ColorFieldInput, ColorFieldRoot } from '@/ColorField'
import { ColorSliderRoot, ColorSliderThumb, ColorSliderTrack } from '@/ColorSlider'
import { ColorSwatch } from '@/ColorSwatch'
import { ColorSwatchPickerItem, ColorSwatchPickerRoot } from '@/ColorSwatchPicker'

vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })

describe('color shell characterization', () => {
  it('chains area keyboard listeners and preserves controlled values and form channels', async () => {
    const listener = vi.fn()
    const update = vi.fn()
    const wrapper = mount(() => h('form', [h(ColorAreaRoot, {
      'modelValue': '#ff0000',
      'xName': 'hue',
      'yName': 'saturation',
      'onUpdate:modelValue': update,
    }, () => h(ColorAreaArea, { onKeydown: listener }, () => h(ColorAreaThumb)))]))
    await wrapper.find('[role=application]').trigger('keydown', { key: 'ArrowRight' })
    expect(listener).toHaveBeenCalledOnce()
    expect(update.mock.calls[0][0]).toMatch(/^#/)
    expect(wrapper.findAll('input').map(i => i.attributes('name'))).toEqual(['hue', 'saturation'])
    expect(wrapper.find('[role=slider]').attributes('aria-label')).toBe('Hue, Saturation')
    wrapper.unmount()
  })

  it('chains field input listeners and preserves disabled/readonly and form bindings', async () => {
    const listener = vi.fn()
    const wrapper = mount(() => h('form', [h(ColorFieldRoot, { name: 'color', readonly: true, disabled: true }, () => h(ColorFieldInput, { id: 'color', onInput: listener }))]))
    const input = wrapper.find('#color')
    input.element.dispatchEvent(new Event('input', { bubbles: true }))
    expect(listener).toHaveBeenCalledOnce()
    expect(input.attributes()).toMatchObject({ 'data-disabled': '', 'data-readonly': '', 'readonly': '', 'disabled': '' })
    expect(wrapper.find('input[name=color]').element.value).toBe('#000000')
    wrapper.unmount()
  })

  it('chains slider keyboard listeners and retains channel labels', async () => {
    const listener = vi.fn()
    const update = vi.fn()
    const wrapper = mount(() => h(ColorSliderRoot, { 'channel': 'red', 'modelValue': '#000000', 'onUpdate:modelValue': update }, () => [h(ColorSliderTrack), h(ColorSliderThumb, { onKeydown: listener })]))
    await wrapper.find('[role=slider]').trigger('keydown', { key: 'ArrowRight' })
    expect(listener).toHaveBeenCalledOnce()
    expect(update.mock.calls[0][0]).toBe('#010000')
    expect(wrapper.find('[role=slider]').attributes('aria-label')).toBe('Red')
    wrapper.unmount()
  })

  it('keeps swatch overrides and transparency state', () => {
    const wrapper = mount(ColorSwatch, { props: { color: '#00000000', label: 'Clear' } })
    expect(wrapper.attributes()).toMatchObject({ 'role': 'img', 'aria-label': 'Clear', 'data-no-color': '' })
    wrapper.unmount()
  })

  it('chains picker listeners and emits controlled selection', async () => {
    const listener = vi.fn()
    const update = vi.fn()
    const wrapper = mount(() => h(ColorSwatchPickerRoot, { 'modelValue': '#ff0000', 'onUpdate:modelValue': update }, () => h(ColorSwatchPickerItem, { value: '#00ff00', onClick: listener })))
    await wrapper.find('[role=option]').trigger('click')
    expect(listener).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalled()
    expect(update.mock.calls[0][0]).toBe('#00ff00')
    expect(wrapper.find('[role=option]').attributes('data-color')).toBe('#00ff00')
    wrapper.unmount()
  })
})

// These are additive model-contract checks; the characterization above ran before extraction.
describe('color shell cancellable updates', () => {
  it.each(['area', 'field', 'slider', 'picker'])('cancels %s updates at the shell boundary', async (family) => {
    const before = vi.fn((_: unknown, details: { cancel: () => void }) => details.cancel())
    const update = vi.fn()
    const colorUpdate = vi.fn()
    const modelProps = {
      'modelValue': '#000000',
      'onBeforeUpdate:modelValue': before,
      'onUpdate:modelValue': update,
      'onUpdate:color': colorUpdate,
    }
    const wrapper = mount(() => {
      switch (family) {
        case 'area': return h(ColorAreaRoot, { ...modelProps, xChannel: 'red', yChannel: 'green' }, () => h(ColorAreaArea, {}, () => h(ColorAreaThumb)))
        case 'field': return h(ColorFieldRoot, modelProps, () => h(ColorFieldInput))
        case 'slider': return h(ColorSliderRoot, { ...modelProps, channel: 'red' }, () => h(ColorSliderThumb))
        default: return h(ColorSwatchPickerRoot, modelProps, () => h(ColorSwatchPickerItem, { value: '#ffffff' }))
      }
    })
    if (family === 'picker')
      await wrapper.find('[role=option]').trigger('click')
    else if (family === 'field')
      await wrapper.find('input').trigger('keydown', { key: 'ArrowUp' })
    else
      await wrapper.find(family === 'area' ? '[role=application]' : '[role=slider]').trigger('keydown', { key: 'ArrowRight' })
    expect(before).toHaveBeenCalledOnce()
    expect(update).not.toHaveBeenCalled()
    expect(colorUpdate).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
