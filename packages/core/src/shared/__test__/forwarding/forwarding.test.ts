import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Child from './Child.vue'
import ParentTwoLevel from './ParentTwoLevel.vue'
import ParentValueSwap from './ParentValueSwap.vue'
import ParentVOn from './ParentVOn.vue'

function childEmit(w: any, name: string, v: number) {
  (w.findComponent(Child).vm as any).emit(name, v)
}

describe('listener forwarding through a wrapper', () => {
  it('listener value goes undefined -> fn after mount (no other prop change)', async () => {
    const pick = vi.fn()
    const w = mount(ParentValueSwap, { props: { enabled: false, pick } })
    await w.setProps({ enabled: true })
    await nextTick()
    childEmit(w, 'select', 1)
    expect(pick).toHaveBeenCalledWith(1)
  })

  it('v-on object swaps one listener for another (same key count)', async () => {
    const a = vi.fn()
    const b = vi.fn()
    const w = mount(ParentVOn, { props: { listeners: { select: a } } })
    await w.setProps({ listeners: { highlight: b } })
    await nextTick()
    childEmit(w, 'highlight', 2)
    expect(b).toHaveBeenCalledWith(2)
  })

  it('v-on object adds a listener (key count changes)', async () => {
    const b = vi.fn()
    const w = mount(ParentVOn, { props: { listeners: {} } })
    await w.setProps({ listeners: { highlight: b } })
    await nextTick()
    childEmit(w, 'highlight', 3)
    expect(b).toHaveBeenCalledWith(3)
  })

  it('two-level wrapper chain via $attrs, listener enabled after mount', async () => {
    const pick = vi.fn()
    const w = mount(ParentTwoLevel, { props: { enabled: false, pick } })
    await w.setProps({ enabled: true })
    await nextTick()
    childEmit(w, 'select', 4)
    expect(pick).toHaveBeenCalledWith(4)
  })

  it('kebab update + once at mount', async () => {
    const f = vi.fn()
    const w = mount(ParentVOn, { props: { listeners: { 'update:model-value': f, 'highlightOnce': f } } })
    childEmit(w, 'highlight', 5)
    childEmit(w, 'update:modelValue', 6)
    expect(f).toHaveBeenCalledTimes(2)
  })
})
