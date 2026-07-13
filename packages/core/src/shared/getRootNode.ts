export type RootNode = Document | ShadowRoot

/**
 * The nearest `Document` or `ShadowRoot` for `node` (the element's
 * `getRootNode()`), with the global document as an SSR-safe fallback. Cross-realm
 * safe: classifies via `nodeType`/`host` duck-typing, not `instanceof`.
 */
export function getRootNode(node?: Node | null): RootNode {
  if (!node)
    return globalThis.document
  const root = node.getRootNode()
  if ((root as RootNode).nodeType === Node.DOCUMENT_NODE || (root as ShadowRoot).host !== undefined)
    return root as RootNode
  return node.ownerDocument ?? globalThis.document // detached node → its document
}

export function getOwnerDocument(node?: Node | null): Document {
  return node?.ownerDocument ?? globalThis.document
}

export function getOwnerWindow(node?: Node | null): Window & typeof globalThis {
  return (getOwnerDocument(node).defaultView ?? globalThis.window) as Window & typeof globalThis
}

/**
 * Root-scoped `getElementById`, **dual-root**: the anchor's root first (in-shadow
 * content), then the owner document (content Teleported out to `body`). Light-DOM
 * behavior is unchanged (the anchor's root IS the document).
 */
export function getElementByIdFrom(anchor: Node | null | undefined, id: string): HTMLElement | null {
  const inRoot = getRootNode(anchor).getElementById(id) as HTMLElement | null
  if (inRoot)
    return inRoot
  return getOwnerDocument(anchor).getElementById(id) as HTMLElement | null
}

/**
 * Retarget-safe event target for listeners attached above a shadow boundary.
 * `composedPath()[0]` is the deep (un-retargeted) target for open roots; read it
 * SYNCHRONOUSLY — it returns `[]` once dispatch completes.
 */
export function getEventTarget<T extends EventTarget = EventTarget>(event: Event): T | null {
  return (event.composedPath?.()[0] ?? event.target) as T | null
}

/**
 * `container.contains(node)`, but crossing shadow boundaries: walks up through
 * shadow hosts so a node inside a nested shadow tree still counts as contained.
 * Used when checking a composed (deep) event target against a scope root.
 */
export function containsComposed(container: Node, node: Node | null): boolean {
  let current: Node | null = node
  while (current) {
    if (container.contains(current))
      return true
    current = (current.getRootNode() as ShadowRoot).host ?? null
  }
  return false
}
