import type { VNodeArrayChildren } from 'vue'
import { Comment, Fragment, isVNode } from 'vue'

// =============================================================================
// Slot outlets without a fragment.
//
// A template `<slot />` renders through `renderSlot`, which wraps the content
// in a Fragment: two empty text nodes (its anchors) in the DOM per outlet. A
// part rendered once per calendar cell or per field segment pays that dozens
// of times per instance. Such parts render their root as a vnode instead
// (`<component :is="renderRoot()" />`, which mounts the vnode itself, with no
// extra component) and hand their slot functions straight to the element, so
// the slot content becomes the element's children directly.
// =============================================================================

/**
 * Whether slot output renders anything: Vue's `ensureValidVNode`, the check
 * `<slot>` makes before falling back to its default content. Output that is
 * only comments (a `v-if` that is off) or empty fragments renders the fallback.
 *
 * @internal
 */
export function hasSlotContent(vnodes: VNodeArrayChildren): boolean {
  return vnodes.some((child) => {
    if (!isVNode(child))
      return true
    if (child.type === Comment)
      return false
    if (child.type === Fragment && !hasSlotContent(child.children as VNodeArrayChildren))
      return false
    return true
  })
}
