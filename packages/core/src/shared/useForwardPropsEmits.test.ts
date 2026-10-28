import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useEmitAsProps } from './useEmitAsProps'
import { useForwardPropsEmits } from './useForwardPropsEmits'

/** A child that emits on demand. */
const Child = defineComponent({
  props: { label: String },
  emits: ['select', 'highlight', 'update:modelValue'],
  setup(props, { emit, expose }) {
    expose({ emit })
    return () => h('div', props.label)
  },
})

function makeWrapper(helper: 'forwardPropsEmits' | 'emitAsProps') {
  const seen: Record<string, any>[] = []
  const Wrapper = defineComponent({
    props: { label: String },
    emits: ['select', 'highlight', 'update:modelValue'],
    setup(props, { emit }) {
      const forwarded = helper === 'forwardPropsEmits' ? useForwardPropsEmits(props, emit) : null
      const emitsAsProps = helper === 'emitAsProps' ? useEmitAsProps(emit) : null
      return () => {
        const bound = forwarded ? forwarded.value : { ...props, ...emitsAsProps }
        seen.push(bound)
        return h(Child, bound)
      }
    },
  })
  return { Wrapper, seen }
}

const handlerKeys = (props: Record<string, any>) => Object.keys(props).filter(key => key.startsWith('on')).sort()

describe.each(['forwardPropsEmits', 'emitAsProps'] as const)('%s forwards every declared emit', (helper) => {
  it('forwards a handler for each declared event, listener or not', () => {
    const { Wrapper, seen } = makeWrapper(helper)
    mount(Wrapper, { props: { label: 'a' } })
    expect(handlerKeys(seen.at(-1)!)).toEqual(['onHighlight', 'onSelect', 'onUpdate:modelValue'])
  })

  it('re-emits from the wrapper, so `emitted()` records an event nobody listens to', () => {
    const { Wrapper } = makeWrapper(helper)
    const wrapper = mount(Wrapper, { props: { label: 'a' } })
    ;(wrapper.findComponent(Child).vm as any).emit('select', 1)
    expect(wrapper.emitted('select')).toEqual([[1]])
  })

  it('keeps the forwarded handlers stable across renders (no child patch on them)', async () => {
    const { Wrapper, seen } = makeWrapper(helper)
    const wrapper = mount(Wrapper, { props: { label: 'a' } })
    const first = seen.at(-1)!
    await wrapper.setProps({ label: 'b' })
    const second = seen.at(-1)!
    for (const key of handlerKeys(first))
      expect(second[key]).toBe(first[key])
  })

  it('passes every argument through', () => {
    const onSelect = vi.fn()
    const { Wrapper } = makeWrapper(helper)
    const wrapper = mount(Wrapper, { attrs: { onSelect } })
    ;(wrapper.findComponent(Child).vm as any).emit('select', 1, 'two', { three: 3 })
    expect(onSelect).toHaveBeenCalledWith(1, 'two', { three: 3 })
  })
})

describe('useEmitAsProps', () => {
  it('reads object-form `emits`', () => {
    const emit = vi.fn()
    let handlers: Record<string, any> = {}
    mount(defineComponent({
      emits: { 'select': null, 'update:modelValue': null },
      setup() {
        handlers = useEmitAsProps(emit as any)
        return () => null
      },
    }))
    expect(Object.keys(handlers).sort()).toEqual(['onSelect', 'onUpdate:modelValue'])
    handlers.onSelect('x')
    expect(emit).toHaveBeenCalledWith('select', 'x')
  })
})

describe('useForwardPropsEmits', () => {
  it('without emit returns the forwarded props object itself (no copy per read)', () => {
    let forwarded: { value: Record<string, any> } | undefined
    mount(defineComponent({
      props: { label: String },
      setup(props) {
        forwarded = useForwardPropsEmits(props)
        return () => null
      },
    }), { props: { label: 'a' } })
    expect(forwarded!.value).toEqual({ label: 'a' })
    expect(forwarded!.value).toBe(forwarded!.value)
  })
})
