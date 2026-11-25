// SPIKE: VueUse 14 decides "am I in a component?" with `getCurrentInstance()`, which is `null` in a
// Vapor component. So `useMounted()` never turns true (reka's Teleport never renders its portal), and
// `tryOnMounted` / `tryOnBeforeUnmount` run immediately or not at all. The Vapor build points reka's
// `@vueuse/core` / `@vueuse/shared` imports at these shims; upstream VueUse needs the same fix.
import type { MaybeElementRef } from '@vueuse/core'
import { unrefElement } from '@vueuse/core'
import { hasInjectionContext, onBeforeUnmount, onMounted, onUnmounted, onUpdated, shallowRef, watch } from 'vue'
import { findElement } from '../Primitive'
import { getGenericInstance } from './internals'

export * from '@vueuse/core'

export function useMounted() {
  const isMounted = shallowRef(false)
  if (hasInjectionContext())
    onMounted(() => { isMounted.value = true })
  return isMounted
}

export function tryOnMounted(fn: () => void, sync = true) {
  if (hasInjectionContext())
    onMounted(fn)
  else if (sync)
    fn()
}

export function tryOnBeforeUnmount(fn: () => void) {
  if (hasInjectionContext())
    onBeforeUnmount(fn)
}

export function tryOnUnmounted(fn: () => void) {
  if (hasInjectionContext())
    onUnmounted(fn)
}

/**
 * VueUse's `useParentElement` → `useCurrentElement` reads `getCurrentInstance().proxy.$el`, which
 * doesn't exist in Vapor. Resolve the component's first element from its block after mount instead.
 */
export function useParentElement(element?: MaybeElementRef) {
  const instance = getGenericInstance()
  const parent = shallowRef<HTMLElement | SVGElement | null | undefined>()
  const update = () => {
    const el = element ? unrefElement(element) : findElement(instance?.block)
    parent.value = (el as Element | null | undefined)?.parentElement ?? undefined
  }
  if (instance) {
    onMounted(update)
    onUpdated(update)
  }
  if (element)
    watch(() => unrefElement(element), update)
  return parent
}
