import type { Slots, VNode } from 'vue'
import { Comment, createBlock, Fragment, openBlock } from 'vue'

// Vue's own values: `SlotFlags.STABLE` on a slots object, `PatchFlags.STABLE_FRAGMENT` and
// `PatchFlags.FULL_PROPS` on a vnode
const STABLE_SLOTS = 1
const STABLE_FRAGMENT = 64
export const FULL_PROPS = 16

interface CompiledSlot {
  (props?: Record<string, unknown>): VNode[]
  /** Set by the template compiler's `withCtx`. */
  _c?: boolean
  /** Whether the slot turns block tracking off while it runs. */
  _d?: boolean
}

/**
 * A vnode with the field Vue keeps its tracked nodes in. It is internal to Vue (`@internal` in its
 * types), and has been the contract between the template compiler and the renderer since 3.0.
 */
export type BlockVNode = VNode & { dynamicChildren?: VNode[] | null }

export interface TrackedSlot {
  /** What the slot returned. */
  children: VNode[]
  /** The nodes of `children` that can change, as Vue tracked them, or `null` when it tracked nothing. */
  dynamicChildren: VNode[] | null
}

/**
 * Calls the default slot the way a compiled `<slot />` does (Vue's `renderSlot`): in an open block,
 * with block tracking left on, so that Vue records which nodes of the slot content can change.
 *
 * A render function that calls `slots.default()` itself, or hands the slot to `h()`, gets the same
 * nodes without that record. Vue then diffs the whole content on every render and updates every
 * child component that has slots, whether or not anything it uses changed.
 *
 * Only for a slot the template compiler marked as stable: its content keeps its structure between
 * renders, which is what the record relies on. Returns `undefined` for any other slot (a
 * hand-written one, a conditional or dynamic one), and the caller renders as before.
 */
export function trackStableSlot(slots: Slots, props?: Record<string, unknown>): TrackedSlot | undefined {
  const slot = slots.default as CompiledSlot | undefined
  if (!slot || !slot._c || (slots as { _?: number })._ !== STABLE_SLOTS)
    return undefined

  let children: VNode[]
  let dynamicChildren: VNode[] | null
  slot._d = false
  openBlock()
  try {
    children = props ? slot(props) : slot()
  }
  finally {
    slot._d = true
    // Vue exports no `closeBlock`. A block node closes the open block and takes what it tracked
    dynamicChildren = (createBlock(Comment) as BlockVNode).dynamicChildren ?? null
  }
  return { children, dynamicChildren }
}

/**
 * The tracked nodes that belong to `target`, the single node `tracked.children` unwraps to (a slot
 * that forwards another slot returns it inside fragments). `null` when `target` is not the only
 * node at every level, or a level is not a stable fragment: Vue then has to diff it in full.
 */
export function dynamicChildrenOf(tracked: TrackedSlot, target: VNode): VNode[] | null {
  let nodes = tracked.children
  let dynamicChildren = tracked.dynamicChildren
  while (dynamicChildren && nodes.length === 1) {
    const node = nodes[0]
    if (node === target)
      return dynamicChildren.filter(child => child !== target)
    if (node.type !== Fragment || !(node.patchFlag > 0 && node.patchFlag & STABLE_FRAGMENT) || !Array.isArray(node.children))
      return null
    nodes = node.children as VNode[]
    dynamicChildren = (node as BlockVNode).dynamicChildren ?? null
  }
  return null
}
