import type { Ref } from 'vue'
import type { ScrollBodyOption } from './types'
import { isClient, isIOS, tryOnScopeDispose } from '@vueuse/shared'
import { getCurrentInstance, onMounted, ref, watch } from 'vue'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'

// Overflow-based page scroll lock, ported from Base UI's `useScrollLock`
// (mui/base-ui `packages/utils/src/useScrollLock.ts`). It never touches
// `pointer-events` on `<body>` (#2822): outside pointer interaction for modal
// layers is blocked by the `DismissableLayer` internal backdrop instead.
//
// - Locks the element that actually scrolls the viewport (`<html>` when it is
//   its own scroll container, `<body>` otherwise).
// - Compensates for inset scrollbars with `scrollbar-gutter: stable` where
//   the browser supports it, and by pinning `<body>`'s size otherwise. Overlay
//   scrollbars (macOS default, mobile) and iOS only need `overflow: hidden`.
// - One shared, reference-counted lock: nested and stacked overlays hold a
//   share each, and the page is restored, exactly, once the last share goes.
//   Lock and unlock are deferred by a macrotask so a hand-off between two
//   overlays in the same tick never unlocks in between.
// - Waits for a lock that someone else (the page, another library) still holds
//   rather than snapshotting it, so it is never restored as "original".

/** Attribute set on `<html>` while the page is locked with the inset-scrollbar strategy. */
export const SCROLL_LOCKED_ATTRIBUTE = 'data-reka-scroll-locked'

const OVERFLOW_RE = /auto|scroll|overlay|hidden|clip/
const LOCKED_OVERFLOW_RE = /hidden|clip/
const WEBKIT_RE = /AppleWebKit/
const NON_SAFARI_RE = /Chrome|Chromium|CriOS|Edg|Android/

type ScrollBodyConfig = boolean | ScrollBodyOption
type StyleKey = 'overflowX' | 'overflowY' | 'scrollbarGutter' | 'scrollBehavior' | 'position' | 'height' | 'width' | 'boxSizing' | 'paddingRight' | 'marginRight'
interface StyleSnapshot {
  element: HTMLElement
  values: Partial<Record<StyleKey, string>>
  /** Whether the element had a `style` attribute at all, so restoring does not leave an empty `style=""`. */
  hadStyleAttribute: boolean
}

function isOverflowElement(element: Element) {
  const { overflow, overflowX, overflowY, display } = getComputedStyle(element)
  return OVERFLOW_RE.test(overflow + overflowY + overflowX)
    && display !== 'inline' && display !== 'contents'
}

// The viewport's overflow comes from <html> when it establishes its own scroll
// container, and propagates from <body> otherwise. An `overflow` style on the
// other element does not lock the page.
function getViewportScroller(html: HTMLElement, body: HTMLElement) {
  return isOverflowElement(html) ? html : body
}

function isPageScrollLocked(win: Window, html: HTMLElement, body: HTMLElement) {
  return LOCKED_OVERFLOW_RE.test(win.getComputedStyle(getViewportScroller(html, body)).overflowY)
}

function hasInsetScrollbars(doc: Document) {
  const win = doc.defaultView ?? window
  return win.innerWidth - doc.documentElement.clientWidth > 0
}

function isWebKit() {
  if (typeof navigator === 'undefined')
    return false
  const ua = navigator.userAgent
  return WEBKIT_RE.test(ua) && !NON_SAFARI_RE.test(ua)
}

function snapshot(element: HTMLElement, keys: StyleKey[]): StyleSnapshot {
  const values: StyleSnapshot['values'] = {}
  for (const key of keys)
    values[key] = element.style[key]
  return { element, values, hadStyleAttribute: element.hasAttribute('style') }
}

function restoreStyle(snap: StyleSnapshot | undefined) {
  if (!snap)
    return
  Object.assign(snap.element.style, snap.values)
  if (!snap.hadStyleAttribute && !snap.element.getAttribute('style'))
    snap.element.removeAttribute('style')
}

function supportsStableScrollbarGutter(doc: Document) {
  const supported = typeof CSS !== 'undefined' && !!CSS.supports && CSS.supports('scrollbar-gutter', 'stable')
  if (!supported)
    return false

  const html = doc.documentElement
  const scrollContainer = getViewportScroller(html, doc.body)

  const originalOverflowY = scrollContainer.style.overflowY
  const originalGutter = html.style.scrollbarGutter

  html.style.scrollbarGutter = 'stable'
  scrollContainer.style.overflowY = 'scroll'
  const before = scrollContainer.offsetWidth
  scrollContainer.style.overflowY = 'hidden'
  const after = scrollContainer.offsetWidth

  scrollContainer.style.overflowY = originalOverflowY
  html.style.scrollbarGutter = originalGutter

  return before === after
}

/** Overlay scrollbars and iOS: hiding the overflow is enough, there is nothing to compensate. */
function preventScrollOverlayScrollbars(doc: Document) {
  // Lock <html> when it carries the `overflow`, since a lock on <body> would
  // have no effect; lock <body> when it does (e.g. `overflow-x: hidden`), as
  // sticky elements shift otherwise.
  const elementToLock = getViewportScroller(doc.documentElement, doc.body)
  const original = snapshot(elementToLock, ['overflowY', 'overflowX'])

  Object.assign(elementToLock.style, { overflowY: 'hidden', overflowX: 'hidden' })

  return () => {
    restoreStyle(original)
  }
}

/**
 * Explicit `ConfigProvider` `scrollBody: { padding, margin }` compensation: hide
 * the overflow and offset `<body>` by the given amounts (`true` = the measured
 * scrollbar width). Kept as the escape hatch for layouts that relied on it.
 */
function preventScrollWithBodyOffset(doc: Document, option: ScrollBodyOption) {
  const win = doc.defaultView ?? window
  const body = doc.body
  const scrollbarWidth = Math.max(0, win.innerWidth - doc.documentElement.clientWidth)
  const toCss = (value: boolean | number | string | undefined, fallback: number) => {
    const resolved = value === undefined ? fallback : value === true ? scrollbarWidth : value === false ? 0 : value
    return typeof resolved === 'number' ? `${resolved}px` : resolved
  }

  const original = snapshot(body, ['paddingRight', 'marginRight'])
  const restoreOverflow = preventScrollOverlayScrollbars(doc)
  body.style.paddingRight = toCss(option.padding, scrollbarWidth)
  body.style.marginRight = toCss(option.margin, 0)

  return () => {
    restoreOverflow()
    restoreStyle(original)
  }
}

/** Inset (classic) scrollbars: keep the gutter so nothing shifts when the scrollbar disappears. */
function preventScrollInsetScrollbars(doc: Document) {
  const html = doc.documentElement
  const body = doc.body
  const win = doc.defaultView ?? window

  let scrollTop = 0
  let scrollLeft = 0
  let updateGutterOnly = false
  let originalHtml: StyleSnapshot | undefined
  let originalBody: StyleSnapshot | undefined
  let resizeFrame = 0

  // Pinch-zoom in Safari causes a shift. Don't lock scroll while pinch-zoomed.
  if (isWebKit() && (win.visualViewport?.scale ?? 1) !== 1)
    return () => {}

  function lockScroll() {
    /* DOM reads */
    const htmlStyles = win.getComputedStyle(html)
    const bodyStyles = win.getComputedStyle(body)
    const hasBothEdges = (htmlStyles.scrollbarGutter || '').includes('both-edges')
    const scrollbarGutterValue = hasBothEdges ? 'stable both-edges' : 'stable'

    scrollTop = html.scrollTop
    scrollLeft = html.scrollLeft

    originalHtml = snapshot(html, ['scrollbarGutter', 'overflowY', 'overflowX', 'scrollBehavior'])
    originalBody = snapshot(body, ['position', 'height', 'width', 'boxSizing', 'overflowY', 'overflowX', 'scrollBehavior'])

    const isScrollableY = html.scrollHeight > html.clientHeight
    const isScrollableX = html.scrollWidth > html.clientWidth
    const hasConstantOverflowY = htmlStyles.overflowY === 'scroll' || bodyStyles.overflowY === 'scroll'
    const hasConstantOverflowX = htmlStyles.overflowX === 'scroll' || bodyStyles.overflowX === 'scroll'

    // Values can be negative in Firefox
    const scrollbarWidth = Math.max(0, win.innerWidth - body.clientWidth)
    const scrollbarHeight = Math.max(0, win.innerHeight - body.clientHeight)

    // Avoid a shift caused by the default <body> margin.
    const marginY = (Number.parseFloat(bodyStyles.marginTop) || 0) + (Number.parseFloat(bodyStyles.marginBottom) || 0)
    const marginX = (Number.parseFloat(bodyStyles.marginLeft) || 0) + (Number.parseFloat(bodyStyles.marginRight) || 0)
    const elementToLock = getViewportScroller(html, body)

    updateGutterOnly = supportsStableScrollbarGutter(doc)

    /* DOM writes: do not read the DOM past this point */
    if (updateGutterOnly) {
      html.style.scrollbarGutter = scrollbarGutterValue
      elementToLock.style.overflowY = 'hidden'
      elementToLock.style.overflowX = 'hidden'
      return
    }

    Object.assign(html.style, {
      scrollbarGutter: scrollbarGutterValue,
      overflowY: 'hidden',
      overflowX: 'hidden',
    })
    if (isScrollableY || hasConstantOverflowY)
      html.style.overflowY = 'scroll'
    if (isScrollableX || hasConstantOverflowX)
      html.style.overflowX = 'scroll'

    Object.assign(body.style, {
      position: 'relative',
      height: marginY || scrollbarHeight ? `calc(100dvh - ${marginY + scrollbarHeight}px)` : '100dvh',
      width: marginX || scrollbarWidth ? `calc(100vw - ${marginX + scrollbarWidth}px)` : '100vw',
      boxSizing: 'border-box',
      overflowY: 'hidden',
      overflowX: 'hidden',
      scrollBehavior: 'unset',
    })

    body.scrollTop = scrollTop
    body.scrollLeft = scrollLeft
    html.setAttribute(SCROLL_LOCKED_ATTRIBUTE, '')
    html.style.scrollBehavior = 'unset'
  }

  function cleanup() {
    // `overflowY`/`overflowX` touched by the gutter-only path are restored by
    // `originalHtml` / `originalBody`, whichever element was locked.
    restoreStyle(originalHtml)
    restoreStyle(originalBody)

    if (!updateGutterOnly) {
      html.scrollTop = scrollTop
      html.scrollLeft = scrollLeft
      html.removeAttribute(SCROLL_LOCKED_ATTRIBUTE)
    }
  }

  function handleResize() {
    cleanup()
    cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(lockScroll)
  }

  lockScroll()
  win.addEventListener('resize', handleResize)

  return () => {
    cancelAnimationFrame(resizeFrame)
    cleanup()
    win.removeEventListener('resize', handleResize)
  }
}

class ScrollLocker {
  lockCount = 0
  restore: (() => void) | null = null
  private lockTimer: ReturnType<typeof setTimeout> | undefined
  private unlockTimer: ReturnType<typeof setTimeout> | undefined
  private config: () => ScrollBodyConfig = () => true

  acquire(config: () => ScrollBodyConfig) {
    this.lockCount += 1
    if (this.lockCount === 1 && this.restore === null) {
      this.config = config
      clearTimeout(this.lockTimer)
      this.lockTimer = setTimeout(() => this.lock(), 0)
    }
    let released = false
    return () => {
      if (released)
        return
      released = true
      this.release()
    }
  }

  private release() {
    this.lockCount -= 1
    if (this.lockCount === 0 && this.restore) {
      clearTimeout(this.unlockTimer)
      this.unlockTimer = setTimeout(() => this.unlock(), 0)
    }
  }

  private unlock() {
    if (this.lockCount === 0 && this.restore) {
      this.restore()
      this.restore = null
    }
  }

  private lock() {
    if (this.lockCount === 0 || this.restore !== null)
      return

    const doc = document
    const html = doc.documentElement
    const body = doc.body
    const win = doc.defaultView ?? window

    // The page is already locked, by the site author or by another library's
    // overlay that has not cleaned up yet. Wait for that lock to clear before
    // taking over; snapshotting now would restore the locked state later.
    if (isPageScrollLocked(win, html, body)) {
      const observer = new win.MutationObserver(() => {
        if (isPageScrollLocked(win, html, body))
          return
        observer.disconnect()
        this.restore = null
        this.lock()
      })
      // Locks are applied through inline styles, classes or attributes paired
      // with a stylesheet, so watch every attribute.
      observer.observe(html, { attributes: true })
      observer.observe(body, { attributes: true })
      this.restore = () => observer.disconnect()
      return
    }

    const config = this.config()
    if (typeof config === 'object') {
      this.restore = preventScrollWithBodyOffset(doc, config)
      return
    }

    // On iOS the navbar, focused text fields and exit animations misbehave
    // with anything beyond `overflow: hidden`, so iOS takes the overlay path.
    const hasOverlayScrollbars = isIOS || !config || !hasInsetScrollbars(doc)
    this.restore = hasOverlayScrollbars
      ? preventScrollOverlayScrollbars(doc)
      : preventScrollInsetScrollbars(doc)
  }

  /** Test-only: drop every share and restore the page immediately. */
  reset() {
    clearTimeout(this.lockTimer)
    clearTimeout(this.unlockTimer)
    this.lockCount = 0
    this.restore?.()
    this.restore = null
  }
}

const SCROLL_LOCKER = new ScrollLocker()

/** Test-only: release every scroll lock share and restore the page styles. */
export function resetBodyScrollLock() {
  SCROLL_LOCKER.reset()
}

/**
 * Locks page scroll while the returned ref is `true`. Every call holds its own
 * share of one shared lock; the page is restored once the last share releases
 * (on `false` or when the calling scope is disposed).
 *
 * The lock is only taken once the calling component has mounted, so a server
 * render or a component that unmounts before it mounts never touches the page.
 *
 * Behaviour follows `ConfigProvider`'s `scrollBody`: `true` (default) keeps the
 * layout stable (`scrollbar-gutter: stable`, or pinning `<body>`'s size where
 * that is unsupported), `false` only hides the overflow, and
 * `{ padding, margin }` offsets `<body>` by the given amounts.
 */
export function useBodyScrollLock(initialState?: boolean): Ref<boolean> {
  const locked = ref(initialState ?? false)
  const instance = getCurrentInstance()
  const context = instance
    ? injectConfigProviderContext({ scrollBody: ref(true) })
    : { scrollBody: ref(true) }

  if (!isClient)
    return locked

  const mounted = ref(!instance || instance.isMounted)
  if (!mounted.value)
    onMounted(() => mounted.value = true)

  let release: (() => void) | null = null
  const stop = watch(() => locked.value && mounted.value, (active) => {
    if (active && !release) {
      release = SCROLL_LOCKER.acquire(() => context.scrollBody?.value ?? true)
    }
    else if (!active && release) {
      release()
      release = null
    }
  }, { immediate: true, flush: 'sync' })

  tryOnScopeDispose(() => {
    stop()
    release?.()
    release = null
  })

  return locked
}
