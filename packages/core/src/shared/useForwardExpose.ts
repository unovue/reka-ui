import type { MaybeElement } from '@vueuse/core'
import type { ComponentPublicInstance } from 'vue'
// reference: https://github.com/vuejs/rfcs/issues/258#issuecomment-1068697672
import { unrefElement } from '@vueuse/core'
import { computed, getCurrentInstance, onUpdated, ref, triggerRef } from 'vue'

export function useForwardExpose<T extends ComponentPublicInstance>() {
  const instance = getCurrentInstance()!

  const currentRef = ref<Element | T | null>()
  const currentElement = computed(() => resolveCurrentElement())

  // When using as-child with conditional rendering (v-if/v-else), the underlying
  // DOM element ($el) changes but currentRef (component instance) stays the same.
  // Since $el is not reactive, we sync currentElement after DOM updates.
  onUpdated(() => {
    if (currentElement.value !== resolveCurrentElement()) {
      triggerRef(currentRef)
    }
  })

  function resolveCurrentElement() {
    // $el could be #text/#comment for non-single root normal or text root, thus we
    // try to retrieve the `nextElementSibling`
    const el = currentRef.value
    if (el
      && '$el' in el
      && ['#text', '#comment'].includes(el.$el.nodeName)) {
      // no end anchor, means that it is a singular #text or #comment -> no proper element,
      // so early-return.
      const anchor = el.$?.subTree?.anchor as Node | null
      if (!anchor)
        return undefined

      // accept the next sibling ONLY if it is a part of the component;
      // sibling positioned AFTER the anchor belongs to something else,
      // and should not be returned.
      const nextSibling = el.$el.nextElementSibling as HTMLElement | null
      if (
        nextSibling
        && (nextSibling.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING)
      ) {
        return nextSibling
      }

      return undefined
    }

    return unrefElement(currentRef as unknown as MaybeElement) as HTMLElement | undefined
  }

  // Do give us credit if you reference our code :D
  // localExpose should only be assigned once else will create infinite loop
  const localExpose: Record<string, any> | null = Object.assign({}, instance.exposed)
  const ret: Record<string, any> = {}

  // retrieve props for current instance
  for (const key in instance.props) {
    Object.defineProperty(ret, key, {
      enumerable: true,
      configurable: true,
      get: () => instance.props[key],
    })
  }

  // retrieve default exposed value
  if (Object.keys(localExpose).length > 0) {
    for (const key in localExpose) {
      Object.defineProperty(ret, key, {
        enumerable: true,
        configurable: true,
        get: () => localExpose![key],
      })
    }
  }

  // retrieve original first root element
  Object.defineProperty(ret, '$el', {
    enumerable: true,
    configurable: true,
    get: () => instance.vnode.el,
  })
  instance.exposed = ret

  function forwardRef(ref: Element | T | null) {
    currentRef.value = ref

    if (!ref)
      return

    // retrieve the forwarded element
    Object.defineProperty(ret, '$el', {
      enumerable: true,
      configurable: true,
      get: () => (ref instanceof Element ? ref : ref.$el),
    })

    // ref not is Element
    // and `useForwardExpose.test.ts > useForwardRef > should forward plain DOM element ref - 2` Passing in `$el`
    if (!(ref instanceof Element) && !Object.hasOwn(ref, '$el')) {
      // Retrieves the `exposed` data that has not been unwrapped by `vue` from `$.exposed`.
      const childExposed = ref.$.exposed
      const merged = Object.assign({}, ret)

      for (const key in childExposed) {
        Object.defineProperty(merged, key, {
          enumerable: true,
          configurable: true,
          get: () => childExposed[key],
        })
      }

      instance.exposed = merged
    }
  }

  return { forwardRef, currentRef, currentElement }
}
