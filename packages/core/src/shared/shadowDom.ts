export function getRootNode(node: Node | null): Document | ShadowRoot {
  const root = node?.getRootNode()
  if (root instanceof ShadowRoot || root instanceof Document)
    return root
  return (node as (Node & { ownerDocument?: Document }) | null)?.ownerDocument ?? document
}

// `composedPath()` only returns a non-empty path while the event is actively
// dispatching — once dispatch finishes (e.g. after an `await`, or once a
// custom event wrapping the original one is dispatched later), it returns `[]`
// and callers would silently fall back to the (possibly retargeted)
// `event.target`. Memoizing per-event means a value resolved once, while the
// real dispatch was still in progress, stays available to any later caller
// holding the same event reference (e.g. `CustomEvent<{ originalEvent }>`
// consumers reading `detail.originalEvent` after the fact).
const composedTargetCache = new WeakMap<Event, HTMLElement | undefined>()

/**
 * The real, non-retargeted target of a composed event (`pointerdown`, `focusin`,
 * `focusout`, `keydown`), regardless of how many shadow boundaries it crossed to
 * reach the listener that received it. Call this synchronously, while the event
 * is still dispatching, for the first (and ideally only) time it matters.
 */
export function getComposedTarget(event: Event): HTMLElement | undefined {
  if (composedTargetCache.has(event))
    return composedTargetCache.get(event)
  const path = event.composedPath?.()
  const target = (path?.[0] ?? event.target) as HTMLElement | undefined
  composedTargetCache.set(event, target)
  return target
}

/**
 * `Element.closest()`, but when nothing matches within the starting node's own
 * shadow tree, continues the search from that tree's host — so it can find a
 * match in an ancestor tree the starting node's shadow root is hosted inside of.
 */
export function closestAcrossShadowBoundaries(node: Element | null, selector: string): HTMLElement | null {
  let current: Element | null = node
  while (current) {
    const found = current.closest(selector) as HTMLElement | null
    if (found)
      return found
    const root = current.getRootNode()
    current = root instanceof ShadowRoot ? root.host : null
  }
  return null
}

/**
 * `ancestor.contains(node)`, but also true when `node` sits inside a shadow tree
 * hosted (possibly transitively) by a descendant of `ancestor`.
 */
export function containsAcrossShadowBoundaries(ancestor: Element | null | undefined, node: Element | null | undefined): boolean {
  if (!ancestor || !node)
    return false
  let current: Element | null = node
  while (current) {
    if (ancestor === current || ancestor.contains(current))
      return true
    const root = current.getRootNode()
    current = root instanceof ShadowRoot ? root.host : null
  }
  return false
}
