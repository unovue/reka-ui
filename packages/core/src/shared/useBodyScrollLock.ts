import type { Fn } from '@vueuse/shared'
import {
  createSharedComposable,
  useEventListener,
} from '@vueuse/core'
import { isClient, isIOS, tryOnBeforeUnmount } from '@vueuse/shared'
import { computed, nextTick, ref, watch } from 'vue'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'
import { acquireBodyPointerEvents, releaseBodyPointerEvents } from './bodyPointerEvents'

// The whole lock stack holds a single share of the body pointer-events owner.
const pointerEventsOwner = Symbol('useBodyScrollLock')

const useBodyLockStackCount = createSharedComposable(() => {
  const map = ref<Map<string, boolean>>(new Map())
  const initialOverflow = ref<string | undefined>()
  // The inline values the lock overwrites, put back as they were on release.
  let initialInlineStyle: { paddingRight: string, marginRight: string } | undefined

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

  let stopTouchListeners: Fn | null = null

  const resetBodyStyle = () => {
    if (initialInlineStyle) {
      document.body.style.paddingRight = initialInlineStyle.paddingRight
      document.body.style.marginRight = initialInlineStyle.marginRight
      initialInlineStyle = undefined
    }
    // Only restored once no `DismissableLayer` still holds it either (#2784)
    releaseBodyPointerEvents(document, pointerEventsOwner)
    document.documentElement.style.removeProperty('--scrollbar-width')
    document.body.style.overflow = initialOverflow.value ?? ''
    isIOS && stopTouchListeners?.()

    initialOverflow.value = undefined
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

    const verticalScrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    if (verticalScrollbarWidth > 0) {
      const { style } = document.body
      initialInlineStyle ??= { paddingRight: style.paddingRight, marginRight: style.marginRight }

      // `false` leaves both alone. Otherwise the padding makes up for the scrollbar by default,
      // and the margin is only written when asked for. `margin: true` on its own leaves
      // the padding out, so that the scrollbar is made up for once rather than twice.
      const scrollBody = context.scrollBody?.value
      if (scrollBody) {
        const option = typeof scrollBody === 'object' ? scrollBody : {}
        const { padding = option.margin !== true, margin = false } = option
        const computedStyle = getComputedStyle(document.body)
        // `true` adds the scrollbar width to what the body already has; a value is used as written.
        const resolve = (value: boolean | number | string, existing: string) => value === true
          ? `${(Number.parseFloat(existing) || 0) + verticalScrollbarWidth}px`
          : typeof value === 'number' ? `${value}px` : String(value)
        const paddingRight = padding === false ? undefined : resolve(padding, computedStyle.paddingRight)
        const marginRight = margin === false ? undefined : resolve(margin, computedStyle.marginRight)
        if (paddingRight !== undefined)
          style.paddingRight = paddingRight
        if (marginRight !== undefined)
          style.marginRight = marginRight
      }
      document.documentElement.style.setProperty('--scrollbar-width', `${verticalScrollbarWidth}px`)
      document.body.style.overflow = 'hidden'
    }

    if (isIOS) {
      let touchStart: { identifier: number, x: number, y: number } | undefined

      // Only `touchmove` cancels, so gesture tracking stays passive and never delays scrolling.
      const stopTrackingListener = useEventListener(
        document,
        ['touchstart', 'touchend', 'touchcancel'],
        (e: TouchEvent) => {
          const touch = e.touches[0]
          touchStart = e.type === 'touchstart' && e.touches.length === 1
            ? { identifier: touch.identifier, x: touch.clientX, y: touch.clientY }
            : undefined
        },
        { passive: true },
      )

      const stopTouchMoveListener = useEventListener(
        document,
        'touchmove',
        (e: TouchEvent) => {
          const touch = e.touches[0]
          // iOS can report subpixel coordinate noise as a move; cancelling it suppresses the tap's click.
          if (touchStart && e.touches.length === 1 && touch.identifier === touchStart.identifier
            && Math.hypot(touch.clientX - touchStart.x, touch.clientY - touchStart.y) <= 0.01) {
            return
          }

          // Once the gesture moves, returning to its origin must not make it a tap again.
          touchStart = undefined
          preventDefault(e)
        },
        { passive: false },
      )

      stopTouchListeners = () => {
        stopTrackingListener()
        stopTouchMoveListener()
      }
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
