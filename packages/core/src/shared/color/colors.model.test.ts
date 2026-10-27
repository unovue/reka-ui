import type { Color } from '@/shared/color'
import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick, ref } from 'vue'
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from '@/ColorArea'
import { ColorFieldInput, ColorFieldRoot } from '@/ColorField'
import { ColorSliderRoot, ColorSliderThumb, ColorSliderTrack } from '@/ColorSlider'
import { ColorSwatchPickerItem, ColorSwatchPickerRoot } from '@/ColorSwatchPicker'
import { ConfigProvider } from '@/ConfigProvider'

vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
window.HTMLElement.prototype.setPointerCapture = vi.fn()
window.HTMLElement.prototype.releasePointerCapture = vi.fn()
window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => true)

const wrappers: { unmount: () => void }[] = []
afterEach(() => wrappers.splice(0).forEach(w => w.unmount()))
function track<T extends { unmount: () => void }>(wrapper: T) {
  wrappers.push(wrapper)
  return wrapper
}

/** A parent that owns the model and writes back whatever the component emits. */
function mountControlled(component: any, initial: string | Color, props: Record<string, unknown>, children: () => any) {
  const model = ref<string | Color>(initial)
  const updates: Color[] = []
  const wrapper = track(mount(() => h(component, {
    ...props,
    'modelValue': model.value,
    'onUpdate:modelValue': (value: Color) => {
      updates.push(value)
      model.value = value
    },
  }, children)))
  return { wrapper, model, updates }
}

describe('color model: regressions fixed by the Color object model (#2789)', () => {
  it.each([false, true])('colorField: saturation steps on #050404 do not get stuck (controlled: %s)', async (controlled) => {
    const field = controlled
      ? mountControlled(ColorFieldRoot, '#050404', { channel: 'saturation' }, () => h(ColorFieldInput)).wrapper
      : track(mount(() => h(ColorFieldRoot, { defaultValue: '#050404', channel: 'saturation' }, () => h(ColorFieldInput))))
    const input = field.find('input')
    expect(input.element.value).toBe('11')
    const seen: string[] = []
    for (let i = 0; i < 3; i++) {
      await input.trigger('keydown', { key: 'ArrowUp' })
      await nextTick()
      seen.push(input.element.value)
    }
    expect(seen).toEqual(['12', '13', '14'])
  })

  it.each([false, true])('colorField: typing a hue on #808080 keeps it (controlled: %s)', async (controlled) => {
    const update = vi.fn()
    const field = controlled
      ? mountControlled(ColorFieldRoot, '#808080', { channel: 'hue' }, () => h(ColorFieldInput))
      : { wrapper: track(mount(() => h(ColorFieldRoot, { 'defaultValue': '#808080', 'channel': 'hue', 'onUpdate:modelValue': update }, () => h(ColorFieldInput)))), updates: undefined }
    const input = field.wrapper.find('input')
    expect(input.element.value).toBe('0')
    await input.setValue('200')
    await input.trigger('blur')
    await nextTick()
    expect(input.element.value).toBe('200')
    const emitted = field.updates?.[0] ?? update.mock.calls[0][0]
    expect(emitted).toMatchObject({ space: 'hsl', h: 200, s: 0 })
    // Blurring again without an edit does not re-parse (and lose) the hue.
    await input.trigger('blur')
    expect(input.element.value).toBe('200')
  })

  it.each([
    ['area', ColorAreaRoot, { colorSpace: 'hsb', xChannel: 'saturation', yChannel: 'brightness' }, () => h(ColorAreaArea, {}, () => h(ColorAreaThumb)), '[role=application]', 'ArrowRight'],
    ['field', ColorFieldRoot, { colorSpace: 'hsb', channel: 'brightness' }, () => h(ColorFieldInput), 'input', 'ArrowUp'],
    ['slider', ColorSliderRoot, { colorSpace: 'hsb', channel: 'saturation' }, () => [h(ColorSliderTrack), h(ColorSliderThumb)], '[role=slider]', 'ArrowRight'],
  ] as const)('%s: a controlled Color model is emitted as a Color, not a hex string', async (_, component, props, children, selector, key) => {
    const initial: Color = { space: 'hsb', h: 210, s: 40, b: 60, alpha: 1 }
    const hex = vi.fn()
    const { wrapper, updates } = mountControlled(component, initial, { ...props, 'onUpdate:hex': hex }, children)
    await wrapper.find(selector).trigger('keydown', { key })
    expect(updates).toHaveLength(1)
    expect(typeof updates[0]).toBe('object')
    expect(updates[0]).toMatchObject({ space: 'hsb', h: 210 })
    // Hex stays available as an opt-in output.
    expect(hex).toHaveBeenCalledOnce()
    expect(hex.mock.calls[0][0]).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('colorArea: the thumb stays with a controlled parent that rejects the update', async () => {
    const update = vi.fn()
    const wrapper = track(mount(() => h(ColorAreaRoot, {
      'modelValue': { space: 'hsl', h: 100, s: 50, l: 50, alpha: 1 },
      'onUpdate:modelValue': update,
    }, () => h(ColorAreaArea, {}, () => h(ColorAreaThumb)))))
    const thumb = wrapper.find('[role=slider]')
    const area = wrapper.find('[role=application]')
    const before = thumb.attributes('style')
    expect(thumb.attributes('aria-valuenow')).toBe('100')

    await area.trigger('keydown', { key: 'ArrowRight' })
    await area.trigger('keydown', { key: 'ArrowUp', shiftKey: true })
    await nextTick()

    expect(update).toHaveBeenCalledTimes(2)
    expect(thumb.attributes('aria-valuenow')).toBe('100')
    expect(thumb.attributes('aria-valuetext')).toBe('Hue 100, Saturation 50')
    expect(thumb.attributes('style')).toBe(before)
  })

  it('colorArea: a hue-only change on a grey emits a distinct Color, never a repeated hex', async () => {
    const { wrapper, updates } = mountControlled(ColorAreaRoot, { space: 'hsl', h: 0, s: 0, l: 50, alpha: 1 }, { xChannel: 'hue', yChannel: 'saturation' }, () => h(ColorAreaArea, {}, () => h(ColorAreaThumb)))
    const area = wrapper.find('[role=application]')
    await area.trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    await area.trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    expect(updates.map(u => (u as { h: number }).h)).toEqual([1, 2])
    expect(wrapper.find('[role=slider]').attributes('aria-valuenow')).toBe('2')
  })

  it('colorSlider: a hue slider keeps the hue of a grey across a controlled round trip', async () => {
    const { wrapper, model } = mountControlled(ColorSliderRoot, { space: 'hsl', h: 0, s: 0, l: 50, alpha: 1 }, { channel: 'hue' }, () => [h(ColorSliderTrack), h(ColorSliderThumb)])
    const thumb = wrapper.find('[role=slider]')
    await thumb.trigger('keydown', { key: 'End' })
    await nextTick()
    expect(model.value).toMatchObject({ space: 'hsl', h: 360, s: 0 })
    expect(thumb.attributes('aria-valuenow')).toBe('360')
  })
})

describe('color model: change and changeEnd across the family', () => {
  it.each([
    ['area', ColorAreaRoot, { xChannel: 'red', yChannel: 'green' }, () => h(ColorAreaArea, {}, () => h(ColorAreaThumb)), '[role=application]', 'ArrowRight'],
    ['field', ColorFieldRoot, { channel: 'red' }, () => h(ColorFieldInput), 'input', 'ArrowUp'],
    ['slider', ColorSliderRoot, { channel: 'red' }, () => [h(ColorSliderTrack), h(ColorSliderThumb)], '[role=slider]', 'ArrowRight'],
  ] as const)('%s emits the same Color through every event of a keyboard step', async (_, component, props, children, selector, key) => {
    const events: [string, unknown][] = []
    const on = (name: string) => (value: unknown) => events.push([name, value])
    const wrapper = track(mount(() => h(component as any, {
      ...props,
      'defaultValue': '#000000',
      'onUpdate:modelValue': on('update:modelValue'),
      'onUpdate:color': on('update:color'),
      'onUpdate:hex': on('update:hex'),
      'onChange': on('change'),
      'onChangeEnd': on('changeEnd'),
    }, children)))
    await wrapper.find(selector).trigger('keydown', { key })
    const color = { space: 'rgb', r: 1, g: 0, b: 0, alpha: 1 }
    expect(events).toEqual([
      ['update:modelValue', color],
      ['update:color', color],
      ['update:hex', '#010000'],
      ['change', color],
      ['changeEnd', color],
    ])
  })
})

describe('colorArea right-to-left', () => {
  function mountArea(props: Record<string, unknown>, wrap = (node: any) => node) {
    const update = vi.fn()
    const wrapper = track(mount(() => wrap(h(ColorAreaRoot, {
      'defaultValue': { space: 'hsl', h: 90, s: 50, l: 50, alpha: 1 },
      'onUpdate:modelValue': update,
      ...props,
    }, { default: ({ style }: { style: Record<string, string> }) => h(ColorAreaArea, { style }, () => h(ColorAreaThumb)) }))))
    return { wrapper, update }
  }

  it('swaps ArrowLeft and ArrowRight', async () => {
    const { wrapper } = mountArea({ dir: 'rtl' })
    const area = wrapper.find('[role=application]')
    await area.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.find('[role=slider]').attributes('aria-valuenow')).toBe('91')
    await area.trigger('keydown', { key: 'ArrowRight' })
    await area.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.find('[role=slider]').attributes('aria-valuenow')).toBe('89')
  })

  it('mirrors the thumb position and the horizontal gradient', () => {
    const { wrapper } = mountArea({ dir: 'rtl' })
    expect(wrapper.find('[role=slider]').attributes('style')).toContain('left: 75%')
    expect(wrapper.find('[role=application]').attributes('style')).toContain('linear-gradient(to left, rgb(255, 0, 0)')
    expect(wrapper.find('[role=group]').attributes('dir')).toBe('rtl')
    const ltr = mountArea({}).wrapper
    expect(ltr.find('[role=slider]').attributes('style')).toContain('left: 25%')
    expect(ltr.find('[role=application]').attributes('style')).toContain('linear-gradient(to right, rgb(255, 0, 0)')
  })

  it('mirrors pointer x', async () => {
    const { wrapper, update } = mountArea({ dir: 'rtl' })
    const area = wrapper.find('[role=application]')
    area.element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect
    await fireEvent.pointerDown(area.element, { pointerId: 1, clientX: 10, clientY: 50 })
    // 10px from the left edge is 90% of the way along a right-to-left axis.
    expect(update.mock.calls[0][0]).toMatchObject({ h: 324 })
  })

  it('inherits the direction from ConfigProvider', async () => {
    const { wrapper } = mountArea({}, node => h(ConfigProvider, { dir: 'rtl' }, () => node))
    await wrapper.find('[role=application]').trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.find('[role=slider]').attributes('aria-valuenow')).toBe('91')
  })
})

describe('colorSwatchPicker values', () => {
  const red: Color = { space: 'hsl', h: 0, s: 100, l: 50, alpha: 1 }
  const blue: Color = { space: 'rgb', r: 0, g: 0, b: 255, alpha: 1 }

  it('selects Color items structurally from a hex model and emits the item value', async () => {
    const update = vi.fn()
    const wrapper = track(mount(() => h(ColorSwatchPickerRoot, { 'modelValue': '#ff0000', 'onUpdate:modelValue': update }, () => [
      h(ColorSwatchPickerItem, { value: red }),
      h(ColorSwatchPickerItem, { value: blue }),
    ])))
    const [first, second] = wrapper.findAll('[role=option]')
    expect(first.attributes('aria-selected')).toBe('true')
    expect(second.attributes('aria-selected')).toBe('false')
    expect(first.attributes('data-color')).toBe('#ff0000')
    expect(second.attributes('aria-label')).toBe('vibrant blue-violet')
    await second.trigger('click')
    expect(update.mock.calls[0][0]).toBe(blue)
  })

  it('selects hex items from a Color model in multiple mode', () => {
    const wrapper = track(mount(() => h(ColorSwatchPickerRoot, { modelValue: [red], multiple: true }, () => [
      h(ColorSwatchPickerItem, { value: '#FF0000' }),
      h(ColorSwatchPickerItem, { value: '#0000ff' }),
    ])))
    expect(wrapper.findAll('[role=option]').map(o => o.attributes('aria-selected'))).toEqual(['true', 'false'])
  })
})
