import type { ComponentPublicInstance, Ref } from 'vue'
import { unref } from 'vue'

// Ported from base-ui-vue `packages/core/src/utils/useMergedRefs.ts`, with reka's
// `#text` / `#comment`-root handling added to `resolveRefTarget` (#2808).

/** Disposer a callback ref may return; it runs when the ref is detached (React-19 style). */
export type RefCleanup = () => void

/** Anything `useMergedRefs` can write to: an object ref, a callback ref, or nothing. */
export type MergeableRef<T>
  = | Ref<T | null | undefined>
    | ((el: T | null) => void | RefCleanup)
    | null
    | undefined

/** What Vue hands a template ref: an element, a component's public/expose proxy, or `null`. */
export type RefTarget = Element | ComponentPublicInstance | null | undefined

function isElement(value: unknown): value is Element {
  return typeof Element !== 'undefined' && value instanceof Element
}

/**
 * Unwraps a template-ref value to its DOM element, element-first:
 *
 * 1. a raw `Element` is returned as is;
 * 2. a component that exposes an `element` ref (the reka part contract,
 *    `defineExpose({ element, $el: element })`) resolves to that element —
 *    reading it through the expose proxy is tracked, so a `computed` over this
 *    function follows the child's root swaps;
 * 3. otherwise the component's `$el`. For multi-root (fragment) and text-root
 *    components `$el` is the anchor `#text` / `#comment` node, so the next
 *    element sibling is used instead.
 */
export function resolveRefTarget<T extends Element = HTMLElement>(target: unknown): T | null {
  // Template refs only ever deliver objects (or `null`).
  if (!target || typeof target !== 'object')
    return null

  if (isElement(target))
    return target as unknown as T

  if ('element' in target) {
    const exposed = unref((target as { element: unknown }).element)
    if (isElement(exposed))
      return exposed as unknown as T
  }

  // A `#text` / `#comment` anchor (fragment or text root) is the only kind of
  // `$el` that is not an element; resolve it to the next element sibling.
  const el = '$el' in target ? (target as { $el: CharacterData | Element | null }).$el : null
  return (isElement(el) ? el : el?.nextElementSibling ?? null) as T | null
}

/**
 * Merges object refs and callback refs into one template callback ref.
 *
 * - The value written to every ref is the resolved element (`resolveRefTarget`),
 *   never a component instance.
 * - A callback ref may return a cleanup function; it is called when the ref is
 *   detached instead of calling the callback with `null`.
 * - Inputs are only called on a change of element (attach, swap, detach), not on
 *   every re-render of the owner.
 * - Returns `undefined` when every input is nullish, so Vue skips its ref
 *   bookkeeping entirely (bind it as `:ref="merged"`).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const local = ref<HTMLElement | null>(null)
 * const merged = useMergedRefs(local, el => console.log(el))
 * </script>
 *
 * <template>
 *   <div :ref="merged" />
 * </template>
 * ```
 */
export function useMergedRefs<T extends Element = HTMLElement>(
  ...refs: MergeableRef<T>[]
): ((el: Element | ComponentPublicInstance | null) => void) | undefined {
  if (refs.every(ref => ref == null))
    return undefined

  const cleanups: Array<RefCleanup | void> = []
  let current: T | null = null

  return (value) => {
    const el = resolveRefTarget<T>(value)
    // Vue re-invokes callback refs on every patch of the owner; only a real
    // attach / detach / swap should reach the inputs.
    if (el === current)
      return
    current = el

    refs.forEach((ref, i) => {
      if (typeof ref === 'function') {
        // Dispose the previous registration (detach or swap); without a
        // cleanup, a detach calls the callback with `null` instead.
        const cleanup = cleanups[i]
        cleanups[i] = undefined
        if (cleanup)
          cleanup()
        else if (!el)
          ref(null)
        if (el) {
          const next = ref(el)
          if (typeof next === 'function')
            cleanups[i] = next
        }
      }
      else if (ref) {
        ref.value = el
      }
    })
  }
}
