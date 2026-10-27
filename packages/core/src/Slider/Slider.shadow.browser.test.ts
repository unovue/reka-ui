import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, ref } from 'vue'
import { mountInShadowRoot } from '@/shared/test/shadowDom'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from '.'

function mountSlider() {
  const value = ref([20])
  const mounted = mountInShadowRoot(defineComponent({
    setup: () => () => h('div', { style: 'padding: 40px;' }, h(SliderRoot, {
      'modelValue': value.value,
      'onUpdate:modelValue': (v: number[]) => { value.value = v },
      'data-testid': 'root',
      'style': 'position: relative; display: flex; align-items: center; width: 200px; height: 20px;',
    }, () => [
      h(SliderTrack, { 'data-testid': 'track', 'style': 'position: relative; flex-grow: 1; height: 4px; background: #ccc;' }, () =>
        h(SliderRange, { style: 'position: absolute; height: 100%; background: #333;' })),
      h(SliderThumb, { 'data-testid': 'thumb', 'aria-label': 'Volume', 'style': 'display: block; width: 10px; height: 10px; background: #000;' }),
    ])),
  }))
  return { ...mounted, value }
}

describe('given a Slider inside a shadow root, in a real browser', () => {
  it('changes with the keyboard', async () => {
    const { get, value } = mountSlider()
    // Thumbs are hidden until their value is positioned after mount.
    await expect.poll(() => get('thumb')!.style.display).not.toBe('none')

    get('thumb')!.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(() => value.value).toEqual([21])
    await userEvent.keyboard('{End}')
    await expect.poll(() => value.value).toEqual([100])
    expect(get('thumb')!.getAttribute('aria-valuenow')).toBe('100')
  })

  it('follows a pointer press on the track and focuses the thumb', async () => {
    const { get, value, activeElement } = mountSlider()
    await expect.poll(() => get('thumb')!.style.display).not.toBe('none')

    await userEvent.click(get('root')!, { position: { x: 150, y: 10 } })
    await expect.poll(() => value.value[0]).toBeGreaterThan(60)
    expect(activeElement()).toBe(get('thumb'))
  })
})
