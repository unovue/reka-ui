import type { MaybeElement } from '@vueuse/core'
import type { ComponentPublicInstance } from 'vue'
import { unrefElement } from '@vueuse/core'

/**
 * Resolve the element rendered by a template ref target.
 *
 * A component with a fragment, text or comment root has a text/comment node as `$el`.
 * Its next element sibling is used only when it sits before the end anchor of the
 * component's fragment, so an element that merely follows the component is never returned.
 *
 * @param target - The DOM element or component instance a ref points at.
 * @returns The element, or `undefined` when the target renders none.
 */
export function resolveElement(target: Element | ComponentPublicInstance | null | undefined) {
  if (target && '$el' in target && ['#text', '#comment'].includes(target.$el?.nodeName)) {
    let vnode = target.$.subTree
    while (vnode.component)
      vnode = vnode.component.subTree
    const next = target.$el.nextElementSibling as HTMLElement
    // 4: Node.DOCUMENT_POSITION_FOLLOWING
    return (vnode.anchor && next && next.compareDocumentPosition(vnode.anchor as Node) & 4 ? next : undefined) as HTMLElement
  }
  return unrefElement(target as MaybeElement) as HTMLElement
}
