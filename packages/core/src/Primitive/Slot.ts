import { cloneVNode, Comment, defineComponent, mergeProps } from 'vue'
import { renderSlotFragments } from '@/shared'

export const Slot = defineComponent({
  name: 'PrimitiveSlot',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => {
      if (!slots.default)
        return null

      const childrens = renderSlotFragments(slots.default())
      const firstNonCommentChildrenIndex = childrens.findIndex(child => child.type !== Comment)
      if (firstNonCommentChildrenIndex === -1)
        return childrens

      const firstNonCommentChildren = childrens[firstNonCommentChildrenIndex]

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

      if (childrens.length === 1)
        return cloned

      childrens[firstNonCommentChildrenIndex] = cloned
      return childrens
    }
  },
})
