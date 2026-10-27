import { renderToString } from '@vue/server-renderer'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue'
import { ConfigProvider } from '@/ConfigProvider'
import { sleep } from '@/test'
import { resetBodyScrollLock, SCROLL_LOCKED_ATTRIBUTE, useBodyScrollLock } from './useBodyScrollLock'

// `isIOS` is read when a lock is taken; a module-level flag (not `vi.hoisted`)
// keeps the mock stable under the coverage run.
let mockIsIOS = false
vi.mock('@vueuse/shared', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@vueuse/shared')>()
  return {
    ...mod,
    get isIOS() {
      return mockIsIOS
    },
  }
})

const html = document.documentElement
const body = document.body

/** The lock (and unlock) is applied a macrotask after the share changes. */
const flush = () => sleep(10)
const inlineStyle = (el: HTMLElement) => el.getAttribute('style') ?? ''
const isLocked = () => getComputedStyle(body).overflowY === 'hidden' || getComputedStyle(html).overflowY === 'hidden'

function setViewport({ innerWidth, clientWidth }: { innerWidth: number, clientWidth: number }) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: innerWidth })
  Object.defineProperty(html, 'clientWidth', { configurable: true, value: clientWidth })
  Object.defineProperty(body, 'clientWidth', { configurable: true, value: clientWidth })
}

function createWrapper(initialState: boolean, scrollBody?: any) {
  const Child = defineComponent({
    setup() {
      useBodyScrollLock(initialState)
      return () => h('p', 'Hello, world')
    },
  })
  return mount(defineComponent({
    setup: () => () => scrollBody === undefined ? h(Child) : h(ConfigProvider, { scrollBody }, () => h(Child)),
  }), { attachTo: body })
}

beforeEach(() => {
  // Inset (classic) scrollbars, 15px wide
  setViewport({ innerWidth: 1024, clientWidth: 1009 })
})

afterEach(() => {
  resetBodyScrollLock()
  mockIsIOS = false
  vi.restoreAllMocks()
  html.removeAttribute('style')
  body.removeAttribute('style')
  html.removeAttribute(SCROLL_LOCKED_ATTRIBUTE)
  body.innerHTML = ''
})

describe('useBodyScrollLock', () => {
  it('should lock and unlock the page as the ref toggles', async () => {
    const locked = useBodyScrollLock()
    await flush()
    expect(isLocked()).toBe(false)

    locked.value = true
    await flush()
    expect(isLocked()).toBe(true)

    locked.value = false
    await flush()
    expect(isLocked()).toBe(false)
  })

  it('should never touch body pointer-events (#2822)', async () => {
    const locked = useBodyScrollLock(true)
    await flush()
    expect(isLocked()).toBe(true)
    expect(body.style.pointerEvents).toBe('')

    locked.value = false
    await flush()
    expect(body.style.pointerEvents).toBe('')
  })

  it('should lock and unlock when mounted and unmounted', async () => {
    const wrapper = createWrapper(true)
    await flush()
    expect(isLocked()).toBe(true)

    wrapper.unmount()
    await flush()
    expect(isLocked()).toBe(false)
  })

  it('should only unlock once every nested lock is released', async () => {
    const l1 = createWrapper(true)
    const l2 = createWrapper(true)
    await flush()
    expect(isLocked()).toBe(true)

    l1.unmount()
    await flush()
    expect(isLocked()).toBe(true)

    l2.unmount()
    await flush()
    expect(isLocked()).toBe(false)
  })

  it('should keep the page locked through a same-tick hand-off between two locks', async () => {
    const first = useBodyScrollLock(true)
    await flush()
    const writes = vi.fn()
    const observer = new MutationObserver(writes)
    observer.observe(html, { attributes: true })
    observer.observe(body, { attributes: true })

    // e.g. a modal popover closes and a dialog opens from it in one tick
    first.value = false
    const second = useBodyScrollLock(true)
    await flush()
    observer.disconnect()
    expect(isLocked()).toBe(true)
    expect(writes).not.toHaveBeenCalled()

    second.value = false
    await flush()
    expect(isLocked()).toBe(false)
  })

  it('should not lock at all when toggled on and off in the same tick', async () => {
    const locked = useBodyScrollLock()
    locked.value = true
    locked.value = false
    await flush()
    expect(isLocked()).toBe(false)
    expect(inlineStyle(body)).toBe('')
    expect(inlineStyle(html)).toBe('')
  })

  it('should restore the original inline styles exactly', async () => {
    html.style.scrollBehavior = 'smooth'
    html.style.overflowX = 'clip'
    body.style.overflowY = 'auto'
    body.style.position = 'static'
    body.style.width = '50%'
    const htmlBefore = html.getAttribute('style')
    const bodyBefore = body.getAttribute('style')

    const locked = useBodyScrollLock(true)
    await flush()
    expect(isLocked()).toBe(true)

    locked.value = false
    await flush()
    expect(html.getAttribute('style')).toBe(htmlBefore)
    expect(body.getAttribute('style')).toBe(bodyBefore)
  })

  it('should wait for a lock it does not own instead of restoring it later', async () => {
    // Another library (or the page) already locked scroll
    body.style.overflow = 'hidden'
    const locked = useBodyScrollLock(true)
    await flush()

    // The foreign lock clears while ours is still held: take over
    body.style.overflow = ''
    await flush()
    expect(isLocked()).toBe(true)

    locked.value = false
    await flush()
    // Restored to the unlocked page, not to the foreign `hidden`
    expect(isLocked()).toBe(false)
  })

  describe('scrollbar compensation', () => {
    it('should keep the gutter with `scrollbar-gutter: stable` where it is supported', async () => {
      vi.spyOn(CSS, 'supports').mockReturnValue(true)
      useBodyScrollLock(true)
      await flush()

      expect(html.style.scrollbarGutter).toBe('stable')
      expect(body.style.overflowY).toBe('hidden')
      // No padding/margin compensation and no inherited custom property
      expect(body.style.paddingRight).toBe('')
      expect(body.style.marginRight).toBe('')
      expect(html.style.getPropertyValue('--scrollbar-width')).toBe('')
    })

    it('should pin the body size where `scrollbar-gutter` is unsupported', async () => {
      vi.spyOn(CSS, 'supports').mockReturnValue(false)
      const locked = useBodyScrollLock(true)
      await flush()

      expect(html.hasAttribute(SCROLL_LOCKED_ATTRIBUTE)).toBe(true)
      expect(html.style.overflowY).toBe('hidden')
      expect(body.style.position).toBe('relative')
      expect(body.style.boxSizing).toBe('border-box')
      expect(body.style.width).toBe('calc(100vw - 15px)')
      expect(body.style.paddingRight).toBe('')

      locked.value = false
      await flush()
      expect(html.hasAttribute(SCROLL_LOCKED_ATTRIBUTE)).toBe(false)
      expect(inlineStyle(html)).toBe('')
      expect(inlineStyle(body)).toBe('')
    })

    it('should only hide the overflow with overlay scrollbars', async () => {
      setViewport({ innerWidth: 1024, clientWidth: 1024 })
      useBodyScrollLock(true)
      await flush()

      expect(body.style.overflowY).toBe('hidden')
      expect(body.style.overflowX).toBe('hidden')
      expect(html.style.scrollbarGutter).toBe('')
      expect(body.style.width).toBe('')
    })

    it('should only hide the overflow on iOS', async () => {
      mockIsIOS = true
      useBodyScrollLock(true)
      await flush()

      expect(body.style.overflowY).toBe('hidden')
      expect(html.style.scrollbarGutter).toBe('')
      expect(body.style.width).toBe('')
    })

    it('should not compensate when ConfigProvider `scrollBody` is false', async () => {
      createWrapper(true, false)
      await flush()

      expect(body.style.overflowY).toBe('hidden')
      expect(html.style.scrollbarGutter).toBe('')
      expect(body.style.paddingRight).toBe('')
    })

    it('should offset the body by ConfigProvider `scrollBody` padding and margin', async () => {
      const wrapper = createWrapper(true, { padding: true, margin: 4 })
      await flush()

      expect(body.style.overflowY).toBe('hidden')
      expect(body.style.paddingRight).toBe('15px')
      expect(body.style.marginRight).toBe('4px')

      wrapper.unmount()
      await flush()
      expect(inlineStyle(body)).toBe('')
    })
  })

  describe('sSR', () => {
    it('should not lock while rendering on the server', async () => {
      const App = defineComponent({
        setup() {
          useBodyScrollLock(true)
          return () => h('div', 'ssr')
        },
      })
      await renderToString(createSSRApp(App))
      await flush()
      expect(isLocked()).toBe(false)
      expect(inlineStyle(body)).toBe('')
    })

    it('should not touch the page for a component that unmounts right after mounting', async () => {
      const show = ref(true)
      const Child = defineComponent({
        setup() {
          useBodyScrollLock(true)
          // Unmounted on the next flush, before the deferred lock applies
          show.value = false
          return () => h('p')
        },
      })
      const wrapper = mount(defineComponent({
        setup: () => () => show.value ? h(Child) : null,
      }), { attachTo: body })
      await nextTick()
      await flush()
      expect(isLocked()).toBe(false)
      wrapper.unmount()
    })
  })
})
