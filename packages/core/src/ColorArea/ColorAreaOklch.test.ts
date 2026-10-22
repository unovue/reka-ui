import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { defineComponent, h, ref } from 'vue'
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from '.'

function mountArea(props: Record<string, unknown>) {
  return mount(ColorAreaRoot, {
    props: { colorSpace: 'oklch', xChannel: 'chroma', yChannel: 'lightness', ...props },
    slots: { default: () => h(ColorAreaArea, { 'aria-label': 'Color' }, () => h(ColorAreaThumb)) },
  })
}

describe('oklch area precision', () => {
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
