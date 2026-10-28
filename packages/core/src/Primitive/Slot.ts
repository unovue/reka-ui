import type { ComponentInternalInstance, VNodeProps } from 'vue'
import { cloneVNode, Comment, defineComponent, getCurrentInstance, mergeProps } from 'vue'
import { renderSlotFragments } from '@/shared/renderSlotFragments'
import { useForwardElement } from '@/shared/useForwardElement'

type ChildProps = (VNodeProps & Record<string, unknown>) | null

// The props the slot child bound itself, before the merge, per `Slot`
// instance and as of its last render.
const childProps = new WeakMap<ComponentInternalInstance, ChildProps>()

/**
 * The props the child of an as-child part (a `Slot` instance) bound itself, as
 * of the last render, or `undefined` when `instance` is not a `Slot`. A part
 * that sets one of its attributes outside the render reads this to leave an
 * attribute the child bound over its own (the child wins the merge).
 */
export function getSlotChildProps(instance: ComponentInternalInstance | null | undefined): ChildProps | undefined {
  return instance ? childProps.get(instance) : undefined
}

export const Slot = defineComponent({
  name: 'PrimitiveSlot',
  inheritAttrs: false,
  // `setup()` only, as in `Primitive`: a setup-context parameter makes Vue
  // allocate a context (with an attrs proxy and an `expose` closure) per
  // instance. The instance holds the same attrs and slots objects.
  setup() {
    const instance = getCurrentInstance()!
    const { attrs, slots } = instance
    // Track the element the attrs land on (the first non-comment child) through
    // a ref merged into the cloned child, so `Slot` satisfies the element-first
    // contract itself: a parent ref on `<Slot>` resolves `element` reactively,
    // following `v-if` swaps of the child without any `onUpdated` resync.
    const { forwardRef: setTarget, expose: elementExpose } = useForwardElement()
    // What the setup context's `expose()` does.
    instance.exposed = elementExpose

    return () => {
      childProps.set(instance, null)
      if (!slots.default)
        return null

      const children = renderSlotFragments(slots.default())
      const firstNonCommentChildrenIndex = children.findIndex(child => child.type !== Comment)
      if (firstNonCommentChildrenIndex === -1)
        return children

      const firstNonCommentChildren = children[firstNonCommentChildrenIndex]
      childProps.set(instance, firstNonCommentChildren.props)

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
