import type { Color, ColorChannel, OKLCHColor } from '@/shared/color'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { ColorFieldInput, ColorFieldRoot } from '@/ColorField'
import { ColorSliderRoot, ColorSliderThumb, ColorSliderTrack } from '@/ColorSlider'
import { getAreaBackgroundStyle, getSliderBackgroundStyle } from '@/shared/color'
import { ColorAreaArea, ColorAreaRoot, ColorAreaThumb } from '.'

const color: OKLCHColor = { space: 'oklch', l: 60, c: 0.2, h: 240, alpha: 1 }

function supportedStyle(style: Record<string, string>) {
  const element = document.createElement('div')
  Object.assign(element.style, style)
  expect(element.style.backgroundImage).not.toBe('')
  return element.style
}

describe('oklch gradients and interactions in a real browser', () => {
  it.each(['hue', 'chroma', 'lightness', 'alpha'] as const)('renders a valid native %s slider gradient', (channel) => {
    const style = supportedStyle(getSliderBackgroundStyle(color, channel, 'oklch'))
    expect(style.backgroundImage).toContain('linear-gradient')
    if (channel !== 'alpha')
      expect(style.backgroundImage).toContain('oklch')
  })

  it.each([
    ['hue', 'chroma'],
    ['chroma', 'hue'],
    ['hue', 'lightness'],
    ['lightness', 'hue'],
    ['chroma', 'lightness'],
    ['lightness', 'chroma'],
  ] as [ColorChannel, ColorChannel][])('renders the %s/%s plane without HSL or RGB gradient fallback', (x, y) => {
    const style = supportedStyle(getAreaBackgroundStyle(color, x, y, 'oklch'))
    expect(style.backgroundImage).toContain('oklch')
    expect(style.backgroundImage).not.toContain('rgb(')
    expect(style.backgroundSize).not.toBe('')
    expect(style.backgroundPosition).not.toBe('')
  })

  it('keeps area keyboard and pointer edits in native OKLCH and emits hex models', async () => {
    const updates: Color[] = []
    const models: string[] = []
    const wrapper = mount(defineComponent({
      setup: () => () => h(ColorAreaRoot, {
        'defaultValue': color,
        'colorSpace': 'oklch',
        'xChannel': 'chroma',
        'yChannel': 'lightness',
        'onUpdate:color': (value: Color) => updates.push(value),
        'onUpdate:modelValue': (value: string) => models.push(value),
      }, {
        default: ({ style }: { style: Record<string, string> }) => h(ColorAreaArea, {
          style: { ...style, width: '200px', height: '200px' },
        }, () => h(ColorAreaThumb, { style: 'width: 10px; height: 10px;' })),
      }),
    }), { attachTo: document.body })
    const thumb = wrapper.get('[role=slider]').element as HTMLElement
    thumb.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(updates.at(-1)).toMatchObject({ space: 'oklch', c: expect.closeTo(0.201, 6), h: 240, l: 60 })
    await userEvent.click(wrapper.get('[role=application]').element)
    expect(updates.at(-1)).toMatchObject({ space: 'oklch', h: 240 })
    expect((updates.at(-1) as OKLCHColor).c).toBeCloseTo(0.2, 2)
    expect(models.at(-1)).toMatch(/^#[\da-f]{6}$/i)
    wrapper.unmount()
  })

  it('steps chroma through the slider with trusted keyboard events', async () => {
    const wrapper = mount(ColorSliderRoot, {
      props: { defaultValue: color, colorSpace: 'oklch', channel: 'chroma', style: 'width: 200px; height: 20px;' },
      slots: { default: () => [h(ColorSliderTrack, { style: 'width: 200px; height: 20px;' }), h(ColorSliderThumb, { style: 'width: 10px; height: 10px;' })] },
      attachTo: document.body,
    })
    const thumb = wrapper.get('[role=slider]').element as HTMLElement
    await userEvent.click(thumb)
    await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('0.2')
    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(() => thumb.getAttribute('aria-valuenow')).toBe('0.201')
    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toMatchObject({ space: 'oklch', h: 240, l: 60 })
    wrapper.unmount()
  })

  it('accepts fractional chroma in a native text input', async () => {
    const wrapper = mount(ColorFieldRoot, {
      props: { defaultValue: color, colorSpace: 'oklch', channel: 'chroma' },
      slots: { default: () => h(ColorFieldInput, { 'aria-label': 'Chroma' }) },
      attachTo: document.body,
    })
    const input = wrapper.get('input').element as HTMLInputElement
    await userEvent.fill(input, '0.123')
    await userEvent.keyboard('{Enter}')
    expect(input.value).toBe('0.123')
    expect(wrapper.emitted('update:color')?.at(-1)?.[0]).toMatchObject({ space: 'oklch', c: 0.123, h: 240, l: 60 })
    wrapper.unmount()
  })
})
