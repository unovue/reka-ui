import type { Component, ComponentInternalInstance, PropType } from 'vue'
import type { AsTag } from './Primitive'
import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCommentVNode, createSSRApp, defineComponent, getCurrentInstance, h, nextTick, onMounted, ref } from 'vue'
import { useForwardElement } from '@/shared/useForwardElement'
import { Primitive } from './Primitive'
import { renderAs, renderAsEmpty, rendersChildren } from './renderAs'

afterEach(() => {
  vi.restoreAllMocks()
})

const partProps = {
  as: { type: [String, Object] as PropType<AsTag | Component> },
  asChild: Boolean,
  onPartClick: Function as PropType<(e: Event) => void>,
}

// The same part written both ways: through `<Primitive>` (before) and with
// `renderAs` (after). Both bind internal attrs and a handler that the
// consumer's own attrs merge with.
function definePart(template: string, name: string) {
  return defineComponent({
    name,
    components: { Primitive },
    props: partProps,
    setup(props) {
      const { forwardRef, expose } = useForwardElement()
      const instance = getCurrentInstance()!
      instance.exposed = expose
      const internal = { 'data-part': '', 'class': 'part', 'style': { color: 'red' }, 'onClick': (e: Event) => props.onPartClick?.(e) }
      return { forwardRef, internal, renderAs }
    },
    template,
  })
}

const ViaPrimitive = definePart(
  `<Primitive :ref="forwardRef" :as="as" :as-child="asChild" v-bind="internal"><slot /></Primitive>`,
  'ViaPrimitive',
)
const Direct = definePart(
  `<component :is="renderAs(as, asChild)" :ref="forwardRef" v-bind="internal"><slot /></component>`,
  'Direct',
)
// A part that defaults to an `input` and gates its children.
const DirectInput = defineComponent({
  props: { ...partProps, as: { type: [String, Object] as PropType<AsTag | Component>, default: 'input' } },
  setup() {
    const { forwardRef, expose } = useForwardElement()
    getCurrentInstance()!.exposed = expose
    return { forwardRef, renderAsEmpty, rendersChildren }
  },
  template: `<component :is="renderAsEmpty(as, asChild)" :ref="forwardRef" data-input>
    <template v-if="rendersChildren(as, asChild)" #default><slot /></template>
  </component>`,
})
const ViaPrimitiveInput = defineComponent({
  props: { ...partProps, as: { type: [String, Object] as PropType<AsTag | Component>, default: 'input' } },
  components: { Primitive },
  template: `<Primitive :as="as" :as-child="asChild" data-input><slot /></Primitive>`,
})

const Child = defineComponent({
  name: 'Child',
  inheritAttrs: true,
  setup(_, { slots }) {
    return () => h('a', { href: '#child', class: 'child' }, slots.default?.())
  },
})

interface Case {
  name: string
  props?: Record<string, unknown>
  attrs?: Record<string, unknown>
  slot?: () => unknown
}

const cases: Case[] = [
  { name: 'default div', slot: () => 'text' },
  { name: 'as a tag', props: { as: 'button' }, attrs: { type: 'button' }, slot: () => 'text' },
  { name: 'class, style and listener attrs', attrs: { 'class': 'consumer', 'style': 'margin: 1px', 'id': 'x', 'aria-label': 'l', 'onClick': () => {} }, slot: () => 'text' },
  { name: 'string style attr', attrs: { style: 'color: blue' } },
  { name: 'as a component', props: { as: Child }, attrs: { class: 'consumer' }, slot: () => 'text' },
  { name: 'as="template"', props: { as: 'template' }, attrs: { class: 'consumer' }, slot: () => h('button', { class: 'own' }, 'child') },
  { name: 'asChild with an element child', props: { asChild: true }, attrs: { 'class': 'consumer', 'data-x': '1' }, slot: () => h('span', { class: 'own', style: { margin: '2px' } }, 'child') },
  { name: 'asChild with a component child', props: { asChild: true }, attrs: { class: 'consumer' }, slot: () => h(Child, null, () => 'child') },
  { name: 'asChild with a comment before the child', props: { asChild: true }, slot: () => [createCommentVNode('c'), h('i', 'x')] },
  { name: 'self-closing img', props: { as: 'img' }, attrs: { src: 'data:,', alt: '' }, slot: () => 'ignored' },
  { name: 'self-closing input', props: { as: 'input' }, slot: () => h('span', 'ignored') },
]

function render(part: Component, c: Case) {
  return mount(part, {
    props: c.props,
    attrs: c.attrs,
    slots: c.slot ? { default: c.slot as () => any } : undefined,
  })
}

describe('renderAs', () => {
  it.each(cases)('renders the same DOM as Primitive: $name', (c) => {
    expect(render(Direct, c).html()).toBe(render(ViaPrimitive, c).html())
  })

  it.each([
    { name: 'default input' },
    { name: 'as a div', props: { as: 'div' }, slot: () => 'text' },
    { name: 'asChild', props: { asChild: true }, slot: () => h('textarea') },
  ] satisfies Case[])('renders the same DOM as Primitive for an input part: $name', (c) => {
    const direct = render(DirectInput, c)
    expect(direct.html()).toBe(render(ViaPrimitiveInput, c).html())
  })

  it('renders an input with no child nodes, even when given a slot', () => {
    const wrapper = render(DirectInput, { name: '', slot: () => h('span', 'ignored') })
    expect(wrapper.element.tagName).toBe('INPUT')
    expect(wrapper.element.childNodes.length).toBe(0)
    const generic = render(Direct, { name: '', props: { as: 'img' }, slot: () => 'ignored' })
    expect(generic.element.tagName).toBe('IMG')
    expect(generic.element.childNodes.length).toBe(0)
  })

  it('renders the element, not a component registered under the tag name', () => {
    const Button = defineComponent({ render: () => h('i', 'global Button') })
    const Div = defineComponent({ render: () => h('i', 'global Div') })
    const wrapper = mount(Direct, {
      props: { as: 'button' },
      slots: { default: () => 'text' },
      global: { components: { Button, Div } },
    })
    expect(wrapper.html()).toBe('<button data-part="" class="part" style="color: red;">text</button>')
    expect(mount(Direct, { global: { components: { Div } } }).element.tagName).toBe('DIV')
  })

  it('is one component instance per part (two with asChild)', () => {
    const count = (vnodeRoot: ComponentInternalInstance) => {
      let n = 0
      const walk = (i: ComponentInternalInstance) => {
        n++
        const visit = (v: any) => {
          if (!v)
            return
          if (v.component)
            walk(v.component)
          else if (Array.isArray(v.children))
            v.children.forEach(visit)
        }
        visit(i.subTree)
      }
      walk(vnodeRoot)
      return n
    }
    const Host = (part: Component, props?: Record<string, unknown>) => mount(defineComponent({
      setup: () => () => h(part, props, () => h('span', 'x')),
    }))
    const instanceOf = (w: ReturnType<typeof Host>) => (w.vm.$ as ComponentInternalInstance)
    // host + part (+ Slot for asChild)
    expect(count(instanceOf(Host(Direct)))).toBe(2)
    expect(count(instanceOf(Host(ViaPrimitive)))).toBe(3)
    expect(count(instanceOf(Host(Direct, { asChild: true })))).toBe(3)
    expect(count(instanceOf(Host(ViaPrimitive, { asChild: true })))).toBe(4)
  })

  it('merges the consumer listener after the part one, like Primitive', async () => {
    const calls: string[] = []
    const wrapper = mount(Direct, {
      props: { onPartClick: () => calls.push('part') },
      attrs: { onClick: () => calls.push('consumer') },
    })
    await wrapper.trigger('click')
    expect(calls).toEqual(['part', 'consumer'])
  })

  it('exposes the rendered element as `element` / `$el`, following as and asChild swaps', async () => {
    const as = ref<AsTag>('span')
    const asChild = ref(false)
    const partRef = ref<any>()
    const wrapper = mount(defineComponent({
      setup: () => () => h(Direct, { ref: partRef, as: as.value, asChild: asChild.value }, () => h('b', 'child')),
    }))
    expect(partRef.value.element.tagName).toBe('SPAN')
    expect(partRef.value.$el).toBe(partRef.value.element)
    as.value = 'button'
    await nextTick()
    expect(partRef.value.element.tagName).toBe('BUTTON')
    asChild.value = true
    await nextTick()
    expect(partRef.value.element.tagName).toBe('B')
    expect(wrapper.html()).toBe('<b data-part="" class="part" style="color: red;">child</b>')
  })

  it('resolves the element through `as` a component', () => {
    const partRef = ref<any>()
    mount(defineComponent({
      setup: () => () => h(Direct, { ref: partRef, as: Child }, () => 'x'),
    }))
    expect(partRef.value.element.tagName).toBe('A')
  })

  it('keeps an imperatively set inline style across a re-render, like Primitive', async () => {
    for (const part of [Direct, ViaPrimitive]) {
      const n = ref(0)
      const wrapper = mount(defineComponent({
        setup: () => () => h(part, { 'data-n': n.value, 'style': 'margin: 1px' }),
      }))
      const el = wrapper.element as HTMLElement
      el.style.setProperty('transform', 'translateX(1px)')
      n.value++
      await nextTick()
      expect(el.style.transform).toBe('translateX(1px)')
    }
  })

  it('rendersChildren is false only for self-closing tags', () => {
    expect(rendersChildren('input')).toBe(false)
    expect(rendersChildren('img')).toBe(false)
    expect(rendersChildren('input', true)).toBe(true)
    expect(rendersChildren(undefined)).toBe(true)
    expect(rendersChildren(Child)).toBe(true)
  })
})

describe('renderAs SSR', () => {
  const Fixture = defineComponent({
    setup() {
      return () => h('main', [
        h(Direct, { as: 'nav' }, () => 'nav'),
        h(Direct, { asChild: true }, () => h('button', 'child')),
        h(Direct, { as: 'img', alt: '' }, () => 'ignored'),
        h(DirectInput, null, () => 'ignored'),
        h(Direct, { as: Child }, () => 'link'),
      ])
    },
  })

  it('renders the same markup as Primitive on the server', async () => {
    const PrimitiveFixture = defineComponent({
      setup() {
        return () => h('main', [
          h(ViaPrimitive, { as: 'nav' }, () => 'nav'),
          h(ViaPrimitive, { asChild: true }, () => h('button', 'child')),
          h(ViaPrimitive, { as: 'img', alt: '' }, () => 'ignored'),
          h(ViaPrimitiveInput, null, () => 'ignored'),
          h(ViaPrimitive, { as: Child }, () => 'link'),
        ])
      },
    })
    expect(await renderToString(createSSRApp(Fixture))).toBe(await renderToString(createSSRApp(PrimitiveFixture)))
  })

  it('hydrates without mismatches', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Fixture))
    document.body.append(container)

    let mounted = false
    createSSRApp(defineComponent({
      setup() {
        onMounted(() => mounted = true)
        return () => h(Fixture)
      },
    })).mount(container)
    await nextTick()

    expect(mounted).toBe(true)
    expect(warn.mock.calls.flat().join('\n')).not.toContain('Hydration')
    expect(error.mock.calls.flat().join('\n')).not.toContain('Hydration')
    container.remove()
  })
})
