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
    const cssVarTarget = isBody ? document.documentElement : el
    cssVarTarget.style.removeProperty('--scrollbar-width')
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
    const defaultConfig = { padding: basePadding + verticalScrollbarWidth, margin: 0 }

    const config = context.scrollBody?.value
      ? typeof context.scrollBody.value === 'object'
        ? defu({
            padding: context.scrollBody.value.padding === true ? basePadding + verticalScrollbarWidth : context.scrollBody.value.padding,
            margin: context.scrollBody.value.margin === true ? baseMargin + verticalScrollbarWidth : context.scrollBody.value.margin,
          }, defaultConfig)
        : defaultConfig
      : ({ padding: 0, margin: 0 })

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

export function useScrollLock(
  target?: MaybeRefOrGetter<HTMLElement | null | undefined>,
  initialState = false,
) {
  const id = Math.random().toString(36).substring(2, 7) // just simple random id, need not to be cryptographically secure
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

  // used to release the previously locked element if the target changed, so
  // we never leave a stale element locked.
  let registeredEl: HTMLElement | null = null

  const setLock = (value: boolean) => {
    const el = resolveTarget()
    if (registeredEl && registeredEl !== el)
      stacks.value.get(registeredEl)?.delete(id)
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
      stacks.value.get(registeredEl)?.delete(id)
  })

  return locked
}

export function useBodyScrollLock(initialState?: boolean) {
  return useScrollLock(undefined, initialState)
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
