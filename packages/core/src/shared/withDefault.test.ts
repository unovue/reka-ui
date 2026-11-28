import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { withDefault } from './withDefault'

const Base = defineComponent({
  name: 'Base',
  __name: 'Base',
  props: {
    label: { type: String, default: 'base' },
    size: { type: String, default: 'md' },
  },
  setup(props, { slots, expose }) {
    expose({ focus: () => 'focused' })
    return () => h('button', { 'data-size': props.size }, [props.label, slots.default?.({ size: props.size })])
  },
} as any)

describe('withDefault', () => {
  it('applies default props', () => {
    const Wrapped = withDefault(Base, { props: { label: 'default', size: 'lg' } })
    const wrapper = mount(Wrapped)

    expect(wrapper.get('button').text()).toBe('default')
    expect(wrapper.get('button').attributes('data-size')).toBe('lg')
  })

  it('renders the original component unchanged without options', () => {
    const wrapper = mount(withDefault(Base))

    expect(wrapper.get('button').text()).toBe('base')
    expect(wrapper.get('button').attributes('data-size')).toBe('md')
  })

  it('lets props passed by the user override the defaults', () => {
    const Wrapped = withDefault(Base, { props: { label: 'default', size: 'lg' } })
    const wrapper = mount(Wrapped, { props: { label: 'user' } as any })

    expect(wrapper.get('button').text()).toBe('user')
    expect(wrapper.get('button').attributes('data-size')).toBe('lg')
  })

  it('calls function-form props with the passed attrs', () => {
    const props = vi.fn((attrs: Record<string, any>) => ({ label: attrs.size === 'sm' ? 'small' : 'other' }))
    const Wrapped = withDefault(Base, { props })
    const wrapper = mount(Wrapped, { props: { size: 'sm' } as any })

    expect(props).toHaveBeenCalledWith(expect.objectContaining({ size: 'sm' }))
    expect(wrapper.get('button').text()).toBe('small')
    expect(wrapper.get('button').attributes('data-size')).toBe('sm')
  })

  it('re-evaluates function-form props when the passed attrs change', async () => {
    const Wrapped = withDefault(Base, { props: attrs => ({ label: `size-${attrs.size}` }) })
    const size = ref('sm')
    const wrapper = mount(defineComponent({
      setup: () => () => h(Wrapped, { size: size.value }),
    }))
    expect(wrapper.get('button').text()).toBe('size-sm')

    size.value = 'lg'
    await nextTick()
    expect(wrapper.get('button').text()).toBe('size-lg')
  })

  it('merges class and style with the defaults', () => {
    const Wrapped = withDefault(Base, { props: { class: 'default', style: { color: 'red' } } as any })
    const wrapper = mount(Wrapped, { attrs: { class: 'user', style: { margin: '1px' } } })

    const button = wrapper.get('button')
    expect(button.classes()).toEqual(['default', 'user'])
    expect(button.attributes('style')).toBe('color: red; margin: 1px;')
  })

  it('calls both the default and the user event listener', async () => {
    const defaultClick = vi.fn()
    const userClick = vi.fn()
    const Wrapped = withDefault(Base, { props: { onClick: defaultClick } as any })
    const wrapper = mount(Wrapped, { attrs: { onClick: userClick } })

    await wrapper.get('button').trigger('click')
    expect(defaultClick).toHaveBeenCalledOnce()
    expect(userClick).toHaveBeenCalledOnce()
  })

  it('lets user attrs override default attrs', () => {
    const Wrapped = withDefault(Base, { props: { 'id': 'default', 'data-test': 'default' } as any })
    const wrapper = mount(Wrapped, { attrs: { 'data-test': 'user' } })

    expect(wrapper.get('button').attributes('id')).toBe('default')
    expect(wrapper.get('button').attributes('data-test')).toBe('user')
  })

  it('does not render attrs on the wrapper itself', () => {
    const Wrapped = withDefault(Base)
    const wrapper = mount(Wrapped, { attrs: { 'data-test': 'user' } })

    expect(wrapper.findAll('[data-test="user"]')).toHaveLength(1)
    expect(wrapper.getComponent(Base).attributes('data-test')).toBe('user')
  })

  it('passes slots through', () => {
    const Wrapped = withDefault(Base, { props: { size: 'lg' } })
    const wrapper = mount(Wrapped, {
      slots: { default: ({ size }: { size: string }) => h('span', `slot-${size}`) },
    })

    expect(wrapper.get('span').text()).toBe('slot-lg')
  })

  it('forwards the exposed values and element of the wrapped component', async () => {
    const Wrapped = withDefault(Base, { props: { label: 'default' } })
    const wrapper = mount(Wrapped)
    await nextTick()

    const exposed = wrapper.vm.$.exposed!
    expect(exposed.focus()).toBe('focused')
    expect(exposed.$el).toBe(wrapper.get('button').element)
  })

  it('names the wrapper after the wrapped component', () => {
    expect((withDefault(Base) as any).name).toBe('BaseWrapper')
    expect((withDefault(defineComponent({ render: () => null })) as any).name).toBe('Wrapper')
  })
})
