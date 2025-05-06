import { mount } from '@vue/test-utils'
import { reactivePick } from '@vueuse/shared'
import { describe, expect, it } from 'vitest'
import { computed, defineComponent, watch } from 'vue'
import { useForwardProps } from './useForwardProps'

function setupTestComponent(props: Record<string, any>, options = { computed: false }) {
  return defineComponent({
    props,
    emits: ['log'],
    setup(props, { emit }) {
      const payload = options.computed ? computed(() => ({ ...(Object.assign({}, props)) })) : props
      const forwarded = useForwardProps(payload)
      watch(forwarded, () => emit('log', forwarded.value), { immediate: true, deep: true })

      return { forwarded }
    },
    template: '<div>{{ forwarded }}</div>',
  })
}

describe('useForwardProps', () => {
  it('should forward nothing as no props provided', () => {
    const wrapper = mount(setupTestComponent({ id: String }))
    expect(wrapper.emitted('log')?.[0][0]).toStrictEqual({})
  })

  it('should forward default props', () => {
    const wrapper = mount(setupTestComponent({ id: { type: String, default: 'test' } }))
    expect(wrapper.emitted('log')?.[0][0]).toStrictEqual({ id: 'test' })
  })

  it('should forward provided props instead of default', () => {
    const props = { id: 'new-test', number: 0, enabled: false }
    const wrapper = mount(setupTestComponent(
      { id: { type: String, default: 'test' }, number: Number, enabled: Boolean },
    ), { props })
    expect(wrapper.emitted('log')?.[0][0]).toStrictEqual(props)
  })

  it('should be reactive', async () => {
    const wrapper = mount(setupTestComponent({ id: { type: String, default: 'test' } }))
    expect(wrapper.emitted('log')?.[0][0]).toStrictEqual({ id: 'test' })
    await wrapper.setProps({ id: 'new-test' })
    expect(wrapper.emitted('log')?.[1][0]).toStrictEqual({ id: 'new-test' })
  })

  it('should not forwarded not provided props', () => {
    const wrapper = mount(setupTestComponent({ id: { type: String, default: 'test' } }), { props: { extra: 'not-related' }, attrs: { class: 'custom' } })
    expect(wrapper.emitted('log')?.[0][0]).toStrictEqual({ id: 'test' })
  })

  it('should not forwarded props that is not passed as parameters', async () => {
    const component = defineComponent({
      props: { id: { type: String, default: 'test' }, extra: { type: String, default: 'not-related' } },
      emits: ['log'],
      setup(props, { emit }) {
        const picked = reactivePick(props, 'id')
        const forwarded = useForwardProps(picked)
        watch(forwarded, () => emit('log', forwarded.value), { immediate: true, deep: true })

        return { forwarded }
      },
      template: '<div>{{ forwarded }}</div>',
    })
    const wrapper = mount(component)
    expect(wrapper.emitted('log')?.[0][0]).toStrictEqual({ id: 'test' })
    await wrapper.setProps({ id: 'new-test' })
    expect(wrapper.emitted('log')?.[1][0]).toStrictEqual({ id: 'new-test' })
  })

  describe('with computedRef', async () => {
    it('should be reactive', async () => {
      const wrapper = mount(setupTestComponent({ id: { type: String, default: 'test' } }, { computed: true }))
      expect(wrapper.emitted('log')?.[0][0]).toStrictEqual({ id: 'test' })
      await wrapper.setProps({ id: 'new-test' })
      expect(wrapper.emitted('log')?.[1][0]).toStrictEqual({ id: 'new-test' })
    })
  })
})
