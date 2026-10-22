import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { h } from 'vue'
import { ColorFieldInput, ColorFieldRoot } from '.'

function mountField(props: Record<string, unknown>) {
  return mount(ColorFieldRoot, {
    props: { colorSpace: 'oklch', channel: 'chroma', ...props },
    slots: { default: () => h(ColorFieldInput, { 'aria-label': 'Chroma' }) },
  })
}

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

  it('passes axe for chroma channel input', async () => {
    const wrapper = mountField({ defaultValue: 'oklch(60% .2 240)' })
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })
})
