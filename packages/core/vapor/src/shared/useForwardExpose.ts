// SPIKE: Vapor-safe `useForwardExpose`. `getCurrentInstance()` returns `null` inside a Vapor
// component (3.6: `currentInstance && !currentInstance.vapor ? … : currentRenderingInstance`), so this
// reads Vue's internal `currentInstance` (exported at runtime, `@internal` in the types). A shipped
// version needs a public hook from Vue or an explicit `defineExpose(useForwardExpose().exposed)`.
//
// Vapor caches the expose proxy on first access (`getExposed`), so instead of reassigning
// `instance.exposed` when the forwarded child changes, expose one Proxy that resolves lazily.
import type { ComponentPublicInstance } from 'vue'
import * as vue from 'vue'
import { computed, onMounted, ref } from 'vue'
import { findElement } from '../Primitive'

export function getGenericInstance(): any {
  return (vue as any).currentInstance
}

function toElement(target: any): HTMLElement | undefined {
  if (!target)
    return undefined
  if (target instanceof Element)
    return target as HTMLElement
  const el = target.$el
  return el instanceof Element ? el as HTMLElement : undefined
}

export function useForwardExpose<T extends ComponentPublicInstance>() {
  const instance = getGenericInstance()
  const currentRef = ref<Element | T | null>()
  const currentElement = computed(() => toElement(currentRef.value))

  const local: Record<string, any> = { ...instance?.exposed }
  const resolve = (key: PropertyKey) => {
    if (key === '$el')
      return currentElement.value ?? findElement(instance.block)
    if (key in local)
      return local[key as string]
    const child = currentRef.value as any
    if (child && !(child instanceof Element) && key in child)
      return child[key]
    return instance.props[key]
  }
  const keys = () => [...new Set(['$el', ...Object.keys(local), ...Object.keys(instance.props)])]

  if (instance) {
    instance.exposed = new Proxy({}, {
      get: (_, key) => resolve(key),
      has: (_, key) => key === '$el' || key in local || key in instance.props || (!!currentRef.value && key in (currentRef.value as any)),
      ownKeys: () => keys(),
      getOwnPropertyDescriptor: (_, key) => ({ enumerable: true, configurable: true, value: resolve(key) }),
    })
  }

  // Vapor runs template-ref setters synchronously while rendering, before the block is inserted.
  // VDOM sets refs post-flush, and v2 code relies on that (e.g. `useFormControl` calls
  // `closest('form')` once). Hold the first ref until mount to keep v2 timing.
  let mounted = false
  let pending: Element | T | null | undefined
  onMounted(() => {
    mounted = true
    if (pending !== undefined)
      currentRef.value = pending
    pending = undefined
  })

  function forwardRef(r: Element | T | null) {
    if (!mounted) {
      pending = r
      return
    }
    currentRef.value = r
  }

  return { forwardRef, currentRef, currentElement }
}
