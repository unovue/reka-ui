import type { ColorChannel, OKLCHColor } from '@/shared/color'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, ref } from 'vue'
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from '.'

/** Mounts a chroma/lightness OKLCH area with a thumb, allowing each test to override axes or values. */
function mountArea(props: Record<string, unknown>) {
  return mount(ColorAreaRoot, {
    props: { colorSpace: 'oklch', xChannel: 'chroma', yChannel: 'lightness', ...props },
    slots: { default: () => h(ColorAreaArea, { 'aria-label': 'Color' }, () => h(ColorAreaThumb)) },
  })
}

describe('oklch area precision', () => {
  const preciseColor: OKLCHColor = { space: 'oklch', l: 60.45, c: 0.20045, h: 240.45, alpha: 0.6545 }

  it.each<[ColorChannel, ColorChannel, string, Partial<OKLCHColor>]>([
    ['chroma', 'lightness', 'ArrowRight', { c: expect.closeTo(0.20145, 8) }],
    ['lightness', 'chroma', 'ArrowUp', { c: expect.closeTo(0.20145, 8) }],
    ['hue', 'lightness', 'ArrowRight', { h: 241.45 }],
    ['chroma', 'hue', 'ArrowRight', { c: expect.closeTo(0.20145, 8) }],
    ['lightness', 'hue', 'ArrowUp', { h: 241.45 }],
    ['chroma', 'alpha', 'ArrowRight', { c: expect.closeTo(0.20145, 8) }],
  ])('preserves untouched native coordinates when editing %s/%s with %s', async (xChannel, yChannel, key, changed) => {
    const wrapper = mountArea({ defaultValue: preciseColor, xChannel, yChannel })
    await wrapper.get('[role=application]').trigger('keydown', { key })

    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toEqual({ ...preciseColor, alpha: expect.closeTo(preciseColor.alpha, 12), ...changed })
  })

  it('keeps native axis precision while formatting accessible text', () => {
    const wrapper = mountArea({ defaultValue: preciseColor })
    const thumb = wrapper.get('[role=slider]')

    expect(Number(thumb.attributes('aria-valuenow'))).toBe(preciseColor.c)
    expect(thumb.attributes('aria-valuetext')).toBe('Chroma 0.2, Lightness 60')
    expect(parseFloat((thumb.element as HTMLElement).style.left)).toBeCloseTo(50.1125, 8)
  })

  it('synchronizes external coordinates even when their displayed values are unchanged', async () => {
    const wrapper = mountArea({ modelValue: preciseColor })
    const updated = { ...preciseColor, l: 60.49, c: 0.20049 }
    await wrapper.setProps({ modelValue: updated })
    await wrapper.get('[role=application]').trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toEqual({ ...updated, c: expect.closeTo(0.20149, 8) })
  })

  it('preserves precise coordinates when switching axes', async () => {
    const wrapper = mountArea({ defaultValue: preciseColor, xChannel: 'hue', yChannel: 'chroma' })
    await wrapper.setProps({ xChannel: 'chroma', yChannel: 'lightness' })
    await wrapper.get('[role=application]').trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toEqual({ ...preciseColor, c: expect.closeTo(0.20145, 8) })
  })

  it('synchronizes precise axes when switching into OKLCH', async () => {
    const wrapper = mountArea({ colorSpace: 'hsl', defaultValue: '#336699', xChannel: 'hue' })
    await wrapper.setProps({ colorSpace: 'oklch', modelValue: preciseColor })
    await wrapper.get('[role=application]').trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toEqual({ ...preciseColor, h: 241.45 })
  })

  it('applies precise CSS string updates even when the hex color does not change', async () => {
    const wrapper = mountArea({ modelValue: 'oklch(60% 0 120)', xChannel: 'hue' })
    await wrapper.setProps({ modelValue: 'oklch(60% 0 240)' })
    expect(wrapper.get('[role=slider]').attributes('aria-valuenow')).toBe('240')
  })

  it('uses the supplied powerless hue when chroma is raised', async () => {
    const wrapper = mountArea({ modelValue: 'oklch(60% 0 120)' })
    await wrapper.setProps({ modelValue: 'oklch(60% 0 240)' })
    await wrapper.get('[role=application]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toMatchObject({ space: 'oklch', h: 240, c: 0.001 })
  })

  it('preserves edited hue when switching to a chroma/lightness plane', async () => {
    const wrapper = mountArea({ defaultValue: 'oklch(60% .2 240)', xChannel: 'hue' })
    await wrapper.get('[role=application]').trigger('keydown', { key: 'ArrowRight' })
    await wrapper.setProps({ xChannel: 'chroma' })
    await wrapper.get('[role=application]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toMatchObject({ space: 'oklch', h: 241 })
  })

  it('resynchronizes axes when their channel changes', async () => {
    const wrapper = mountArea({ modelValue: { space: 'oklch', l: 60, c: 0.2, h: 240, alpha: 1 } })
    await wrapper.setProps({ xChannel: 'hue' })
    expect(wrapper.get('[role=slider]').attributes('aria-valuenow')).toBe('240')
  })

  it('keeps precise chroma through controlled hex echoes', async () => {
    const value = ref<string | object>('oklch(60% 0.2 240)')
    const onColor = ref<object>()
    const wrapper = mount(defineComponent({
      setup: () => () => h(ColorAreaRoot, {
        'colorSpace': 'oklch',
        'xChannel': 'chroma',
        'yChannel': 'lightness',
        'modelValue': value.value,
        'onUpdate:modelValue': (next: string) => { value.value = next },
        'onUpdate:color': (next: object) => { onColor.value = next },
      }, () => h(ColorAreaArea, () => h(ColorAreaThumb))),
    }))
    for (let i = 0; i < 10; i++)
      await wrapper.get('[role=application]').trigger('keydown', { key: 'ArrowRight' })
    expect(Number(wrapper.get('[role=slider]').attributes('aria-valuenow'))).toBeCloseTo(0.21, 6)
    expect(onColor.value).toMatchObject({ space: 'oklch', c: expect.closeTo(0.21, 6), l: 60, h: 240 })
    expect(value.value).toMatch(/^#[\da-f]{6}$/i)
  })

  it('passes axe with fractional channel values', async () => {
    const wrapper = mountArea({ defaultValue: 'oklch(60% .2 240)' })
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })
})
