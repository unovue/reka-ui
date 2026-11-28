import type { Component, Ref } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { CarouselAutoplayToggle, CarouselContent, CarouselIndicator, CarouselIndicatorGroup, CarouselItem, CarouselNext, CarouselPrevious, CarouselRoot, CarouselViewport } from '.'

enableAutoUnmount(afterEach)

type Part = 'root' | 'viewport' | 'content' | 'item' | 'previous' | 'next' | 'group' | 'indicator' | 'toggle'

const PARTS: { name: Part, tag: string }[] = [
  { name: 'root', tag: 'DIV' },
  { name: 'viewport', tag: 'DIV' },
  { name: 'content', tag: 'DIV' },
  { name: 'item', tag: 'DIV' },
  { name: 'previous', tag: 'BUTTON' },
  { name: 'next', tag: 'BUTTON' },
  { name: 'group', tag: 'DIV' },
  { name: 'indicator', tag: 'BUTTON' },
  { name: 'toggle', tag: 'BUTTON' },
]

const BUTTON_PARTS: Part[] = ['previous', 'next', 'indicator', 'toggle']

/**
 * A carousel with a template ref on every part. The part named `asChild`
 * renders `child` as its element instead of its default tag.
 */
function mountCarousel(options: { asChild?: Part, child?: Component } = {}) {
  const refs = Object.fromEntries(PARTS.map(({ name }) => [name, ref<any>()])) as Record<Part, Ref<any>>
  const part = (name: Part, component: Component, props: Record<string, unknown>, children: () => unknown) => {
    const asChild = options.asChild === name
    return h(component as any, { 'ref': refs[name], 'data-part': name, ...props, asChild }, asChild && options.child
      ? () => h(options.child!)
      : children)
  }
  const wrapper = mount(defineComponent({
    setup: () => () => part('root', CarouselRoot, { autoplay: true }, () => [
      part('viewport', CarouselViewport, {}, () => part('content', CarouselContent, {}, () => [
        part('item', CarouselItem, {}, () => 'One'),
        h(CarouselItem, () => 'Two'),
      ])),
      part('previous', CarouselPrevious, {}, () => 'Previous'),
      part('next', CarouselNext, {}, () => 'Next'),
      part('group', CarouselIndicatorGroup, {}, () => [
        part('indicator', CarouselIndicator, { index: 0 }, () => '1'),
        h(CarouselIndicator, { index: 1 }, () => '2'),
      ]),
      part('toggle', CarouselAutoplayToggle, {}, () => 'Toggle'),
    ]),
  }), { attachTo: document.body })
  return { wrapper, refs }
}

describe('carousel template refs', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    document.body.innerHTML = ''
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
  })

  it.each(PARTS)('$name exposes its rendered element on both element keys', async ({ name, tag }) => {
    const { wrapper, refs } = mountCarousel()
    await nextTick()
    const el = wrapper.find(`[data-part="${name}"]`).element
    expect(el.tagName).toBe(tag)
    expect('element' in refs[name].value).toBe(true)
    expect(refs[name].value.element).toBe(el)
    expect(refs[name].value.$el).toBe(el)
  })

  it.each(PARTS)('$name does not expose its props', async ({ name }) => {
    const { refs } = mountCarousel()
    await nextTick()
    // Every part has a default `as`, which a ref read used to return.
    expect(refs[name].value.as).toBeUndefined()
    expect(refs[name].value.asChild).toBeUndefined()
  })

  it.each(PARTS)('$name exposes the element of its `asChild` child, not the child\'s methods', async ({ name }) => {
    const Child = defineComponent({
      setup(_, { expose }) {
        expose({ childMethod: () => 'child' })
        return () => h(BUTTON_PARTS.includes(name) ? 'button' : 'section', 'child')
      },
    })
    const { wrapper, refs } = mountCarousel({ asChild: name, child: Child })
    await nextTick()
    const el = wrapper.find(`[data-part="${name}"]`).element
    expect(refs[name].value.element).toBe(el)
    expect(refs[name].value.$el).toBe(el)
    expect(refs[name].value.childMethod).toBeUndefined()
  })
})
