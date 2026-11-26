import type { DefineSetupFnComponent, Slots, VNode, VNodeRef } from 'vue'
import type { PrimitiveHTMLAttributes } from './Primitive'
import { cloneVNode, Comment, defineComponent, getCurrentInstance, mergeProps } from 'vue'
import { ariaDisabledAttr, isPlainTag } from '@/shared/disabledAttr'
import { renderSlotFragments } from '@/shared/renderSlotFragments'
import { useForwardElement } from '@/shared/useForwardElement'

/**
 * The `asChild` render: merges `attrs` into the first non-comment node of the
 * default slot and returns the slot's nodes, with `ref` merged into that node's
 * own template ref. `Slot` and an `asChild` `Primitive` both render through it,
 * so an `asChild` `Primitive` costs one component instance, not two.
 * @internal
 */
export function renderSlotChild(attrs: Record<string, unknown>, slots: Slots, ref: VNodeRef): VNode | VNode[] | null {
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
  // The child's own `ref` prop is overridden below and never deleted: a compiled
  // template hoists and shares the child's props between instances (#1580), and
  // `vnode.ref` already holds that ref with its owner.
  const mergedProps = firstNonCommentChildren.props
    ? mergeProps(attrs, firstNonCommentChildren.props)
    : attrs
  // `mergeRef = true` keeps the child's own template ref alongside ours.
  const cloned = cloneVNode({ ...firstNonCommentChildren, props: {} }, { ...mergedProps, ref }, true)
  // A part passes `disabled: false` through when it can't see the element (`disabledAttr`).
  // On a plain tag without the property it would render `disabled="false"`, so drop it there. A
  // custom element keeps it, it may default `disabled` to `true`. `cloneVNode` merged the props
  // into a new object, so this doesn't touch `attrs`
  const props = cloned.props!
  if (props.disabled === false && isPlainTag(cloned.type))
    props.disabled = undefined
  // The native `disabled` only works on form controls. On any other plain tag expose the state
  // with `aria-disabled`, unless the part or the child already sets one
  const ariaDisabled = ariaDisabledAttr(cloned.type, props)
  if (ariaDisabled)
    props['aria-disabled'] = ariaDisabled

  if (children.length === 1)
    return cloned

  children[firstNonCommentChildrenIndex] = cloned
  return children
}

/** Typed with the HTML attributes it merges into its child, for `strictTemplates`. */
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

    return () => renderSlotChild(attrs, slots, setTarget)
  },
}) as unknown as DefineSetupFnComponent<PrimitiveHTMLAttributes>
