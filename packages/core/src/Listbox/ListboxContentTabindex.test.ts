import type { Component, VNodeChild } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { Comment, createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { ListboxContent, ListboxItem, ListboxRoot } from '.'
import { Primitive } from '../Primitive'

// The content applies its roving tabindex outside the render only when it
// renders the element itself: a string `as`, no `asChild`, no consumer
// `tabindex`. For anything else the value stays in the render, because a
// binding this part cannot see may sit over it at any depth.

const items = () => ['a', 'b', 'c'].map(value => h(ListboxItem, { value }, () => value))
const content = () => document.querySelector('[role=listbox]') as HTMLElement
const tabindex = () => content().getAttribute('tabindex')
const highlighted = () => !!document.querySelector('[data-highlighted]')

async function settle() {
  for (let i = 0; i < 3; i++) {
    await new Promise(resolve => setTimeout(resolve))
    await nextTick()
  }
}
async function hover() {
  document.querySelectorAll('[role=option]')[1].dispatchEvent(new PointerEvent('pointermove', { bubbles: true }))
  await settle()
  expect(highlighted()).toBe(true)
}
async function leave() {
  content().parentElement!.dispatchEvent(new PointerEvent('pointerleave'))
  await settle()
  expect(highlighted()).toBe(false)
}

async function mountListbox(contentProps: () => Record<string, unknown>, child?: () => VNodeChild) {
  const wrapper = mount(defineComponent({
    setup: () => () => h(ListboxRoot, { highlightOnHover: true }, () =>
      h(ListboxContent, contentProps(), () => child ? child() : items())),
  }), { attachTo: document.body })
  await settle()
  return wrapper
}

/** Binds `tabindex="9"` over the attrs it receives, one level below the as-child slot child. */
const BindsOverAttrs: Component = defineComponent({
  inheritAttrs: false,
  setup: (_, { attrs, slots }) => () => h('section', { ...attrs, tabindex: '9' }, slots.default?.()),
})

describe('listboxContent tabindex', () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('follows the highlight', () => {
    it.each<[string, () => Record<string, unknown>, (() => VNodeChild)?]>([
      ['by default', () => ({})],
      ['with a string `as`', () => ({ as: 'ul' })],
      ['on a plain as-child element', () => ({ asChild: true }), () => h('section', null, items())],
      ['past a consumer `tabindex` on the content', () => ({ tabindex: '5' })],
      // Not the element's binding: `tabindex` is applied after it and on every flip.
      ['past a camel-cased `tabIndex` on an as-child element', () => ({ asChild: true }), () => h('section', { tabIndex: 2 }, items())],
    ])('%s', async (_, props, child) => {
      const wrapper = await mountListbox(props, child)
      expect(tabindex()).toBe('-1')
      await leave()
      expect(tabindex()).toBe('0')
      await hover()
      expect(tabindex()).toBe('-1')
      wrapper.unmount()
    })

    it('on the new element when `as` swaps after the highlight cleared', async () => {
      const as = ref('div')
      const wrapper = await mountListbox(() => ({ as: as.value }))
      await leave()
      as.value = 'ul'
      await settle()
      expect(content().tagName).toBe('UL')
      expect(tabindex()).toBe('0')
      await hover()
      expect(tabindex()).toBe('-1')
      wrapper.unmount()
    })
  })

  describe('keeps a tabindex bound below it', () => {
    it.each<[string, () => Record<string, unknown>, () => VNodeChild, string]>([
      ['-1 on the as-child element', () => ({ asChild: true }), () => h('section', { tabindex: '-1' }, items()), '-1'],
      ['0 on the as-child element', () => ({ asChild: true }), () => h('section', { tabindex: '0' }, items()), '0'],
      ['after a comment in the slot', () => ({ asChild: true }), () => [h(Comment, 'c'), h('section', { tabindex: '3' }, items())], '3'],
      ['through Primitive as-child', () => ({ asChild: true }), () => h(Primitive, { asChild: true }, () => h('section', { tabindex: '3' }, items())), '3'],
      ['on Primitive as="section"', () => ({ asChild: true }), () => h(Primitive, { as: 'section', tabindex: '3' }, () => items()), '3'],
      ['in an inheritAttrs: false child', () => ({ asChild: true }), () => h(BindsOverAttrs, null, () => items()), '9'],
      ['in a component `as`', () => ({ as: BindsOverAttrs }), () => items(), '9'],
    ])('%s', async (_, props, child, expected) => {
      const wrapper = await mountListbox(props, child)
      expect(tabindex()).toBe(expected)
      await leave()
      expect(tabindex()).toBe(expected)
      await hover()
      expect(tabindex()).toBe(expected)
      wrapper.unmount()
    })
  })

  describe('follows the highlight again after the as-child element drops its binding', () => {
    const bound = ref<string | undefined>()
    const objectBinding = () => bound.value === undefined ? {} : { tabindex: bound.value }

    it.each<[string, () => void | Promise<unknown>]>([
      ['a v-bind object or render function', async () => {
        await mountListbox(() => ({ asChild: true }), () => h('section', objectBinding(), items()))
      }],
      ['a template v-bind object', async () => {
        mount(defineComponent({
          components: { ListboxRoot, ListboxContent, ListboxItem },
          setup: () => ({ objectBinding }),
          template: `<ListboxRoot highlight-on-hover><ListboxContent as-child><section v-bind="objectBinding()">
            <ListboxItem v-for="v in ['a', 'b', 'c']" :key="v" :value="v">{{ v }}</ListboxItem>
          </section></ListboxContent></ListboxRoot>`,
        }), { attachTo: document.body })
        await settle()
      }],
    ])('%s', async (_, setup) => {
      bound.value = '3'
      await setup()
      expect(tabindex()).toBe('3')
      await leave()
      expect(tabindex()).toBe('3')

      bound.value = undefined
      await settle()
      expect(tabindex()).toBe('0')
      // A later highlight change: the value must still be tracked.
      await hover()
      expect(tabindex()).toBe('-1')
      await leave()
      expect(tabindex()).toBe('0')

      // And it can come back.
      bound.value = '4'
      await settle()
      expect(tabindex()).toBe('4')
      await hover()
      expect(tabindex()).toBe('4')
    })

    it('not for a template :tabindex, whose undefined still wins the slot merge', async () => {
      bound.value = '3'
      mount(defineComponent({
        components: { ListboxRoot, ListboxContent, ListboxItem },
        setup: () => ({ bound }),
        template: `<ListboxRoot highlight-on-hover><ListboxContent as-child><section :tabindex="bound">
          <ListboxItem v-for="v in ['a', 'b', 'c']" :key="v" :value="v">{{ v }}</ListboxItem>
        </section></ListboxContent></ListboxRoot>`,
      }), { attachTo: document.body })
      await settle()
      await leave()
      bound.value = undefined
      await settle()
      expect(tabindex()).toBeNull()
      await hover()
      expect(tabindex()).toBeNull()
      bound.value = '4'
      await settle()
      expect(tabindex()).toBe('4')
    })

    it('in the same tick as a highlight change', async () => {
      bound.value = '3'
      const wrapper = await mountListbox(() => ({ asChild: true }), () => h('section', objectBinding(), items()))
      await leave()
      bound.value = undefined
      await hover()
      expect(tabindex()).toBe('-1')
      wrapper.unmount()
    })
  })

  describe('runtime `asChild` swaps', () => {
    it('true with a binding, then false', async () => {
      const asChild = ref(true)
      const wrapper = await mountListbox(() => ({ asChild: asChild.value }), () => asChild.value ? h('section', { tabindex: '3' }, items()) : items())
      expect(tabindex()).toBe('3')
      asChild.value = false
      await settle()
      expect(tabindex()).not.toBe('3')
      await hover()
      expect(tabindex()).toBe('-1')
      await leave()
      expect(tabindex()).toBe('0')
      wrapper.unmount()
    })

    it('false, then true with a binding', async () => {
      const asChild = ref(false)
      const wrapper = await mountListbox(() => ({ asChild: asChild.value }), () => asChild.value ? h('section', { tabindex: '3' }, items()) : items())
      await leave()
      expect(tabindex()).toBe('0')
      asChild.value = true
      await settle()
      expect(tabindex()).toBe('3')
      await hover()
      expect(tabindex()).toBe('3')
      wrapper.unmount()
    })
  })

  describe('sSR', () => {
    it.each<[string, () => VNodeChild, string]>([
      ['the setup value by default', () => h(ListboxContent, null, items), 'tabindex="0"'],
      ['the setup value as-child', () => h(ListboxContent, { asChild: true }, () => h('section', null, items())), 'tabindex="0"'],
      ['the as-child element\'s binding', () => h(ListboxContent, { asChild: true }, () => h('section', { tabindex: '3' }, items())), 'tabindex="3"'],
    ])('renders %s and hydrates without a mismatch', async (_, render, expected) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      const App = defineComponent({ setup: () => () => h(ListboxRoot, { highlightOnHover: true }, render) })
      const html = await renderToString(createSSRApp(App))
      expect(html.match(/<(?:div|section)[^>]*role="listbox"[^>]*>/)?.[0]).toContain(expected)

      const host = document.createElement('div')
      host.innerHTML = html
      document.body.append(host)
      const app = createSSRApp(App)
      app.mount(host)
      await settle()
      expect([...warn.mock.calls, ...error.mock.calls].flat().join(' ')).not.toMatch(/hydration/i)
      app.unmount()
      warn.mockRestore()
      error.mockRestore()
    })
  })
})
