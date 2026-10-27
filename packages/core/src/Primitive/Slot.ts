import { cloneVNode, Comment, defineComponent, mergeProps } from 'vue'
import { renderSlotFragments } from '@/shared/renderSlotFragments'
import { useForwardElement } from '@/shared/useForwardElement'

export const Slot = defineComponent({
  name: 'PrimitiveSlot',
  inheritAttrs: false,
  setup(_, { attrs, slots, expose }) {
    // Track the element the attrs land on (the first non-comment child) through
    // a ref merged into the cloned child, so `Slot` satisfies the element-first
    // contract itself: a parent ref on `<Slot>` resolves `element` reactively,
    // following `v-if` swaps of the child without any `onUpdated` resync.
    const { forwardRef: setTarget, expose: elementExpose } = useForwardElement()
    expose(elementExpose)

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
      // `mergeRef = true` keeps the child's own template ref alongside ours.
      const cloned = cloneVNode({ ...firstNonCommentChildren, props: {} }, { ...mergedProps, ref: setTarget }, true)

      if (children.length === 1)
        return cloned

      children[firstNonCommentChildrenIndex] = cloned
      return children
    }
  },
})
