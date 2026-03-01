import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { computed, defineComponent, Fragment, h, ref } from 'vue'

import { useForwardExpose } from './useForwardExpose'

describe('useForwardRef', async () => {
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
})
