import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { useSize } from './useSize'

describe('useSize', () => {
  let observeMock: ReturnType<typeof vi.fn>
  let disconnectMock: ReturnType<typeof vi.fn>
  let MockResizeObserver: ReturnType<typeof vi.fn>

  beforeEach(() => {
    observeMock = vi.fn()
    disconnectMock = vi.fn()
    const _observeMock = observeMock
    const _disconnectMock = disconnectMock
    // Must be a real class so `new ResizeObserver(...)` works
    MockResizeObserver = vi.fn(function (this: ResizeObserver) {
      this.observe = _observeMock
      this.unobserve = vi.fn()
      this.disconnect = _disconnectMock
    }) as unknown as ReturnType<typeof vi.fn>
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver
  })

  it('disconnects the observer on unmount', async () => {
    const TestComponent = defineComponent({
      setup() {
        const elRef = ref<HTMLElement | null>(null)
        const { width, height } = useSize(elRef)
        return { elRef, width, height }
      },
      render() {
        return h('div', { ref: 'elRef' })
      },
    })

    const wrapper = mount(TestComponent, { attachTo: document.body })

    expect(observeMock).toHaveBeenCalledTimes(1)
    expect(disconnectMock).toHaveBeenCalledTimes(0)

    wrapper.unmount()

    expect(disconnectMock).toHaveBeenCalledTimes(1)
  })

  it('sets initial size from offsetWidth/offsetHeight on mount', async () => {
    const TestComponent = defineComponent({
      setup() {
        const elRef = ref<HTMLElement | null>(null)
        const { width, height } = useSize(elRef)
        return { elRef, width, height }
      },
      render() {
        return h('div', { ref: 'elRef' })
      },
    })

    const wrapper = mount(TestComponent, { attachTo: document.body })

    // jsdom returns 0 for offsetWidth/offsetHeight — assert they are numbers
    expect(typeof wrapper.vm.width).toBe('number')
    expect(typeof wrapper.vm.height).toBe('number')
    expect(wrapper.vm.width).toBe(0)
    expect(wrapper.vm.height).toBe(0)

    wrapper.unmount()
  })

  it('does not create an observer when element is null', async () => {
    const TestComponent = defineComponent({
      setup() {
        const elRef = ref<HTMLElement | null>(null)
        const { width, height } = useSize(elRef)
        return { elRef, width, height }
      },
      // render with no element bound to elRef — it stays null
      render() {
        return h('span')
      },
    })

    const wrapper = mount(TestComponent, { attachTo: document.body })

    expect(observeMock).not.toHaveBeenCalled()

    // unmount should not throw even though no observer was created
    expect(() => wrapper.unmount()).not.toThrow()
  })
})
