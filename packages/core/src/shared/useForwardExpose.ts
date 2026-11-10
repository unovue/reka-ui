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
    // $el could be text/comment for non-single root normal or text root, thus we retrieve the nextElementSibling
    return currentRef.value
      && '$el' in currentRef.value
      && ['#text', '#comment'].includes(currentRef.value.$el.nodeName)
      ? currentRef.value.$el.nextElementSibling as HTMLElement
      : unrefElement(currentRef as unknown as MaybeElement) as HTMLElement
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

  // Fall back to the root element when no ref is forwarded.
  Object.defineProperty(ret, '$el', {
    enumerable: true,
    configurable: true,
    get: () => {
      const ref = currentRef.value
      return ref ? (ref instanceof Element ? ref : ref.$el) : instance.vnode.el
    },
  })
  instance.exposed = ret

  function forwardRef(ref: Element | T | null) {
    // A wrapped null element is still a ref clear.
    currentRef.value = ref && '$el' in ref && !ref.$el ? null : ref

    if (!ref || !currentRef.value) {
      instance.exposed = ret
      // Drop the cached element even if currentElement is no longer read.
      void currentElement.value
      return
    }

    // ref not is Element
    // and `useForwardExpose.test.ts > useForwardRef > should forward plain DOM element ref - 2` Passing in `$el`
    if (!(ref instanceof Element) && !Object.hasOwn(ref, '$el')) {
      // Retrieves the `exposed` data that has not been unwrapped by `vue` from `$.exposed`.
      const childExposed = ref.$.exposed
      const merged = Object.defineProperties({}, Object.getOwnPropertyDescriptors(ret))

      for (const key in childExposed) {
        Object.defineProperty(merged, key, {
          enumerable: true,
          configurable: true,
          get: () => {
            const forwarded = currentRef.value
            return forwarded instanceof Element ? undefined : forwarded?.$?.exposed?.[key]
          },
        })
      }

      instance.exposed = merged
    }
  }

  return { forwardRef, currentRef, currentElement }
}
