// Vapor `useForwardElement`. Swapped in for `src/shared/useForwardElement.ts` by `vapor/plugins.mjs`.
//
// The VDOM version links a part to its owner through `instance.vnode.ref` and builds Vue's expose
// proxy by hand, neither of which a Vapor instance has. The contract is the same: `forwardRef` is
// the callback ref bound on the part's root, `element` resolves the DOM element (element-first
// through a child part's `element`, tracked, so it follows the child's root swaps) and `expose` is
// `{ element, $el }`.
import type { ComponentPublicInstance, ComputedRef, Ref, ShallowRef } from 'vue'
import type { MergeableRef } from '@/shared/useMergedRefs'
import { computed, onMounted, onScopeDispose, shallowRef, watch } from 'vue'
import { resolveRefTarget, useMergedRefs } from '@/shared/useMergedRefs'
import { findElement, getGenericInstance } from './internals'

export interface ElementExpose<E extends Element = HTMLElement> {
  element: Readonly<Ref<E | null>>
  readonly $el: E | Node | null
}

export interface UseForwardElementReturn<E extends Element = HTMLElement> {
  forwardRef: (el: Element | ComponentPublicInstance | null) => void
  currentRef: ShallowRef<unknown>
  element: ComputedRef<E | null>
  currentElement: ComputedRef<E>
  expose: ElementExpose<E>
}

function exposeOf<E extends Element>(element: Readonly<Ref<E | null>>): ElementExpose<E> {
  const instance = getGenericInstance()
  return {
    element,
    get $el() {
      return element.value ?? (instance ? findElement(instance.block) : null)
    },
  }
}

/** The `{ element, $el }` expose object over an element ref. */
export function createElementExpose<E extends Element = HTMLElement>(element: Readonly<Ref<E | null>>): ElementExpose<E> {
  return exposeOf(element)
}

/** Adds a part's documented methods/state to its element expose object (accessors stay accessors). */
export function mergeExpose<T extends ElementExpose<any>, X extends object>(expose: T, extra: X): T & X {
  return Object.defineProperties(expose, Object.getOwnPropertyDescriptors(extra)) as T & X
}

export function useForwardElement<E extends Element = HTMLElement>(...refs: MergeableRef<E>[]): UseForwardElementReturn<E> {
  const currentRef = shallowRef<unknown>(null)
  const element = computed(() => resolveRefTarget<E>(currentRef.value))

  const merged = useMergedRefs<E>(...refs)
  if (merged) {
    watch(element, el => merged(el), { flush: 'sync' })
    onScopeDispose(() => merged(null))
  }

  // Vapor sets template refs while it renders, before the block is inserted; VDOM sets them after
  // the render, and reka code relies on that (`closest('form')` once, focus on mount). Hold the
  // first ref until mount to keep the VDOM timing.
  let mounted = !getGenericInstance()
  let pending: unknown
  if (!mounted) {
    onMounted(() => {
      mounted = true
      if (pending !== undefined)
        currentRef.value = pending
      pending = undefined
    })
  }

  function forwardRef(el: Element | ComponentPublicInstance | null) {
    if (!mounted) {
      pending = el
      return
    }
    currentRef.value = el
  }

  return {
    forwardRef,
    currentRef,
    element,
    currentElement: element as ComputedRef<E>,
    expose: exposeOf<E>(element),
  }
}
