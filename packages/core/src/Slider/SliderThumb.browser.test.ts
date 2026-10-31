import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'
import { SliderRoot, SliderThumb } from '@/Slider'

// A camel `ariaLabel` sets a DOM property that jsdom doesn't have, and that property
// writes the same attribute as `aria-label`. Which one wins depends on the order they're patched.
let cleanup: (() => void) | undefined

afterEach(() => {
  cleanup?.()
  cleanup = undefined
})

function mountThumbs(thumbs: number) {
  const attrs = ref<Record<string, unknown>>({})
  const value = thumbs === 2 ? [20, 60] : [20]
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(defineComponent({
    setup: () => () => h(SliderRoot as any, { defaultValue: value }, () => value.map((_, i) => h(SliderThumb as any, i === 0 ? attrs.value : {}))),
  }))
  app.mount(host)
  cleanup = () => {
    app.unmount()
    host.remove()
  }
  return { attrs, label: () => host.querySelector('[role=slider]')!.getAttribute('aria-label') }
}

describe('sliderThumb: a camel `ariaLabel`', () => {
  it.each([1, 2])('added after a kebab `aria-label` wins, with %i thumbs', async (thumbs) => {
    const { attrs, label } = mountThumbs(thumbs)
    await nextTick()
    await nextTick()
    attrs.value = { 'aria-label': 'kebab' }
    await nextTick()
    expect(label()).toBe('kebab')
    attrs.value = { ariaLabel: 'after-kebab' }
    await nextTick()
    expect(label()).toBe('after-kebab')
  })
})
