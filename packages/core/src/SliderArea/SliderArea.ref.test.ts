import type { Component, Ref } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { SliderAreaArea, SliderAreaRegion, SliderAreaRoot, SliderAreaThumb } from '.'

enableAutoUnmount(afterEach)

type Part = 'area' | 'region' | 'thumb'

const PARTS: { name: Part, tag: string }[] = [
  { name: 'area', tag: 'DIV' },
  { name: 'region', tag: 'SPAN' },
  { name: 'thumb', tag: 'DIV' },
]

/**
 * A slider area with a template ref on every part. The part named `asChild`
 * renders `child` as its element instead of its default tag.
 */
function mountSliderArea(options: { asChild?: Part, child?: Component } = {}) {
  const refs = Object.fromEntries(PARTS.map(({ name }) => [name, ref<any>()])) as Record<Part, Ref<any>>
  const part = (name: Part, component: Component, children?: () => unknown) => {
    const asChild = options.asChild === name
    return h(component as any, { 'ref': refs[name], 'data-part': name, asChild }, asChild && options.child
      ? () => h(options.child!)
      : children)
  }
  const wrapper = mount(defineComponent({
    setup: () => () => h(SliderAreaRoot, { defaultValue: [[50, 50]] }, () => [
      part('area', SliderAreaArea, () => part('region', SliderAreaRegion)),
      part('thumb', SliderAreaThumb),
    ]),
  }), { attachTo: document.body })
  return { wrapper, refs }
}

describe('slider area template refs', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeAll(() => {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it.each(PARTS)('$name exposes its rendered element on both element keys', async ({ name, tag }) => {
    const { wrapper, refs } = mountSliderArea()
    await nextTick()
    const el = wrapper.find(`[data-part="${name}"]`).element
    expect(el.tagName).toBe(tag)
    expect('element' in refs[name].value).toBe(true)
    expect(refs[name].value.element).toBe(el)
    expect(refs[name].value.$el).toBe(el)
  })

  it.each(PARTS)('$name does not expose its props', async ({ name }) => {
    const { refs } = mountSliderArea()
    await nextTick()
    // Every part has a default `as`, which a ref read used to return.
    expect(refs[name].value.as).toBeUndefined()
    expect(refs[name].value.asChild).toBeUndefined()
  })

  it.each(PARTS)('$name exposes the element of its `asChild` child, not the child\'s methods', async ({ name }) => {
    const Child = defineComponent({
      setup(_, { expose }) {
        expose({ childMethod: () => 'child' })
        return () => h('section', 'child')
      },
    })
    const { wrapper, refs } = mountSliderArea({ asChild: name, child: Child })
    await nextTick()
    const el = wrapper.find(`[data-part="${name}"]`).element
    expect(el.tagName).toBe('SECTION')
    expect(refs[name].value.element).toBe(el)
    expect(refs[name].value.$el).toBe(el)
    expect(refs[name].value.childMethod).toBeUndefined()
  })
})
