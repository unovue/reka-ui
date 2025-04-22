import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useBodyScrollLock } from './useBodyScrollLock'

function createWrapper(initialState: boolean) {
  return mount({
    template: '<p>Hello, world</p>',
    setup() {
      useBodyScrollLock(initialState)
    },
  }, { attachTo: document.body })
}

describe('useBodyScrollLock', () => {
  vi.mock('@/ConfigProvider/ConfigProvider.vue', async () => {
    return {
      injectConfigProviderContext: () => {
        return {
          dir: ref('ltr'),
          scrollBody: ref(true),
        }
      },
    }
  })

  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 200 })
  Object.defineProperty(document, 'clientWidth', { writable: true, configurable: true, value: 190 })
  Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 190 })

  beforeEach(() => {
    document.body.style.overflow = ''
    vi.resetModules()
  })

  it('should lock the body properly', async () => {
    const locked = useBodyScrollLock()
    await nextTick()
    expect(document.body.style.overflow).toBe('')

    locked.value = true
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')

    locked.value = false
    await nextTick()
    expect(document.body.style.overflow).toBe('')
  })

  it('should lock and unlock the body when mounted and unmounted', async () => {
    const wrapper = createWrapper(true)

    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')
    wrapper.unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('should only unlock once all are unmounted', async () => {
    const l1 = createWrapper(true)
    const l2 = createWrapper(true)

    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')

    l1.unmount()
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')

    l2.unmount()
    await nextTick()
    expect(document.body.style.overflow).toBe('')
  })

  it('should only unlock once all are unlocked', async () => {
    const l1 = useBodyScrollLock(true)
    const l2 = useBodyScrollLock(true)

    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')

    l1.value = false
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')

    l2.value = false
    await nextTick()
    expect(document.body.style.overflow).toBe('')
  })

  it('should not automatically lock', async () => {
    useBodyScrollLock()

    await nextTick()
    expect(document.body.style.overflow).toBe('')
  })

  it('should preserve user overflow', async () => {
    document.body.style.overflow = 'scroll'

    const locked = useBodyScrollLock()
    await nextTick()
    expect(document.body.style.overflow).toBe('scroll')

    locked.value = true
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')

    locked.value = false
    await nextTick()
    expect(document.body.style.overflow).toBe('scroll')
  })
})
