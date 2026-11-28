import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import ScrollAreaRoot from './ScrollAreaRoot.vue'
import ScrollAreaViewport from './ScrollAreaViewport.vue'
import ScrollAreaVirtualizer from './ScrollAreaVirtualizer.vue'

enableAutoUnmount(afterEach)

const options = Array.from({ length: 100 }, (_, index) => `Item ${index}`)

function mountVirtualizer() {
  const virtualizerRef = ref<any>()
  const wrapper = mount(defineComponent({
    setup: () => () => h(ScrollAreaRoot, null, () => h(ScrollAreaViewport, { style: 'width: 200px; height: 200px' }, () =>
      h(ScrollAreaVirtualizer, { ref: virtualizerRef, options, estimateSize: 25, overscan: 2 }, {
        default: ({ option }: any) => h('div', option),
      }))),
  }), { attachTo: document.body })
  return { wrapper, virtualizerRef }
}

describe('scroll area virtualizer template ref', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeAll(() => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('exposes its rendered element on both element keys', async () => {
    const { wrapper, virtualizerRef } = mountVirtualizer()
    await nextTick()
    const el = wrapper.find('[data-reka-virtualizer]').element
    expect('element' in virtualizerRef.value).toBe(true)
    expect(virtualizerRef.value.element).toBe(el)
    expect(virtualizerRef.value.$el).toBe(el)
  })

  it('does not expose its props', async () => {
    const { virtualizerRef } = mountVirtualizer()
    await nextTick()
    expect(virtualizerRef.value.options).toBeUndefined()
    expect(virtualizerRef.value.overscan).toBeUndefined()
    expect(virtualizerRef.value.estimateSize).toBeUndefined()
  })

  it('keeps the documented `virtualizer` instance', async () => {
    const { virtualizerRef } = mountVirtualizer()
    await nextTick()
    const { virtualizer } = virtualizerRef.value
    expect(typeof virtualizer.scrollToIndex).toBe('function')
    expect(typeof virtualizer.measure).toBe('function')
    expect(virtualizer.options.count).toBe(options.length)
  })
})
