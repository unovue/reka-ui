import type { Slot, VNode, VNodeArrayChildren } from 'vue'
import { Comment, Fragment, nextTick } from 'vue'

// =============================================================================
// Closed popups do nothing (Base UI's `PopoverPortal` returns `null` unless the
// popup is mounted). A family `*Portal` renders nothing until its popup first
// needs to be in the DOM, so a closed popup sets up no `TeleportPrimitive`,
// native `Teleport` (with its anchors in the target), content part or
// `Presence`. Once rendered, the portal stays rendered, so close and reopen,
// exit animations and anything a consumer keeps inside it behave as before.
//
// Only content that renders nothing while closed may be skipped, so the portal
// renders right away whenever its slot holds anything else: an element, text, a
// consumer component, a Vue `<Transition>` (which must see its child mount while
// closed to animate the first open), or a part with `forceMount`.
// =============================================================================

/** Root contexts whose portal is mounting for an open, until the end of that flush. */
const opening = new WeakSet<object>()

/**
 * Whether the popup of `context` is mounting its gated portal for an open right
 * now. Its content parts pass it as `Presence`'s `appear`, so that first open
 * still renders `data-starting-style` like every later one.
 */
export function isPortalOpening(context: object | null | undefined): boolean {
  return !!context && opening.has(context)
}

function isForced(value: unknown): boolean {
  return value === '' || (value !== undefined && value !== null && value !== false)
}

/**
 * Whether `children` (a portal's slot) only holds the family's content `parts`
 * without `forceMount`, or nothing that renders (`v-if` comments, empty
 * fragments), i.e. nothing that would be in the DOM while the popup is closed.
 */
export function hasOnlyGatedContent(children: VNodeArrayChildren | undefined, parts: readonly object[]): boolean {
  if (!children)
    return true
  for (const child of children) {
    if (child == null || typeof child === 'boolean')
      continue
    if (Array.isArray(child)) {
      if (!hasOnlyGatedContent(child, parts))
        return false
      continue
    }
    if (typeof child !== 'object')
      return false
    const vnode = child as VNode
    if (vnode.type === Comment)
      continue
    if (vnode.type === Fragment) {
      if (!hasOnlyGatedContent(vnode.children as VNodeArrayChildren, parts))
        return false
      continue
    }
    if (!parts.includes(vnode.type as object))
      return false
    const props = vnode.props
    if (props && (isForced(props.forceMount) || isForced(props['force-mount'])))
      return false
  }
  return true
}

/**
 * The render-time gate of a family portal. Returns whether the portal renders.
 *
 * - `context`: the Root context the content parts read their open state from.
 *   Without one (a portal outside its Root) the portal is never gated.
 * - `present`: whether the popup needs its content mounted (open, or kept
 *   mounted while closed, e.g. `unmountOnHide: false`).
 * - `parts`: the family's content parts that render nothing while closed.
 *
 * Call the returned function during the portal's render. Until it first returns
 * `true` it reads `present()` and the slot reactively; afterwards it reads
 * nothing, so an open portal does not re-render on open state changes.
 *
 * @lifecycle setup
 */
export function createPortalGate(
  context: object | null | undefined,
  present: () => boolean,
  parts: readonly object[],
): (forceMount: boolean | undefined, slot: Slot | undefined) => boolean {
  let rendered = !context
  let initial = true
  return (forceMount, slot) => {
    if (rendered)
      return true
    const isInitial = initial
    initial = false
    if (forceMount)
      return rendered = true
    if (present()) {
      // Opened after the portal was set up closed: the content parts mount in
      // this flush and treat it as an open, not as an initial render.
      if (!isInitial) {
        opening.add(context!)
        nextTick(() => opening.delete(context!))
      }
      return rendered = true
    }
    return rendered = !hasOnlyGatedContent(slot?.(), parts)
  }
}
