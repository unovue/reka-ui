import type { ReferenceElement } from '@floating-ui/vue'
import { getCurrentInstance, watchPostEffect } from 'vue'
import { injectPopperRootContext } from './PopperRoot.vue'

export interface UsePopperAnchorOptions {
  /** The part's element (its `useForwardElement().currentElement`). */
  element: { readonly value: unknown }
  /** The reference element to position against instead of `element` (the `reference` prop). */
  reference?: () => ReferenceElement | undefined
  /** When `false`, the part is not the anchor (another part is). @defaultValue `true` */
  enabled?: () => boolean
  /**
   * For a part without a `reference` prop of its own that replaced a
   * `<PopperAnchor as-child>` root: a consumer `reference` attr fell through
   * to the wrapper's prop. It is the reference again (over `reference`), and
   * `consumerAttrs($attrs)` leaves it off the element.
   */
  consumerAttrs?: boolean
}

/**
 * A `PopperAnchor`, as a composable: makes the part's own element (or
 * `reference`) the popper's anchor. A part that wrapped its element in
 * `<PopperAnchor as-child>` renders it directly instead; bind `$attrs` under
 * the part's own attrs (`mergeProps($attrs, own)`, `inheritAttrs: false`),
 * the precedence the wrapper gave them.
 *
 * @internal
 * @lifecycle setup
 */
export function usePopperAnchor(options: UsePopperAnchorOptions) {
  // A part that is only sometimes the anchor (a detached trigger) may render
  // outside any popper.
  const rootContext = options.enabled ? injectPopperRootContext(null) : injectPopperRootContext()
  // Read through the instance proxy, which tracks `$attrs`.
  const instance = options.consumerAttrs ? getCurrentInstance() : null
  const reference = instance
    ? () => (instance.proxy!.$attrs.reference as ReferenceElement | undefined) ?? options.reference?.()
    : options.reference
  watchPostEffect(() => {
    if (rootContext && (options.enabled?.() ?? true))
      rootContext.onAnchorChange(reference?.() ?? options.element.value as ReferenceElement | undefined)
  })
  return {
    /** The consumer's attrs without `reference` (see `consumerAttrs`). */
    consumerAttrs: (attrs: Record<string, unknown>): Record<string, unknown> => {
      if (!('reference' in attrs))
        return attrs
      const { reference: _, ...rest } = attrs
      return rest
    },
  }
}
