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

// The `scrollBody` option the mocked ConfigProvider hands back. Tests flip it to
// exercise an explicit padding/margin override instead of the default gap.
const scrollBodyOption = ref<boolean | { padding?: number | boolean, margin?: number | boolean }>(true)

vi.mock('@/ConfigProvider/ConfigProvider.vue', async () => {
  return {
    injectConfigProviderContext: () => {
      return {
        dir: ref('ltr'),
        scrollBody: scrollBodyOption,
      }
    },
  }
})

describe('useBodyScrollLock', () => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 200 })
  Object.defineProperty(document, 'clientWidth', { writable: true, configurable: true, value: 190 })
  Object.defineProperty(document.documentElement, 'clientWidth', { writable: true, configurable: true, value: 190 })

  beforeEach(() => {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
    document.body.style.marginRight = ''
    scrollBodyOption.value = true
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

  it('should not permanently lock when toggled rapidly in the same tick', async () => {
    const locked = useBodyScrollLock()

    // Lock and immediately unlock in the same synchronous tick
    locked.value = true
    locked.value = false

    await nextTick()
    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.pointerEvents).toBe('')
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

  it('should add the scrollbar gap to the existing padding and restore it afterwards', async () => {
    document.body.style.paddingRight = '40px'
    document.body.style.marginRight = '24px'

    const locked = useBodyScrollLock()
    await nextTick()

    locked.value = true
    await nextTick()
    // The scrollbar gap (10px here) is added on top of the existing padding and
    // the existing margin is left untouched.
    expect(document.body.style.paddingRight).toBe('50px')
    expect(document.body.style.marginRight).toBe('24px')

    locked.value = false
    await nextTick()
    // The original values come back, they are not erased.
    expect(document.body.style.paddingRight).toBe('40px')
    expect(document.body.style.marginRight).toBe('24px')
  })

  it('should respect an explicit padding override even when it equals the scrollbar width', async () => {
    // The resolved value (10) is indistinguishable from the default gap, but this
    // is an explicit override and must replace, not stack, the existing padding.
    document.body.style.paddingRight = '40px'
    scrollBodyOption.value = { padding: 10, margin: 0 }

    const locked = useBodyScrollLock()
    await nextTick()

    locked.value = true
    await nextTick()
    expect(document.body.style.paddingRight).toBe('10px')

    locked.value = false
    await nextTick()
    expect(document.body.style.paddingRight).toBe('40px')
  })

  it('should not set any padding or margin when scrollBody is false', async () => {
    // `scrollBody: false` means "do not touch the body's padding/margin" (see
    // ConfigProvider docs). The scrollbar gap must not leak into this branch.
    document.body.style.paddingRight = '40px'
    document.body.style.marginRight = '24px'
    scrollBodyOption.value = false

    const locked = useBodyScrollLock()
    await nextTick()

    locked.value = true
    await nextTick()
    expect(document.body.style.paddingRight).toBe('0px')
    expect(document.body.style.marginRight).toBe('0px')

    locked.value = false
    await nextTick()
    expect(document.body.style.paddingRight).toBe('40px')
    expect(document.body.style.marginRight).toBe('24px')
  })

  it('should honor an explicit scrollBody.margin of 0', async () => {
    // An explicit `margin: 0` is a real request to zero the margin, so the
    // pre-existing inline margin must not be kept in the non-default branch.
    document.body.style.marginRight = '24px'
    scrollBodyOption.value = { padding: 0, margin: 0 }

    const locked = useBodyScrollLock()
    await nextTick()

    locked.value = true
    await nextTick()
    expect(document.body.style.marginRight).toBe('0px')

    locked.value = false
    await nextTick()
    expect(document.body.style.marginRight).toBe('24px')
  })

  it('should account for stylesheet-set padding, not just inline padding', async () => {
    // A stylesheet rule never shows up in `body.style`, so the gap must be
    // computed from the resolved style (#2800).
    const style = document.createElement('style')
    style.textContent = 'body { padding-right: 40px; }'
    document.head.appendChild(style)

    // Delegate to the real `getComputedStyle` and only override `paddingRight`
    // for the body. Returning a bare object would silently break the moment the
    // lock (or anything else on this path) reads a different property.
    const realGetComputedStyle = window.getComputedStyle.bind(window)
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => {
      const computed = realGetComputedStyle(el)
      if (el !== document.body)
        return computed
      return new Proxy(computed, {
        get: (target, prop) =>
          prop === 'paddingRight' ? '40px' : Reflect.get(target, prop),
      })
    })

    try {
      const locked = useBodyScrollLock()
      await nextTick()

      locked.value = true
      await nextTick()
      expect(document.body.style.paddingRight).toBe('50px')

      locked.value = false
      await nextTick()
      // Nothing inline was set before the lock, so it is cleared again.
      expect(document.body.style.paddingRight).toBe('')
    }
    finally {
      vi.restoreAllMocks()
      style.remove()
    }
  })
})
