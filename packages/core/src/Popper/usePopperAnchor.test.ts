import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { providePopperRootContext } from './PopperRoot.vue'
import { usePopperAnchor } from './usePopperAnchor'

describe('usePopperAnchor', () => {
  it('follows the consumer\'s `reference`, not every attribute change', async () => {
    const onAnchorChange = vi.fn()
    const Part = defineComponent({
      inheritAttrs: false,
      setup() {
        const element = ref<HTMLElement>()
        usePopperAnchor({ element, consumerAttrs: true })
        return () => h('div', { ref: element })
      },
    })
    const attrs = ref<Record<string, unknown>>({})
    const wrapper = mount(defineComponent({
      setup() {
        providePopperRootContext({ anchor: ref(), onAnchorChange } as any)
        return () => h(Part, attrs.value)
      },
    }))
    await nextTick()
    const element = wrapper.find('div').element
    expect(onAnchorChange).toHaveBeenLastCalledWith(element)
    onAnchorChange.mockClear()

    attrs.value = { 'data-x': '1' }
    await nextTick()
    attrs.value = { 'data-x': '2', 'class': 'y' }
    await nextTick()
    expect(onAnchorChange).not.toHaveBeenCalled()

    const reference = document.createElement('span')
    attrs.value = { 'data-x': '2', reference }
    await nextTick()
    expect(onAnchorChange).toHaveBeenCalledTimes(1)
    expect(onAnchorChange).toHaveBeenLastCalledWith(reference)
    wrapper.unmount()
  })
})
