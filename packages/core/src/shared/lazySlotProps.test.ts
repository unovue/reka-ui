import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { Primitive } from '@/Primitive'
import { useLazySlotProps } from './lazySlotProps'

/** A part that renders its default slot inside its element, as the roots do. */
function createRoot() {
  const model = ref('a')
  const renders = { count: 0 }
  const Root = defineComponent({
    components: { Primitive },
    setup() {
      const slotProps = useLazySlotProps({ modelValue: () => model.value })
      const counted = () => {
        renders.count++
        return slotProps()
      }
      return { counted }
    },
    template: `<Primitive><slot v-bind="counted()" /></Primitive>`,
  })
  const Child = defineComponent({
    props: ['modelValue'],
    setup: props => () => h('i', { class: 'child' }, String(props.modelValue)),
  })
  /** Renders its slot inside its own element, like a part below the root. */
  const Inner = defineComponent({
    components: { Primitive },
    template: `<Primitive class="inner"><slot /></Primitive>`,
  })
  return { model, renders, Root, Child, Inner }
}

async function change(model: { value: string }, value: string) {
  model.value = value
  await nextTick()
  await nextTick()
}

describe('useLazySlotProps', () => {
  it('does not render the slot again for a prop nobody reads', async () => {
    const { model, renders, Root } = createRoot()
    const wrapper = mount(defineComponent({
      components: { Root },
      template: `<Root><b>static</b></Root>`,
    }))
    expect(renders.count).toBe(1)
    await change(model, 'b')
    await change(model, 'c')
    expect(renders.count).toBe(1)
    wrapper.unmount()
  })

  it('follows a prop the slot destructures, with one render per change', async () => {
    const { model, renders, Root } = createRoot()
    const wrapper = mount(defineComponent({
      components: { Root },
      template: `<Root v-slot="{ modelValue }"><b>{{ modelValue }}</b></Root>`,
    }))
    expect(wrapper.find('b').text()).toBe('a')
    expect(renders.count).toBe(1)
    await change(model, 'b')
    expect(wrapper.find('b').text()).toBe('b')
    expect(renders.count).toBe(2)
    await change(model, 'c')
    expect(wrapper.find('b').text()).toBe('c')
    expect(renders.count).toBe(3)
    wrapper.unmount()
  })

  it('follows props spread onto a child component', async () => {
    const { model, Root, Child } = createRoot()
    const wrapper = mount(defineComponent({
      components: { Root, Child },
      template: `<Root v-slot="slotProps"><Child v-bind="slotProps" /></Root>`,
    }))
    expect(wrapper.find('.child').text()).toBe('a')
    await change(model, 'b')
    expect(wrapper.find('.child').text()).toBe('b')
    await change(model, 'c')
    expect(wrapper.find('.child').text()).toBe('c')
    wrapper.unmount()
  })

  it('follows props spread onto an element', async () => {
    const { model, Root } = createRoot()
    const wrapper = mount(defineComponent({
      components: { Root },
      template: `<Root v-slot="slotProps"><output v-bind="slotProps" /></Root>`,
    }))
    expect(wrapper.find('output').attributes('modelvalue')).toBe('a')
    await change(model, 'b')
    expect(wrapper.find('output').attributes('modelvalue')).toBe('b')
    await change(model, 'c')
    expect(wrapper.find('output').attributes('modelvalue')).toBe('c')
    wrapper.unmount()
  })

  it('follows props handed to `h()` in a render function', async () => {
    const { model, Root, Child } = createRoot()
    const wrapper = mount(defineComponent({
      setup: () => () => h(Root, null, { default: (slotProps: { modelValue: string }) => h(Child, slotProps) }),
    }))
    expect(wrapper.find('.child').text()).toBe('a')
    await change(model, 'b')
    expect(wrapper.find('.child').text()).toBe('b')
    await change(model, 'c')
    expect(wrapper.find('.child').text()).toBe('c')
    wrapper.unmount()
  })

  it('follows a prop that is only read inside a nested slot', async () => {
    const { model, Root, Inner } = createRoot()
    const wrapper = mount(defineComponent({
      components: { Root, Inner },
      template: `<Root v-slot="slotProps"><Inner><b>{{ slotProps.modelValue }}</b></Inner></Root>`,
    }))
    expect(wrapper.find('b').text()).toBe('a')
    await change(model, 'b')
    expect(wrapper.find('b').text()).toBe('b')
    await change(model, 'c')
    expect(wrapper.find('b').text()).toBe('c')
    wrapper.unmount()
  })

  it('gives an event handler the current value', async () => {
    const { model, Root } = createRoot()
    const seen: string[] = []
    const wrapper = mount(defineComponent({
      components: { Root },
      setup: () => ({ seen }),
      template: `<Root v-slot="slotProps"><button @click="seen.push(slotProps.modelValue)" /></Root>`,
    }))
    await change(model, 'b')
    await wrapper.find('button').trigger('click')
    await change(model, 'c')
    await wrapper.find('button').trigger('click')
    await change(model, 'd')
    await wrapper.find('button').trigger('click')
    expect(seen).toEqual(['b', 'c', 'd'])
    wrapper.unmount()
  })

  it('hands out a snapshot of the render, not a live value', async () => {
    const { model, Root } = createRoot()
    const held: { modelValue: string }[] = []
    const wrapper = mount(defineComponent({
      setup: () => () => h(Root, null, {
        default: (slotProps: { modelValue: string }) => {
          held.push(slotProps)
          return h('b', slotProps.modelValue)
        },
      }),
    }))
    await change(model, 'b')
    expect(held.map(props => props.modelValue)).toEqual(['a', 'b'])
    expect(Object.keys(held[0])).toEqual(['modelValue'])
    wrapper.unmount()
  })

  it('follows props spread onto a child inside a nested slot', async () => {
    const { model, Root, Child, Inner } = createRoot()
    const wrapper = mount(defineComponent({
      components: { Root, Child, Inner },
      template: `<Root v-slot="slotProps"><Inner><Child v-bind="slotProps" /></Inner></Root>`,
    }))
    expect(wrapper.find('.child').text()).toBe('a')
    await change(model, 'b')
    expect(wrapper.find('.child').text()).toBe('b')
    await change(model, 'c')
    expect(wrapper.find('.child').text()).toBe('c')
    wrapper.unmount()
  })

  it('follows each of several props spread onto a child', async () => {
    const first = ref('a')
    const second = ref(1)
    const Root = defineComponent({
      components: { Primitive },
      setup() {
        return { slotProps: useLazySlotProps({ first: () => first.value, second: () => second.value }) }
      },
      template: `<Primitive><slot v-bind="slotProps()" /></Primitive>`,
    })
    const Child = defineComponent({
      props: ['first', 'second'],
      setup: props => () => h('i', { class: 'child' }, `${props.first}|${props.second}`),
    })
    const wrapper = mount(defineComponent({
      components: { Root, Child },
      template: `<Root v-slot="slotProps"><Child v-bind="slotProps" /></Root>`,
    }))
    const text = () => wrapper.find('.child').text()
    expect(text()).toBe('a|1')
    // Vue stops comparing a child's props at the first one that changed.
    first.value = 'b'
    await nextTick()
    expect(text()).toBe('b|1')
    second.value = 2
    await nextTick()
    expect(text()).toBe('b|2')
    second.value = 3
    await nextTick()
    expect(text()).toBe('b|3')
    first.value = 'c'
    await nextTick()
    expect(text()).toBe('c|3')
    wrapper.unmount()
  })

  it('gives an event handler the current value while nothing else reads the prop', async () => {
    const { model, renders, Root } = createRoot()
    const seen: string[] = []
    const wrapper = mount(defineComponent({
      components: { Root },
      setup: () => ({ seen }),
      template: `<Root v-slot="slotProps"><button @click="seen.push(slotProps.modelValue)" /></Root>`,
    }))
    await wrapper.find('button').trigger('click')
    await wrapper.find('button').trigger('click')
    await change(model, 'b')
    await wrapper.find('button').trigger('click')
    await change(model, 'c')
    await change(model, 'd')
    await wrapper.find('button').trigger('click')
    expect(seen).toEqual(['a', 'a', 'b', 'd'])
    // The first read made the slot follow the model from then on.
    expect(renders.count).toBeGreaterThan(1)
    wrapper.unmount()
  })
})
