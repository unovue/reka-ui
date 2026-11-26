import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, onUpdated, ref } from 'vue'
import { Presence } from '@/Presence'
import { Primitive, Slot } from '.'

// Counts its own updates. It has a slot, so a parent that diffs it without the compiler's
// hints updates it on every render
function createChild() {
  const updates = ref(0)
  const Child = defineComponent({
    name: 'Child',
    props: { label: String },
    setup(props, { slots }) {
      onUpdated(() => updates.value++)
      return () => h('span', { 'data-label': props.label }, slots.default?.())
    },
  })
  return { Child, updates }
}

describe('given a Primitive with the content of a compiled template', () => {
  it.each([
    ['an element', '<Primitive :data-state="state"><Child><i>static</i></Child></Primitive>'],
    ['asChild', '<Primitive as-child :data-state="state"><div><Child><i>static</i></Child></div></Primitive>'],
    ['Slot', '<Slot :data-state="state"><div><Child><i>static</i></Child></div></Slot>'],
    ['nested parts', '<Primitive as-child><Primitive :data-state="state"><Child><i>static</i></Child></Primitive></Primitive>'],
  ])('should not update a child with a stable slot when %s renders again', async (_, template) => {
    const { Child, updates } = createChild()
    const wrapper = mount(defineComponent({
      components: { Primitive, Slot, Child },
      setup: () => ({ state: ref('closed') }),
      template,
    }))
    expect(wrapper.html()).toContain('data-state="closed"')

    ;(wrapper.vm as any).state = 'open'
    await nextTick()
    expect(wrapper.html()).toContain('data-state="open"')
    expect(updates.value).toBe(0)
  })

  it('should not update the child of Presence when Presence renders again', async () => {
    const { Child, updates } = createChild()
    const wrapper = mount(defineComponent({
      components: { Presence, Child },
      setup: () => ({ forceMount: ref(false) }),
      template: '<Presence :present="true" :force-mount="forceMount"><Child><i>static</i></Child></Presence>',
    }))
    await nextTick()
    const before = updates.value

    ;(wrapper.vm as any).forceMount = true
    await nextTick()
    await nextTick()
    expect(updates.value).toBe(before)
    expect(wrapper.html()).toBe('<span><i>static</i></span>')
  })

  it.each([
    ['an element', '<Primitive :data-state="state">', '</Primitive>'],
    ['asChild', '<Primitive as-child :data-state="state"><section>', '</section></Primitive>'],
    ['Slot', '<Slot :data-state="state"><section>', '</section></Slot>'],
  ])('should still patch everything that changes in the content of %s', async (_, open, close) => {
    const { Child } = createChild()
    const wrapper = mount(defineComponent({
      components: { Primitive, Slot, Child },
      setup: () => ({ state: ref('closed'), label: ref('a'), show: ref(false), list: ref(['x']), tag: ref('em') }),
      template: `${open}
        <b :title="label">{{ label }}</b>
        <u v-if="show">shown</u>
        <s v-for="item in list" :key="item">{{ item }}</s>
        <component :is="tag">dynamic</component>
        <Child :label="label">{{ label }}<q v-if="show">in child</q></Child>
      ${close}`,
    }))
    const text = () => wrapper.element.textContent!.replace(/\s+/g, '')
    expect(text()).toBe('axdynamica')

    const vm = wrapper.vm as any
    vm.label = 'b'
    await nextTick()
    expect(text()).toBe('bxdynamicb')
    expect(wrapper.find('b').attributes('title')).toBe('b')
    expect(wrapper.find('span').attributes('data-label')).toBe('b')

    vm.show = true
    vm.list = ['y', 'x', 'z']
    vm.tag = 'strong'
    vm.state = 'open'
    await nextTick()
    expect(text()).toBe('bshownyxzdynamicbinchild')
    expect(wrapper.find('strong').exists()).toBe(true)
    expect(wrapper.find('em').exists()).toBe(false)
    expect(wrapper.element.getAttribute('data-state')).toBe('open')

    vm.show = false
    vm.list = []
    await nextTick()
    expect(text()).toBe('bdynamicb')
  })

  it('should swap the root of asChild content', async () => {
    const wrapper = mount(defineComponent({
      components: { Primitive },
      setup: () => ({ first: ref(true), label: ref('a') }),
      template: '<Primitive as-child data-part><a v-if="first" :title="label">{{ label }}</a><button v-else :title="label">{{ label }}</button></Primitive>',
    }))
    expect(wrapper.html()).toBe('<a data-part="" title="a">a</a>')

    const vm = wrapper.vm as any
    vm.label = 'b'
    await nextTick()
    expect(wrapper.html()).toBe('<a data-part="" title="b">b</a>')

    vm.first = false
    await nextTick()
    expect(wrapper.html()).toBe('<button data-part="" title="b">b</button>')

    vm.label = 'c'
    await nextTick()
    expect(wrapper.html()).toBe('<button data-part="" title="c">c</button>')
  })

  it('should render hand-written slots as before', async () => {
    const { Child, updates } = createChild()
    const state = ref('closed')
    const label = ref('a')
    const wrapper = mount(defineComponent({
      setup: () => () => h(Primitive, { 'data-state': state.value }, () => [h(Child, null, () => label.value)]),
    }))
    expect(wrapper.html()).toBe('<div data-state="closed"><span>a</span></div>')

    state.value = 'open'
    label.value = 'b'
    await nextTick()
    expect(wrapper.html()).toBe('<div data-state="open"><span>b</span></div>')
    expect(updates.value).toBe(1)
  })
})
