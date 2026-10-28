import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useEmitAsProps } from './useEmitAsProps'
import { useForwardPropsEmits } from './useForwardPropsEmits'

/** A child that records the props it was handed, and emits on demand. */
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
        return h(Child, { ...bound, ref: 'child' })
      }
    },
  })
  return { Wrapper, seen }
}

const handlerKeys = (props: Record<string, any>) => Object.keys(props).filter(key => key.startsWith('on')).sort()

describe.each(['forwardPropsEmits', 'emitAsProps'] as const)('%s forwards only bound listeners', (helper) => {
  it('forwards no handler for an event without a listener (update:* excepted)', () => {
    const { Wrapper, seen } = makeWrapper(helper)
    mount(Wrapper, { props: { label: 'a' } })
    expect(handlerKeys(seen.at(-1)!)).toEqual(['onUpdate:modelValue'])
  })

  it('forwards a handler for each bound listener and it re-emits', async () => {
    const onSelect = vi.fn()
    const { Wrapper, seen } = makeWrapper(helper)
    const wrapper = mount(Wrapper, { props: { label: 'a' }, attrs: { onSelect } })
    expect(handlerKeys(seen.at(-1)!)).toEqual(['onSelect', 'onUpdate:modelValue'])
    ;(wrapper.findComponent(Child).vm as any).emit('select', 1)
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('counts a `.once` listener as bound', () => {
    const { Wrapper, seen } = makeWrapper(helper)
    mount(Wrapper, { attrs: { onHighlightOnce: () => {} } })
    expect(handlerKeys(seen.at(-1)!)).toContain('onHighlight')
  })

  it('keeps the forwarded handler stable across renders (no child patch on it)', async () => {
    const { Wrapper, seen } = makeWrapper(helper)
    const wrapper = mount(Wrapper, { props: { label: 'a' }, attrs: { onSelect: () => {} } })
    const first = seen.at(-1)!.onSelect
    await wrapper.setProps({ label: 'b' })
    expect(seen.at(-1)!.onSelect).toBe(first)
  })

  it('picks up a listener bound after mount on the next render', async () => {
    const onSelect = vi.fn()
    const bind = ref(false)
    const label = ref('a')
    const { Wrapper, seen } = makeWrapper(helper)
    const Parent = defineComponent(() => () => h(Wrapper, { label: label.value, ...(bind.value ? { onSelect } : {}) }))
    const wrapper = mount(Parent)
    expect(handlerKeys(seen.at(-1)!)).not.toContain('onSelect')
    bind.value = true
    label.value = 'b'
    await nextTick()
    expect(handlerKeys(seen.at(-1)!)).toContain('onSelect')
    ;(wrapper.findComponent(Child).vm as any).emit('select', 2)
    expect(onSelect).toHaveBeenCalledWith(2)
  })
})

describe('useEmitAsProps', () => {
  it('still reads any declared handler by name', () => {
    const emit = vi.fn()
    let handlers: Record<string, any> = {}
    mount(defineComponent({
      emits: ['select'],
      setup() {
        handlers = useEmitAsProps(emit as any)
        return () => null
      },
    }))
    expect('onSelect' in handlers).toBe(true)
    handlers.onSelect('x')
    expect(emit).toHaveBeenCalledWith('select', 'x')
    expect(Object.keys(handlers)).toEqual([])
  })
})

describe('useForwardPropsEmits', () => {
  it('without listeners returns the forwarded props object itself (no copy per read)', () => {
    let forwarded: { value: Record<string, any> } | undefined
    mount(defineComponent({
      props: { label: String },
      emits: ['select'],
      setup(props, { emit }) {
        forwarded = useForwardPropsEmits(props, emit)
        return () => null
      },
    }), { props: { label: 'a' } })
    expect(forwarded!.value).toEqual({ label: 'a' })
    expect(forwarded!.value).toBe(forwarded!.value)
  })
})
