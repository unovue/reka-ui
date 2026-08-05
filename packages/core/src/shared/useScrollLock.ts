import type { Fn } from '@vueuse/shared'
import type { MaybeRefOrGetter } from 'vue'
import {
  createSharedComposable,
  useEventListener,
} from '@vueuse/core'
import { isClient, isIOS, tryOnBeforeUnmount } from '@vueuse/shared'
import { defu } from 'defu'
import { computed, nextTick, ref, toValue, watch } from 'vue'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'

const initialStyles = new WeakMap<HTMLElement, { overflow: string, paddingRight: string, marginRight: string }>()

/**
 * Shared lock registry for every element that can be scroll-locked.
 *
 * Keyed by element so that locks on different elements never interact:
 * `Map<element, Map<lockId, locked>>`. An element counts as locked while at
 * least one of its ids is `true`, so nested or concurrent consumers stack —
 * the element is only released once the last of them lets go.
 *
 * Styles are applied on the transitions only (first lock arriving, last lock
 * leaving), never per lock. On lock the element's scrollbar width is measured
 * and compensated for; on release its original inline styles are restored.
 *
 * @internal
 */
const useLockStackCount = createSharedComposable(() => {
  // element -> (lockId -> isLocked)
  const stacks = ref<Map<HTMLElement, Map<string, boolean>>>(new Map())
  const stopTouchMoveListeners = new Map<HTMLElement, Fn>()

  const lockedElements = computed(() => {
    const locked = new Set<HTMLElement>()
    for (const [el, ids] of stacks.value) {
      for (const value of ids.values()) {
        if (value) {
          locked.add(el as HTMLElement)
          break
        }
      }
    }
    return locked
  })

  const context = injectConfigProviderContext({
    scrollBody: ref(true),
  })

  const resetStyle = (el: HTMLElement) => {
    const isBody = el === document.body
    const initial = initialStyles.get(el)

    el.style.paddingRight = initial?.paddingRight ?? ''
    el.style.marginRight = initial?.marginRight ?? ''
    if (isBody)
      el.style.pointerEvents = ''
    const cssVarHolder = isBody ? document.documentElement : el
    cssVarHolder.style.removeProperty('--scrollbar-width')
    el.style.overflow = initial?.overflow ?? ''
    isIOS && stopTouchMoveListeners.get(el)?.()

    initialStyles.delete(el)
    stopTouchMoveListeners.delete(el)
  }

  const lockStyle = (el: HTMLElement) => {
    const isBody = el === document.body

    const existing = initialStyles.get(el)
    if (existing) {
      el.style.overflow = existing.overflow
      el.style.paddingRight = existing.paddingRight
      el.style.marginRight = existing.marginRight
    }
    else {
      initialStyles.set(el, {
        overflow: el.style.overflow,
        paddingRight: el.style.paddingRight,
        marginRight: el.style.marginRight,
      })
    }

    const computedStyle = window.getComputedStyle(el)

    const verticalScrollbarWidth = isBody
      ? window.innerWidth - document.documentElement.clientWidth
      : el.offsetWidth - el.clientWidth
        - (Number.parseFloat(computedStyle.borderLeftWidth) || 0)
        - (Number.parseFloat(computedStyle.borderRightWidth) || 0)
    // account for the existing padding and margin values
    const basePadding = Number.parseFloat(computedStyle.paddingRight) || 0
    const baseMargin = Number.parseFloat(computedStyle.marginRight) || 0
    const defaultConfig = { padding: basePadding + verticalScrollbarWidth, margin: baseMargin }

    const config = context.scrollBody?.value
      ? typeof context.scrollBody.value === 'object'
        ? defu({
            padding: context.scrollBody.value.padding === true ? basePadding + verticalScrollbarWidth : context.scrollBody.value.padding,
            margin: context.scrollBody.value.margin === true ? baseMargin + verticalScrollbarWidth : context.scrollBody.value.margin,
          }, defaultConfig)
        : defaultConfig
      : ({ padding: basePadding, margin: baseMargin })

    if (verticalScrollbarWidth > 0) {
      el.style.paddingRight = typeof config.padding === 'number' ? `${config.padding}px` : String(config.padding)
      el.style.marginRight = typeof config.margin === 'number' ? `${config.margin}px` : String(config.margin)
      const cssVarHolder = isBody ? document.documentElement : el
      cssVarHolder.style.setProperty('--scrollbar-width', `${verticalScrollbarWidth}px`)
      el.style.overflow = 'hidden'
    }

    // Safari ignores 'overflow: hidden' only on the body (overscroll effect).
    if (isIOS && isBody) {
      stopTouchMoveListeners.set(el, useEventListener(
        document,
        'touchmove',
        (e: TouchEvent) => preventDefault(e),
        { passive: false },
      ))
    }

    // let dismissibleLayer set previous pointerEvent first
    nextTick(() => {
      if (!lockedElements.value.has(el))
        return
      if (isBody)
        el.style.pointerEvents = 'none'
      el.style.overflow = 'hidden'
    })
  }

  watch(lockedElements, (val, oldVal) => {
    if (!isClient)
      return

    for (const el of val) {
      if (!oldVal?.has(el))
        lockStyle(el)
    }
    if (oldVal) {
      for (const el of oldVal) {
        if (!val.has(el))
          resetStyle(el)
      }
    }
  }, { immediate: true, flush: 'sync' })

  return stacks
})

let lockIdCounter = 0

/**
 * Lock scrolling of an element, compensating for the scrollbar it hides so the
 * content does not reflow.
 *
 * The target is resolved **when `locked` is written**, not reactively: pass a
 * ref or getter and it will be read at that moment. A target that changes while
 * the lock is held keeps the previous element locked until the next write, at
 * which point the old element is released and the new one takes over.
 *
 * Locks stack per element — the element stays locked until every lock on it is
 * released — and each lock is released automatically when its component unmounts.
 *
 * @param target Element to lock, or a ref/getter resolving to one. Omit it to
 * lock the document body.
 * @param initialState Whether the lock starts engaged.
 * @returns A writable `boolean` ref controlling this lock.
 *
 * @example
 * ```ts
 * const container = useTemplateRef('container')
 * const locked = useScrollLock(container)
 * locked.value = isOpen.value
 * ```
 */
export function useScrollLock(
  target?: MaybeRefOrGetter<HTMLElement | null | undefined>,
  initialState = false,
) {
  const id = `scroll-lock-${lockIdCounter++}`
  const stacks = useLockStackCount()

  const resolveTarget = () => {
    const el = toValue(target)
    if (el !== undefined)
      return el
    return isClient ? document.body : null
  }

  const getIds = (el: HTMLElement) => {
    if (!stacks.value.has(el))
      stacks.value.set(el, new Map())
    return stacks.value.get(el)!
  }

  const removeLock = (el: HTMLElement) => {
    const ids = stacks.value.get(el)
    if (!ids)
      return
    ids.delete(id)
    if (ids.size === 0)
      stacks.value.delete(el)
  }

  // used to release the previously locked element if the target changed, so
  // we never leave a stale element locked.
  let registeredEl: HTMLElement | null = null

  const setLock = (value: boolean) => {
    const el = resolveTarget()
    if (registeredEl && registeredEl !== el)
      removeLock(registeredEl)
    registeredEl = el
    if (el)
      getIds(el).set(id, value)
  }

  setLock(initialState)

  const locked = computed({
    get: () => (registeredEl && stacks.value.get(registeredEl)?.get(id)) ?? false,
    set: setLock,
  })

  tryOnBeforeUnmount(() => {
    if (registeredEl)
      removeLock(registeredEl)
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
