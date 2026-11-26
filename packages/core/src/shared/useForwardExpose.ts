import type { ComponentPublicInstance } from 'vue'
// reference: https://github.com/vuejs/rfcs/issues/258#issuecomment-1068697672
import { isClient } from '@vueuse/shared'
import { computed, getCurrentInstance, onUpdated, ref, triggerRef } from 'vue'
import { resolveElement } from './resolveElement'

let warnedDeprecation = false

/**
 * Expose this component's props and a forwarded child's public values and root node.
 *
 * `$el` preserves Vue's native root node. For text and comment roots,
 * `currentElement` resolves the first element inside the forwarded child, or `undefined`.
 *
 * @deprecated since v3 — reka parts no longer use it. Use the element-first
 * contract instead: `const { forwardRef, expose } = useForwardElement()` +
 * `defineExpose(expose)` (exposes `element` and a reactive `$el`), and
 * `useMergedRefs` to merge refs. This legacy implementation still mutates
 * `instance.exposed` (prop getters, `$el`, child-expose chaining) and
 * will be removed in a future major.
 *
 * @returns An object with `forwardRef`, `currentRef`, and `currentElement`.
 */
export function useForwardExpose<T extends ComponentPublicInstance>() {
  const instance = getCurrentInstance()!

  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV !== 'production' && !warnedDeprecation) {
    warnedDeprecation = true
    console.warn('[reka-ui] `useForwardExpose` is deprecated. Use `useForwardElement()` + `defineExpose(expose)` instead. See https://reka-ui.com/docs/utilities/use-forward-expose')
  }

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
    return resolveElement(currentRef.value)
  }

  // Template refs are never set during SSR, so nothing reads `exposed` there.
  // Skip building it to save a getter per prop on every instance.
  if (!isClient) {
    return {
      forwardRef: (ref: Element | T | null) => { currentRef.value = ref },
      currentRef,
      currentElement,
    }
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

  // The component the exposed object was last merged for, and the exposed object it had then
  let mergedRef: T | undefined
  let mergedChildExposed: Record<string, any> | null | undefined
  // The keys that object had then: a child may add or remove a key of its exposed object in place
  let mergedChildKeys: string[] = []

  function hasMergedKeys(childExposed: Record<string, any> | null | undefined) {
    let count = 0
    for (const key in childExposed) {
      if (mergedChildKeys[count++] !== key)
        return false
    }
    return count === mergedChildKeys.length
  }

  /**
   * Set the forwarded ref and merge the child's exposed values.
   *
   * Null refs and wrapped refs without an element clear forwarded state and the
   * cached element so detached content can be collected.
   *
   * Vue calls a function ref on every patch of the node it sits on, so a call with the
   * component that is already forwarded, whose own exposed object has not been replaced and
   * still has the same keys, keeps the merged object instead of building it again.
   *
   * @param ref - The current DOM element, component instance, or null on removal.
   */
  function forwardRef(ref: Element | T | null) {
    if (ref && ref === mergedRef && ref === currentRef.value && ref.$.exposed === mergedChildExposed && ref.$el && hasMergedKeys(mergedChildExposed))
      return

    // A wrapped null element is still a ref clear.
    currentRef.value = ref && '$el' in ref && !ref.$el ? null : ref
    mergedRef = undefined
    mergedChildExposed = undefined
    mergedChildKeys = []

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
      // A child that exposes nothing (a `Primitive`) adds no key, so `ret` already is the merged object
      let merged = ret

      for (const key in childExposed) {
        mergedChildKeys.push(key)
        if (merged === ret)
          merged = Object.defineProperties({}, Object.getOwnPropertyDescriptors(ret))
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
      mergedRef = ref
      mergedChildExposed = childExposed
    }
  }

  return { forwardRef, currentRef, currentElement }
}
