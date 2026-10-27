import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { ScrollAreaRoot, ScrollAreaViewport } from '../ScrollArea'
import { withDefault } from './withDefault'

describe('withDefault', () => {
  it('applies default props and keeps the wrapped part\'s ref contract', async () => {
    const Wrapped = withDefault(ScrollAreaRoot, { props: { type: 'always' } })
    const partRef = ref<any>()
    const wrapper = mount(defineComponent(() => () => h(Wrapped, { ref: partRef }, () => h(ScrollAreaViewport))))
    await flushPromises()

    const root = wrapper.element as HTMLElement
    expect(partRef.value.element).toBe(root)
    expect(partRef.value.$el).toBe(root)
    // The wrapped part's documented exposed API reads through the wrapper.
    expect(partRef.value.viewport).toBeInstanceOf(HTMLElement)
    expect(typeof partRef.value.scrollTop).toBe('function')
    expect('scrollTop' in partRef.value).toBe(true)
  })
})
