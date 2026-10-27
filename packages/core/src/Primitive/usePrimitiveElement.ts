import type { ComponentPublicInstance, ComputedRef, ShallowRef } from 'vue'
import type { ElementExpose } from '../shared/useForwardElement'
// Direct relative import (not the `@/shared` barrel) to avoid a Primitive ↔ shared cycle.
import { useForwardElement } from '../shared/useForwardElement'

export interface UsePrimitiveElementReturn<T> {
  /** Template ref target — bind with `ref="primitiveElement"`. */
  primitiveElement: ShallowRef<T | undefined>
  /** The resolved DOM element (text/comment-root aware, reactive through conforming children). */
  currentElement: ComputedRef<HTMLElement>
  /** Ready-made element-first expose object: `defineExpose(expose)`. */
  expose: ElementExpose<HTMLElement>
}

/**
 * Object-ref flavour of `useForwardElement`, for parts that bind
 * `ref="primitiveElement"` and also call the bound child's exposed methods.
 * The ref may hold a component's expose proxy (resolved element-first:
 * `element`, then `$el`) or a raw Element.
 */
export function usePrimitiveElement<T extends ComponentPublicInstance>(): UsePrimitiveElementReturn<T> {
  const { currentRef, currentElement, expose } = useForwardElement()
  return {
    primitiveElement: currentRef as ShallowRef<T | undefined>,
    currentElement,
    expose,
  }
}
