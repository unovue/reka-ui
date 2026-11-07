import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useBodyScrollLock } from './useBodyScrollLock'

vi.mock('@vueuse/shared', async (importOriginal) => {
  const original = await importOriginal<typeof import('@vueuse/shared')>()
  return { ...original, isIOS: true }
})

vi.mock('@/ConfigProvider/ConfigProvider.vue', () => ({
  injectConfigProviderContext: () => ({ scrollBody: ref(true) }),
}))

enableAutoUnmount(afterEach)

function createWrapper() {
  return mount({
    template: '<div><button>Action</button></div>',
    setup() {
      return { locked: useBodyScrollLock(true) }
    },
  }, { attachTo: document.body })
}

function touch(clientX: number, clientY = 0, identifier = 1) {
  return { clientX, clientY, identifier }
}

function dispatchTouch(target: Element, type: string, touches: ReturnType<typeof touch>[]) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'touches', { value: touches })
  target.dispatchEvent(event)
  return event
}

describe('useBodyScrollLock on iOS', () => {
  it('does not cancel floating-point coordinate noise or release the body lock', async () => {
    const wrapper = createWrapper()
    await nextTick()
    const button = wrapper.get('button').element

    dispatchTouch(button, 'touchstart', [touch(33.53725850965965, 25.371665133394714)])
    const move = dispatchTouch(button, 'touchmove', [touch(33.537258509659665, 25.371665133394714)])

    expect(move.defaultPrevented).toBe(false)
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.pointerEvents).toBe('none')
  })

  it('measures cumulative movement from the origin and keeps cancelling after returning to it', async () => {
    const wrapper = createWrapper()
    await nextTick()
    const button = wrapper.get('button').element

    dispatchTouch(button, 'touchstart', [touch(0)])
    expect(dispatchTouch(button, 'touchmove', [touch(0.006)]).defaultPrevented).toBe(false)
    expect(dispatchTouch(button, 'touchmove', [touch(0.009)]).defaultPrevented).toBe(false)
    expect(dispatchTouch(button, 'touchmove', [touch(0.012)]).defaultPrevented).toBe(true)
    expect(dispatchTouch(button, 'touchmove', [touch(0)]).defaultPrevented).toBe(true)
  })

  it('allows the noise threshold but cancels movement beyond it in either axis', async () => {
    const wrapper = createWrapper()
    await nextTick()
    const button = wrapper.get('button').element

    dispatchTouch(button, 'touchstart', [touch(0)])
    expect(dispatchTouch(button, 'touchmove', [touch(0, 0.01)]).defaultPrevented).toBe(false)
    expect(dispatchTouch(button, 'touchmove', [touch(0.009, 0.009)]).defaultPrevented).toBe(true)
  })

  it('preserves cancellation without a matching touchstart', async () => {
    const wrapper = createWrapper()
    await nextTick()
    const button = wrapper.get('button').element

    expect(dispatchTouch(button, 'touchmove', [touch(0)]).defaultPrevented).toBe(true)
    dispatchTouch(button, 'touchstart', [touch(0)])
    expect(dispatchTouch(button, 'touchmove', [touch(0, 0, 2)]).defaultPrevented).toBe(true)
  })

  it('allows multitouch without reusing its original single-touch origin', async () => {
    const wrapper = createWrapper()
    await nextTick()
    const button = wrapper.get('button').element

    dispatchTouch(button, 'touchstart', [touch(0)])
    dispatchTouch(button, 'touchstart', [touch(0), touch(20, 0, 2)])
    expect(dispatchTouch(button, 'touchmove', [touch(0), touch(30, 0, 2)]).defaultPrevented).toBe(false)
    dispatchTouch(button, 'touchend', [touch(0)])
    expect(dispatchTouch(button, 'touchmove', [touch(0)]).defaultPrevented).toBe(true)
  })

  it('continues to allow scrolling inside an overflowing ancestor', async () => {
    const wrapper = createWrapper()
    await nextTick()
    const button = wrapper.get('button').element
    const scrollArea = wrapper.element as HTMLElement
    scrollArea.style.overflowY = 'auto'
    Object.defineProperty(scrollArea, 'clientHeight', { value: 20 })
    Object.defineProperty(scrollArea, 'scrollHeight', { value: 100 })

    dispatchTouch(button, 'touchstart', [touch(0)])
    expect(dispatchTouch(button, 'touchmove', [touch(0, 20)]).defaultPrevented).toBe(false)
    expect(dispatchTouch(button, 'touchmove', [touch(0)]).defaultPrevented).toBe(false)
  })

  it.each(['touchend', 'touchcancel'])('resets gesture tracking on %s', async (type) => {
    const wrapper = createWrapper()
    await nextTick()
    const button = wrapper.get('button').element

    dispatchTouch(button, 'touchstart', [touch(0)])
    dispatchTouch(button, type, [])
    expect(dispatchTouch(button, 'touchmove', [touch(0)]).defaultPrevented).toBe(true)
    dispatchTouch(button, 'touchstart', [touch(0)])
    expect(dispatchTouch(button, 'touchmove', [touch(0)]).defaultPrevented).toBe(false)
  })

  it('removes listeners on unlock and starts a fresh gesture state when relocked', async () => {
    const wrapper = createWrapper()
    await nextTick()
    const button = wrapper.get('button').element

    dispatchTouch(button, 'touchstart', [touch(0)])
    wrapper.vm.locked = false
    await nextTick()
    expect(dispatchTouch(button, 'touchmove', [touch(20)]).defaultPrevented).toBe(false)
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.pointerEvents).toBe('')

    wrapper.vm.locked = true
    await nextTick()
    expect(dispatchTouch(button, 'touchmove', [touch(0)]).defaultPrevented).toBe(true)

    wrapper.unmount()
    await nextTick()
    expect(dispatchTouch(document.body, 'touchmove', [touch(20)]).defaultPrevented).toBe(false)
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.pointerEvents).toBe('')
  })

  it('retains the gesture and scroll lock until the final owner unlocks', async () => {
    const first = createWrapper()
    const second = createWrapper()
    await nextTick()
    const button = second.get('button').element

    dispatchTouch(button, 'touchstart', [touch(0)])
    first.vm.locked = false
    await nextTick()
    expect(dispatchTouch(button, 'touchmove', [touch(0)]).defaultPrevented).toBe(false)
    expect(dispatchTouch(button, 'touchmove', [touch(20)]).defaultPrevented).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')

    second.vm.locked = false
    await nextTick()
    expect(dispatchTouch(document.body, 'touchmove', [touch(20)]).defaultPrevented).toBe(false)
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.pointerEvents).toBe('')
  })
})
