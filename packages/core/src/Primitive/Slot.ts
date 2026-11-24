import { cloneVNode, Comment, defineComponent, mergeProps } from 'vue'
import { isPlainTag, renderSlotFragments } from '@/shared'

export const Slot = defineComponent({
  name: 'PrimitiveSlot',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => {
      if (!slots.default)
        return null

      const children = renderSlotFragments(slots.default())
      const firstNonCommentChildrenIndex = children.findIndex(child => child.type !== Comment)
      if (firstNonCommentChildrenIndex === -1)
        return children

      const firstNonCommentChildren = children[firstNonCommentChildrenIndex]

      // Remove props ref from being inferred
      delete firstNonCommentChildren.props?.ref

      // Manually merge props to ensure `firstNonCommentChildren.props`
      // has higher priority than `attrs` and can override `attrs`.
      // Otherwise `cloneVNode(firstNonCommentChildren, attrs)` will
      // prioritize `attrs` and override `firstNonCommentChildren.props`.
      const mergedProps = firstNonCommentChildren.props
        ? mergeProps(attrs, firstNonCommentChildren.props)
        : attrs
      const cloned = cloneVNode({ ...firstNonCommentChildren, props: {} }, mergedProps)
      // A part passes `disabled: false` through when it can't see the element (`disabledAttr`).
      // On a plain tag without the property it would render `disabled="false"`, so drop it there. A
      // custom element keeps it, it may default `disabled` to `true`. `cloneVNode` merged the props
      // into a new object, so this doesn't touch `attrs`
      if (cloned.props!.disabled === false && isPlainTag(cloned.type))
        cloned.props!.disabled = undefined

      if (children.length === 1)
        return cloned

      children[firstNonCommentChildrenIndex] = cloned
      return children
    }
  },
})
