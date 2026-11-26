import type { Slots, VNode } from 'vue'
import { cloneVNode, Comment, defineComponent, getCurrentInstance, mergeProps } from 'vue'
import { ariaDisabledAttr, isPlainTag, renderSlotFragments } from '@/shared'

/**
 * The `asChild` render: merges `attrs` into the first non-comment node of the default slot and
 * returns the slot's nodes. `Slot` and an `asChild` `Primitive` both render through it, so an
 * `asChild` part costs one component instance, not two.
 */
export function renderSlotChild(attrs: Record<string, unknown>, slots: Slots): VNode | VNode[] | null {
  if (!slots.default)
    return null

  const children = renderSlotFragments(slots.default())
  const firstNonCommentChildrenIndex = children.findIndex(child => child.type !== Comment)
  if (firstNonCommentChildrenIndex === -1)
    return children

  const firstNonCommentChildren = children[firstNonCommentChildrenIndex]

  // Manually merge props to ensure `firstNonCommentChildren.props`
  // has higher priority than `attrs` and can override `attrs`.
  // Otherwise `cloneVNode(firstNonCommentChildren, attrs)` will
  // prioritize `attrs` and override `firstNonCommentChildren.props`.
  const mergedProps = firstNonCommentChildren.props
    ? mergeProps(attrs, firstNonCommentChildren.props)
    : attrs
  // `vnode.ref` already holds the child's ref with its owner, so keep `ref` out of the merged
  // props. Drop it from this copy only, never the child's props (a compiled template hoists and
  // shares them, #1580) or `attrs`
  if (mergedProps !== attrs)
    delete mergedProps.ref
  const cloned = cloneVNode({ ...firstNonCommentChildren, props: {} }, mergedProps)
  // A part passes `disabled: false` through when it can't see the element (`disabledAttr`).
  // On a plain tag without the property it would render `disabled="false"`, so drop it there. A
  // custom element keeps it, it may default `disabled` to `true`. `cloneVNode` merged the props
  // into a new object, so this doesn't touch `attrs`
  if (cloned.props!.disabled === false && isPlainTag(cloned.type))
    cloned.props!.disabled = undefined
  // The native `disabled` only works on form controls. On any other plain tag expose the state
  // with `aria-disabled`, unless the part or the child already sets one
  const ariaDisabled = ariaDisabledAttr(cloned.type, cloned.props!)
  if (ariaDisabled)
    cloned.props!['aria-disabled'] = ariaDisabled

  if (children.length === 1)
    return cloned

  children[firstNonCommentChildrenIndex] = cloned
  return children
}

export const Slot = defineComponent({
  name: 'PrimitiveSlot',
  inheritAttrs: false,
  // No setup context and untracked attrs, as in `Primitive`
  setup() {
    const { attrs, slots } = getCurrentInstance()!

    return () => renderSlotChild(attrs, slots)
  },
})
