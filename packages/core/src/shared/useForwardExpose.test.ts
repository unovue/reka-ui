import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { computed, defineComponent, Fragment, h, nextTick, ref, watchPostEffect } from 'vue'

import { Primitive } from '../Primitive'
import { useForwardExpose } from './useForwardExpose'

describe('useForwardRef', async () => {
  it('should safely read cached child exposures after forwarding a $el-only ref', async () => {
    const showComponent = ref(true)
    const Child = defineComponent({
      setup(_, { expose }) {
        expose({ childValue: 'child' })
        return () => h('span', 'Child')
      },
    })
    const wrapper = mount(defineComponent({
      setup() {
        const { forwardRef } = useForwardExpose()
        return () => h('div', showComponent.value
          ? [h(Child, { ref: forwardRef })]
          : [h('button', { ref: element => forwardRef({ $el: element } as any) }, 'Replacement')])
      },
    }))

    try {
      await nextTick()
      const exposed = wrapper.vm.$.exposed!
      expect(exposed.childValue).toBe('child')

      showComponent.value = false
      await nextTick()
      expect(exposed.$el).toBe(wrapper.get('button').element)
      expect(() => exposed.childValue).not.toThrow()
      expect(exposed.childValue).toBeUndefined()

      showComponent.value = true
      await nextTick()
      expect(exposed.$el).toBe(wrapper.get('span').element)
      expect(exposed.childValue).toBe('child')
    }
    finally {
      wrapper.unmount()
    }
  })

  it.each(['element', 'component'])('should release a forwarded %s when its child unmounts', async (kind) => {
    const show = ref(true)
    let forwarded!: ReturnType<typeof useForwardExpose>
    const Child = defineComponent({
      setup(_, { expose }) {
        const element = ref<HTMLElement>()
        expose({ element })
        return () => h('span', { ref: element }, 'Child')
      },
    })
    const wrapper = mount(defineComponent({
      setup() {
        forwarded = useForwardExpose()
        return () => h('div', {}, show.value
          ? [h(kind === 'element' ? 'span' : Child, { ref: forwarded.forwardRef })]
          : [])
      },
    }))
    await nextTick()

    const element = wrapper.get('span').element
    const rootElement = wrapper.get('div').element
    const exposed = wrapper.vm.$.exposed!
    expect(forwarded.currentElement.value).toBe(element)
    expect(exposed.$el).toBe(element)

    show.value = false
    await nextTick()

    expect(wrapper.vm.$.exposed!.$el).toBe(rootElement)
    expect(exposed.$el).toBe(rootElement)
    expect(exposed.element).toBeUndefined()
    expect(forwarded.currentRef.value).toBeNull()
    expect(forwarded.currentElement.value).toBeNull()

    show.value = true
    await nextTick()

    expect(forwarded.currentElement.value).toBe(wrapper.get('span').element)
    expect(wrapper.vm.$.exposed!.$el).toBe(wrapper.get('span').element)
    expect(wrapper.get('span').element).not.toBe(element)
    wrapper.unmount()
  })

  it('should keep parent props reactive when merging a child expose', async () => {
    const Child = defineComponent({
      setup(_, { expose }) {
        expose({ childValue: 'child' })
        return () => h('span')
      },
    })
    const wrapper = mount(defineComponent({
      props: { label: String },
      setup() {
        const { forwardRef } = useForwardExpose()
        return () => h(Child, { ref: forwardRef })
      },
    }), { props: { label: 'before' } })
    await nextTick()

    const exposed = wrapper.vm.$.exposed!
    expect(exposed.label).toBe('before')
    await wrapper.setProps({ label: 'after' })
    expect(exposed.label).toBe('after')
    wrapper.unmount()
  })

  it('should forward plain DOM element ref', async () => {
    const comp = defineComponent({
      setup() {
        const { forwardRef } = useForwardExpose()
        return { forwardRef }
      },
      template: `
        <div>
          <span :ref="forwardRef"> inner element </span>
        </div>
      `,
    })
    const wrapper = mount(
      defineComponent(() => {
        const el = ref()
        const forwardedRef = computed(() => el.value?.$el)
        return () =>
          h('div', { test: forwardedRef.value }, [h(comp, { ref: el })])
      }),
    )
    await flushPromises()
    expect(wrapper.attributes('test')).toBe('[object HTMLSpanElement]')
  })
  it('should forward plain DOM element ref - 2', async () => {
    const comp = defineComponent({
      setup() {
        const { forwardRef } = useForwardExpose()
        return { forwardRef }
      },
      template: `
        <div>
          <span :ref="_=>forwardRef({$el: _})"> inner element </span>
        </div>
      `,
    })
    const wrapper = mount(
      defineComponent(() => {
        const el = ref()
        const forwardedRef = computed(() => el.value?.$el)
        return () =>
          h('div', { test: forwardedRef.value }, [h(comp, { ref: el })])
      }),
    )
    await flushPromises()
    expect(wrapper.attributes('test')).toBe('[object HTMLSpanElement]')
  })
  it('should forward plain DOM element ref - fragment', async () => {
    const comp = defineComponent({
      setup() {
        const { forwardRef } = useForwardExpose()
        return { forwardRef }
      },
      template: `
        <div>multiple node root</div>
        <div>
          <span :ref="forwardRef"> inner element </span>
        </div>
      `,
    })
    const wrapper = mount(
      defineComponent(() => {
        const el = ref()
        const forwardedRef = computed(() => el.value?.$el)
        return () =>
          h('div', { test: forwardedRef.value }, [h(comp, { ref: el })])
      }),
    )
    await flushPromises()
    expect(wrapper.attributes('test')).toBe('[object HTMLSpanElement]')
  })
  it('should forward plain DOM element ref - fragment - 2', async () => {
    const Frag = defineComponent(
      (props, { slots }) =>
        () =>
          h(Fragment, {}, [slots.default?.()]),
    )
    const comp = defineComponent({
      components: { Frag },
      setup() {
        const { forwardRef } = useForwardExpose()
        return { forwardRef }
      },
      template: `
        <Frag>
          <Frag>
            <div>
              <span :ref="forwardRef"> inner element </span>
            </div>
          </Frag>
        </Frag>
      `,
    })
    const wrapper = mount(
      defineComponent(() => {
        const el = ref()
        const forwardedRef = computed(() => el.value?.$el)
        return () =>
          h('div', { test: forwardedRef.value }, [h(comp, { ref: el })])
      }),
    )
    await flushPromises()
    expect(wrapper.attributes('test')).toBe('[object HTMLSpanElement]')
  })
  it('should forward plain DOM element ref - fragment - 3', async () => {
    const comp = defineComponent({
      setup() {
        const { forwardRef } = useForwardExpose()
        return { forwardRef }
      },
      template: `
        <div>
          <template>
            <div>
              <span :ref="forwardRef"> inner element </span>
            </div>
          </template>
        </div>
      `,
    })
    const wrapper = mount(
      defineComponent(() => {
        const el = ref()
        const forwardedRef = computed(() => el.value?.$el)
        return () =>
          h('div', { test: forwardedRef.value }, [h(comp, { ref: el })])
      }),
    )
    await flushPromises()
    expect(wrapper.attributes('test')).toBe('[object HTMLSpanElement]')
  })
  it('should forward component instance for component', async () => {
    const InnerComp = defineComponent(() => {
      return () => h('span', {}, 'inner component')
    })
    const comp = defineComponent({
      setup() {
        const { forwardRef } = useForwardExpose()
        return { forwardRef }
      },
      components: { InnerComp },
      template: `
        <div>
          <InnerComp :ref="forwardRef" />
        </div>
      `,
    })
    const wrapper = mount(
      defineComponent(() => {
        const el = ref()
        const forwardedRef = computed(() => el.value?.$el)
        return () =>
          h('div', { test: forwardedRef.value }, [h(comp, { ref: el })])
      }),
    )
    await flushPromises()
    expect(wrapper.attributes('test')).toBe('[object HTMLSpanElement]')
  })

  // PR #2339: Test that child component's expose properties are correctly merged into parent's expose
  it('should forward child component exposed properties to parent ref', async () => {
    // Define an inner component with expose
    const InnerComp = defineComponent({
      setup(_, { expose }) {
        const innerValue = ref('inner-value')
        const innerMethod = () => 'inner-method-result'
        // Child component exposes its properties and methods
        expose({ innerValue, innerMethod })
        return () => h('span', {}, 'inner component')
      },
    })

    // Middle component using useForwardExpose
    const comp = defineComponent({
      components: { InnerComp },
      setup() {
        const { forwardRef } = useForwardExpose()
        return { forwardRef }
      },
      template: `
        <div>
          <InnerComp :ref="forwardRef" />
        </div>
      `,
    })

    // Parent component accesses via ref
    const parentRef = ref<any>()
    const wrapper = mount(
      defineComponent(() => {
        return () => h('div', {}, [h(comp, { ref: parentRef })])
      }),
    )

    await flushPromises()
    // Verify child component's exposed properties are accessible through parent ref
    expect(parentRef.value?.innerValue).toBe('inner-value')
    expect(parentRef.value?.innerMethod()).toBe('inner-method-result')
  })

  it('should merge child component exposed properties with parent component props', async () => {
    // Define an inner component with expose
    const InnerComp = defineComponent({
      setup(_, { expose }) {
        const childExposedValue = ref('child-exposed')
        expose({ childExposedValue })
        return () => h('span', {}, 'inner component')
      },
    })

    // Middle component using useForwardExpose, also receiving props
    const comp = defineComponent({
      components: { InnerComp },
      props: {
        parentProp: {
          type: String,
          default: 'parent-prop-value',
        },
      },
      setup() {
        const { forwardRef } = useForwardExpose()
        return { forwardRef }
      },
      template: `
        <div>
          <InnerComp :ref="forwardRef" />
        </div>
      `,
    })

    const parentRef = ref<any>()
    const wrapper = mount(
      defineComponent(() => {
        return () =>
          h('div', {}, [h(comp, { ref: parentRef, parentProp: 'custom-value' })])
      }),
    )

    await flushPromises()
    // Verify both parent's props and child's expose are accessible
    expect(parentRef.value?.parentProp).toBe('custom-value')
    expect(parentRef.value?.childExposedValue).toBe('child-exposed')
    expect(parentRef.value?.$el).toBeInstanceOf(HTMLSpanElement)
  })

  it('should forward multiple exposed properties from child component', async () => {
    // Inner component exposing multiple properties and methods
    const InnerComp = defineComponent({
      setup(_, { expose }) {
        const count = ref(0)
        const message = ref('hello')
        const increment = () => count.value++
        const getMessage = () => message.value
        // Expose multiple properties and methods
        expose({ count, message, increment, getMessage })
        return () => h('button', {}, 'inner')
      },
    })

    // Component using useForwardExpose
    const comp = defineComponent({
      components: { InnerComp },
      setup() {
        const { forwardRef } = useForwardExpose()
        return { forwardRef }
      },
      template: `
        <div>
          <InnerComp :ref="forwardRef" />
        </div>
      `,
    })

    const parentRef = ref<any>()
    const wrapper = mount(
      defineComponent(() => {
        return () => h('div', {}, [h(comp, { ref: parentRef })])
      }),
    )

    await flushPromises()
    // Verify all exposed properties and methods are accessible
    expect(parentRef.value?.count).toBe(0)
    expect(parentRef.value?.message).toBe('hello')
    expect(parentRef.value?.getMessage()).toBe('hello')
    // Call method to modify state
    parentRef.value?.increment()
    expect(parentRef.value?.count).toBe(1)
    expect(parentRef.value?.$el).toBeInstanceOf(HTMLButtonElement)
  })

  it('should update currentElement when as-child conditional child swaps', async () => {
    const toggle = ref(true)
    let renderNode: string | undefined

    mount(defineComponent({
      setup() {
        const { forwardRef, currentElement } = useForwardExpose()
        watchPostEffect(() => {
          renderNode = currentElement.value?.nodeName.toLowerCase()
        })
        return () => {
          const showButton = toggle.value
          return h(Primitive, { ref: forwardRef, asChild: true }, {
            default: () => [showButton ? h('button') : h('span')],
          })
        }
      },
    }))

    await flushPromises()
    expect(renderNode).toBe('button')

    toggle.value = !toggle.value
    await flushPromises()
    expect(renderNode).toBe('span')
  })
})
