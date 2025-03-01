import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Fragment, computed, defineComponent, h, ref } from 'vue'

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
})
