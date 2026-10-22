import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { h } from 'vue'
import { colorToString, convertToHsb, convertToHsl, convertToOklch, convertToRgb, parseColor } from '@/shared/color'
import { ColorFieldInput, ColorFieldRoot } from '.'

/** Mounts an OKLCH chroma field with a labeled input; overrides also exercise full-color mode. */
function mountField(props: Record<string, unknown>) {
  return mount(ColorFieldRoot, {
    props: { colorSpace: 'oklch', channel: 'chroma', ...props },
    slots: { default: () => h(ColorFieldInput, { 'aria-label': 'Chroma' }) },
  })
}

const nativeSpaces = [
  { colorSpace: 'rgb', convert: convertToRgb },
  { colorSpace: 'hsl', convert: convertToHsl },
  { colorSpace: 'hsb', convert: convertToHsb },
  { colorSpace: 'oklch', convert: convertToOklch },
] as const

describe.each(nativeSpaces)('full-color commits in $colorSpace', ({ colorSpace, convert }) => {
  it.each([
    '#369',
    '#33669980',
    'rgba(51, 102, 153, 0.5)',
    'hsla(210, 50%, 40%, 0.5)',
    'oklch(62.5% .18 250 / .5)',
  ])('commits %s in the configured space without changing the hex output', async (value) => {
    const wrapper = mountField({ colorSpace, channel: undefined })
    const input = wrapper.get('input')
    await input.setValue(value)
    await input.trigger('blur')

    const parsed = parseColor(value)
    const hex = colorToString(parsed, 'hex')
    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toEqual(convert(parsed))
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe(hex)
    expect(input.element.value).toBe(hex)
  })

  it.each([
    ['ArrowUp', '#33669a'],
    ['ArrowDown', '#336698'],
    ['PageUp', '#3366a3'],
    ['PageDown', '#33668f'],
    ['Home', '#000000'],
    ['End', '#ffffff'],
  ])('steps with %s in the configured space', async (key, hex) => {
    const wrapper = mountField({ colorSpace, channel: undefined, defaultValue: '#336699' })
    const input = wrapper.get('input')
    await input.trigger('keydown', { key })

    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toEqual(convert(parseColor(hex)))
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe(hex)
    expect(input.element.value).toBe(hex)
  })
})

describe('oklch field precision', () => {
  it('updates displayed values when the channel changes', async () => {
    const wrapper = mountField({ defaultValue: 'oklch(60% .2 240)' })
    await wrapper.setProps({ channel: 'hue' })
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('240')
  })

  it('applies precise CSS string updates with identical sRGB hex values', async () => {
    const wrapper = mountField({ modelValue: 'oklch(60% 0 120)', channel: 'hue' })
    await wrapper.setProps({ modelValue: 'oklch(60% 0 240)' })
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('240')
  })

  it('provides a decimal mobile keyboard for chroma', () => {
    const wrapper = mountField({ defaultValue: 'oklch(60% .2 240)' })
    expect(wrapper.get('input').attributes('inputmode')).toBe('decimal')
  })

  it('keeps multiple fractional keyboard steps exact', async () => {
    const wrapper = mountField({ defaultValue: 'oklch(60% .2 240)' })
    for (let index = 0; index < 10; index++)
      await wrapper.get('input').trigger('keydown', { key: 'ArrowUp' })
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('0.21')
    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toMatchObject({ space: 'oklch', c: expect.closeTo(0.21, 6), h: 240, l: 60 })
  })

  it('accepts CSS oklch input in full-color mode and emits the native value', async () => {
    const wrapper = mountField({ channel: undefined })
    await wrapper.get('input').setValue('oklch(62.5% .18 250 / .5)')
    await wrapper.get('input').trigger('blur')
    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toEqual({ space: 'oklch', l: 62.5, c: 0.18, h: 250, alpha: 0.5 })
  })

  it.each([
    'rgba(51, 102, 153, 0.5)',
    'oklch(62.5% .18 250 / .5)',
  ])('preserves committed coordinates and alpha when switching %s to channel mode', async (value) => {
    const wrapper = mountField({ channel: undefined, modelValue: '#000000' })
    const input = wrapper.get('input')
    await input.setValue(value)
    await input.trigger('keydown', { key: 'Enter' })

    const expected = convertToOklch(parseColor(value))
    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toEqual(expected)
    // A controlled parent's hex echo must not quantize the committed native channels or alpha.
    await wrapper.setProps({ modelValue: wrapper.emitted('update:modelValue')?.at(-1)?.[0] as string, channel: 'chroma' })
    expect(input.element.value).toBe(String(Number(expected.c.toFixed(3))))
    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toEqual({ ...expected, c: expect.closeTo(expected.c + 0.001, 8) })
  })

  it('passes axe for chroma channel input', async () => {
    const wrapper = mountField({ defaultValue: 'oklch(60% .2 240)' })
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })
})
