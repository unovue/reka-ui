import { expect, it, vi } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { useForwardPropsEmits } from '@/shared'

// Vue HMR (`reload` -> `updateComponentDef`) patches the SAME definition object
// in place and drops Vue's own `emitsCache` / `propsCache` for it, so the
// per-definition `declaredEvents` / `defaultedKeys` caches must follow the new
// `emits` / `props` option instead of keeping the first one.
const Child = defineComponent({
  emits: ['select', 'highlight'],
  setup(_, { emit, expose }) {
    expose({ emit })
    return () => h('div')
  },
})

it('a definition whose emits change (HMR) forwards the new event', () => {
  const Wrapper: any = defineComponent({
    emits: ['select'],
    setup(props, { emit }) {
      const forwarded = useForwardPropsEmits(props, emit)
      return () => h(Child, { ...forwarded.value })
    },
  })
  let child: any
  const ChildSpy: any = defineComponent({ emits: ['select', 'highlight'], setup(_, { emit }) {
    child = { emit }
    return () => h('div')
  } })
  Wrapper.setup = (props: any, { emit }: any) => {
    const forwarded = useForwardPropsEmits(props, emit)
    return () => h(ChildSpy, { ...forwarded.value })
  }
  const app1 = createApp({ render: () => h(Wrapper, { onSelect: () => {} }) })
  app1.mount(document.createElement('div'))
  app1.unmount()

  // What Vue's HMR `updateComponentDef` does: mutate the definition in place.
  Object.assign(Wrapper, { emits: ['select', 'highlight'] })

  const onHighlight = vi.fn()
  const app2 = createApp({ render: () => h(Wrapper, { onHighlight }) })
  app2.mount(document.createElement('div'))
  child.emit('highlight', 1)
  expect(onHighlight).toHaveBeenCalledWith(1)
})

it('a definition whose prop defaults change (HMR) forwards the new defaulted prop', () => {
  let forwarded: any
  const Wrapper: any = defineComponent({
    props: { a: { type: String, default: 'a' } },
    setup(props) {
      forwarded = useForwardPropsEmits(props)
      return () => h('div')
    },
  })
  createApp({ render: () => h(Wrapper) }).mount(document.createElement('div'))
  expect(forwarded.value).toEqual({ a: 'a' })

  Object.assign(Wrapper, { props: { a: { type: String, default: 'a' }, b: { type: String, default: 'b' } } })
  createApp({ render: () => h(Wrapper) }).mount(document.createElement('div'))
  expect(forwarded.value).toEqual({ a: 'a', b: 'b' })
})
