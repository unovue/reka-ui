// SPIKE: VueUse 14 decides "am I in a component?" with `getCurrentInstance()`, which is `null` in a
// Vapor component. So `useMounted()` never turns true (reka's Teleport never renders its portal), and
// `tryOnMounted` / `tryOnBeforeUnmount` run immediately or not at all. The Vapor build points reka's
// `@vueuse/core` / `@vueuse/shared` imports at these shims; upstream VueUse needs the same fix.
import { onBeforeUnmount, onMounted, onUnmounted, shallowRef } from 'vue'
import { getGenericInstance } from './useForwardExpose'

export * from '@vueuse/core'

export function useMounted() {
  const isMounted = shallowRef(false)
  if (getGenericInstance())
    onMounted(() => { isMounted.value = true })
  return isMounted
}

export function tryOnMounted(fn: () => void, sync = true) {
  if (getGenericInstance())
    onMounted(fn)
  else if (sync)
    fn()
}

export function tryOnBeforeUnmount(fn: () => void) {
  if (getGenericInstance())
    onBeforeUnmount(fn)
}

export function tryOnUnmounted(fn: () => void) {
  if (getGenericInstance())
    onUnmounted(fn)
}
