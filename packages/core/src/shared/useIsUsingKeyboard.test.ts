import { fireEvent } from '@testing-library/vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { useIsUsingKeyboard } from './useIsUsingKeyboard'

function setupTestComponent() {
  return defineComponent({
    setup() {
      return {
        isUsingKeyboard: useIsUsingKeyboard(),
      }
    },
    template: '<div></div>',
  })
}

describe('useIsUsingKeyboard', () => {
  it('should be false by default', () => {
    const wrapper = mount(setupTestComponent())
    expect(wrapper.vm.isUsingKeyboard).toBe(false)
  })

  it('should be true after keydown', () => {
    const wrapper = mount(setupTestComponent())
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    expect(wrapper.vm.isUsingKeyboard).toBe(true)
  })

  it('should reset to false after pointermove', () => {
    const wrapper = mount(setupTestComponent())
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    expect(wrapper.vm.isUsingKeyboard).toBe(true)
    fireEvent.pointerMove(document)
    expect(wrapper.vm.isUsingKeyboard).toBe(false)
  })

  it('should reset to false after pointerdown', () => {
    const wrapper = mount(setupTestComponent())
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    expect(wrapper.vm.isUsingKeyboard).toBe(true)
    fireEvent.pointerDown(document)
    expect(wrapper.vm.isUsingKeyboard).toBe(false)
  })

  it('should keep tracking after the first subscriber unmounts', async () => {
    // A fresh shared instance: the components mounted above stay subscribed.
    vi.resetModules()
    const { useIsUsingKeyboard: useFreshIsUsingKeyboard } = await import('./useIsUsingKeyboard')
    const Subscriber = defineComponent({
      setup() {
        return { isUsingKeyboard: useFreshIsUsingKeyboard() }
      },
      template: '<div></div>',
    })
    const first = mount(Subscriber)
    const second = mount(Subscriber)
    first.unmount()

    fireEvent.keyDown(document, { key: 'ArrowDown' })
    expect(second.vm.isUsingKeyboard).toBe(true)
    fireEvent.pointerDown(document)
    expect(second.vm.isUsingKeyboard).toBe(false)
    second.unmount()
  })
})
