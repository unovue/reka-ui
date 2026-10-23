import type { Fn } from '@vueuse/shared'
import {
  createSharedComposable,
  useEventListener,
} from '@vueuse/core'
import { isClient, isIOS, tryOnBeforeUnmount } from '@vueuse/shared'
import { defu } from 'defu'
import { computed, nextTick, ref, watch } from 'vue'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'
import { acquireBodyPointerEvents, releaseBodyPointerEvents } from './bodyPointerEvents'

// The whole lock stack holds a single share of the body pointer-events owner.
const pointerEventsOwner = Symbol('useBodyScrollLock')

// Read the padding the page actually renders with, as pixels. Inline values are
// not enough: a stylesheet rule such as `body { padding-right: 40px }` (or a
// non-px unit like `2rem`) never shows up in `document.body.style`, so the gap
// is computed from the resolved style instead (#2800).
function getComputedPixelPadding(): number {
  if (!isClient)
    return 0
  const computed = Number.parseFloat(getComputedStyle(document.body).paddingRight)
  return Number.isFinite(computed) ? computed : 0
}

const useBodyLockStackCount = createSharedComposable(() => {
  const map = ref<Map<string, boolean>>(new Map())
  const initialOverflow = ref<string | undefined>()
  // The body styles we overwrite while locked. They are kept verbatim so they can
  // be restored on release instead of being erased (#2800). The scrollbar gap is
  // *added* to the existing padding so a pre-existing `padding-right` survives the
  // lock instead of being replaced by the scrollbar width.
  const initialBodyStyle = ref<{
    paddingRight: string
    marginRight: string
  } | undefined>()
  // The rendered padding-right (px) at lock time. Kept separately from the inline
  // value above because a stylesheet-set padding is invisible to `body.style`,
  // yet it still collapses towards the scrollbar gap while locked (#2800).
  const initialComputedPaddingRight = ref<number | undefined>()

  const locked = computed(() => {
    for (const value of map.value.values()) {
      if (value)
        return true
    }
    return false
  })

  const context = injectConfigProviderContext({
    scrollBody: ref(true),
  })

  let stopTouchMoveListener: Fn | null = null

  const resetBodyStyle = () => {
    document.body.style.paddingRight = initialBodyStyle.value?.paddingRight ?? ''
    document.body.style.marginRight = initialBodyStyle.value?.marginRight ?? ''
    // Only restored once no `DismissableLayer` still holds it either (#2784)
    releaseBodyPointerEvents(document, pointerEventsOwner)
    document.documentElement.style.removeProperty('--scrollbar-width')
    document.body.style.overflow = initialOverflow.value ?? ''
    isIOS && stopTouchMoveListener?.()

    initialOverflow.value = undefined
    initialBodyStyle.value = undefined
    initialComputedPaddingRight.value = undefined
  }

  watch(locked, (val, oldVal) => {
    if (!isClient)
      return

    if (!val) {
      if (oldVal)
        resetBodyStyle()
      return
    }

    if (initialOverflow.value === undefined)
      initialOverflow.value = document.body.style.overflow

    if (initialBodyStyle.value === undefined) {
      initialBodyStyle.value = {
        paddingRight: document.body.style.paddingRight,
        marginRight: document.body.style.marginRight,
      }
      initialComputedPaddingRight.value = getComputedPixelPadding()
    }

    const verticalScrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const defaultConfig = { padding: verticalScrollbarWidth, margin: 0 }

    const scrollBody = context.scrollBody?.value
    const scrollBodyConfig = typeof scrollBody === 'object' ? scrollBody : undefined

    // The additive/preserving behavior below is the fix for #2800 and only applies
    // to the default `scrollBody: true`. Everything else keeps the documented
    // literal semantics: `false` sets no padding/margin at all, and an explicit
    // `ScrollBodyOption` is applied verbatim so `{ padding: 0 }` really means `0px`
    // (the scrollbar-gap value must not be inferred by comparing numbers, which is
    // ambiguous when an explicit value equals the scrollbar width).
    const isDefaultScrollBody = scrollBody === true

    const config = context.scrollBody?.value
      ? typeof context.scrollBody.value === 'object'
        ? defu({
            padding: context.scrollBody.value.padding === true ? verticalScrollbarWidth : context.scrollBody.value.padding,
            margin: context.scrollBody.value.margin === true ? verticalScrollbarWidth : context.scrollBody.value.margin,
          }, defaultConfig)
        : defaultConfig
      : ({ padding: 0, margin: 0 })

    if (verticalScrollbarWidth > 0) {
      // Add the scrollbar gap to the padding the page already renders with, so the
      // page does not shift and the pre-existing padding survives the lock (#2800).
      // The gap is read from the resolved style, because a stylesheet rule or a
      // non-px unit never shows up in `document.body.style`.
      const padding = isDefaultScrollBody
        ? (initialComputedPaddingRight.value ?? 0) + verticalScrollbarWidth
        : config.padding

      // Same idea for the margin: the default `margin: 0` only exists so the
      // scrollbar gap is not double-compensated. In the default case the page's own
      // margin-right is kept instead of being wiped to `0px` (#2800); an explicit
      // `scrollBody.margin` (including an explicit `0`) is honored as written.
      const existingMargin = initialBodyStyle.value.marginRight
      const existingMarginPx = Number.parseFloat(existingMargin)
      const margin = isDefaultScrollBody && config.margin === 0
        && Number.isFinite(existingMarginPx) && existingMarginPx !== 0
        ? existingMargin
        : config.margin

      document.body.style.paddingRight = typeof padding === 'number' ? `${padding}px` : String(padding)
      document.body.style.marginRight = typeof margin === 'number' ? `${margin}px` : String(margin)
      document.documentElement.style.setProperty('--scrollbar-width', `${verticalScrollbarWidth}px`)
      document.body.style.overflow = 'hidden'
    }

    if (isIOS) {
      stopTouchMoveListener = useEventListener(
        document,
        'touchmove',
        (e: TouchEvent) => preventDefault(e),
        { passive: false },
      )
    }

    nextTick(() => {
      if (!locked.value)
        return
      acquireBodyPointerEvents(document, pointerEventsOwner)
      document.body.style.overflow = 'hidden'
    })
  }, { immediate: true, flush: 'sync' })

  return map
})

export function useBodyScrollLock(initialState?: boolean | undefined) {
  const id = Math.random().toString(36).substring(2, 7) // just simple random id, need not to be cryptographically secure
  const map = useBodyLockStackCount()

  map.value.set(id, initialState ?? false)

  const locked = computed({
    get: () => map.value.get(id) ?? false,
    set: value => map.value.set(id, value),
  })

  tryOnBeforeUnmount(() => {
    map.value.delete(id)
  })

  return locked
}

// Adapt from https://github.com/vueuse/vueuse/blob/main/packages/core/useScrollLock/index.ts#L28C10-L28C24
function checkOverflowScroll(ele: Element): boolean {
  const style = window.getComputedStyle(ele)
  if (
    style.overflowX === 'scroll'
    || style.overflowY === 'scroll'
    || (style.overflowX === 'auto' && ele.clientWidth < ele.scrollWidth)
    || (style.overflowY === 'auto' && ele.clientHeight < ele.scrollHeight)
  ) {
    return true
  }
  else {
    const parent = ele.parentNode

    if (!(parent instanceof Element) || parent.tagName === 'BODY')
      return false

    return checkOverflowScroll(parent)
  }
}

function preventDefault(rawEvent: TouchEvent): boolean {
  const e = rawEvent || window.event

  const _target = e.target

  // Do not prevent if element or parentNodes have overflow: scroll set.
  if (_target instanceof Element && checkOverflowScroll(_target))
    return false

  // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).
  if (e.touches.length > 1)
    return true

  if (e.preventDefault && e.cancelable)
    e.preventDefault()

  return false
}
