import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { withDefault } from './withDefault'

describe('withDefault', () => {
  it('sets up the forwarded expose once instead of on every render', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Base = defineComponent({
      props: { count: Number },
      setup: props => () => h('div', String(props.count)),
    })
    const Wrapped = withDefault(Base, { props: { count: 1 } })
    const count = ref(1)
    const wrapper = mount(defineComponent({
      setup: () => () => h(Wrapped, { count: count.value }),
    }))
    const exposed = wrapper.findComponent(Wrapped).vm.$.exposed

    try {
      count.value = 2
      await nextTick()
      count.value = 3
      await nextTick()

      expect(wrapper.text()).toBe('3')
      expect(wrapper.findComponent(Wrapped).vm.$.exposed).toBe(exposed)
      expect(warn).not.toHaveBeenCalled()
    }
    finally {
      warn.mockRestore()
      wrapper.unmount()
    }
  })
})
