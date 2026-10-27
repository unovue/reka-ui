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
 * `el.parentElement`, stepping from a shadow root's top level to its host.
 * This is the composed tree, without slot assignment.
 */
export function getComposedParentElement(el: Element): Element | null {
  return el.parentElement ?? (el.parentNode as ShadowRoot | null)?.host ?? null
}

/**
 * The flat-tree parent: the slot a light-DOM child is assigned to, otherwise
 * `getComposedParentElement`. Follows what the page actually renders, e.g.
 * a slotted trigger inside a shadow scroll container.
 */
export function getFlatTreeParentElement(el: Element): Element | null {
  return el.assignedSlot ?? getComposedParentElement(el)
}

/**
 * `container.contains(node)`, but in the tree the page renders: crossing
 * shadow boundaries (a node inside a nested shadow tree counts as contained by
 * its host's ancestors) and following slots (a light-DOM child counts as
 * contained by the ancestors of the slot it is assigned to, e.g. content a
 * custom element slots into a popup in its shadow root). Used when checking a
 * composed (deep) event target against a scope root. A document or shadow
 * root contains whatever it holds in its own tree.
 */
export function containsComposed(container: Node, node: Node | null): boolean {
  if (!node)
    return false
  if (container.contains(node))
    return true
  const isTreeRoot = container.nodeType !== Node.ELEMENT_NODE
  let current: Element | null = node.nodeType === Node.ELEMENT_NODE
    ? node as Element
    : (node as ShadowRoot).host ?? node.parentElement
  while (current) {
    if (current === container || (isTreeRoot && container.contains(current)))
      return true
    current = getFlatTreeParentElement(current)
  }
  return false
}

/**
 * `el.closest(selector)` along the same tree as `containsComposed`: past
 * shadow roots into their hosts, and through the slots light-DOM children are
 * assigned to.
 */
export function closestComposed<T extends Element = Element>(el: Element, selector: string): T | null {
  for (let current: Element | null = el; current; current = getFlatTreeParentElement(current)) {
    if (current.matches(selector))
      return current as T
  }
  return null
}

function isShadowRoot(node: RootNode | undefined): node is ShadowRoot {
  return !!node && (node as ShadowRoot).host !== undefined
}

/**
 * The Teleport target for a portal rendered in `root`. Light DOM keeps Vue's
 * semantics (`to`, defaulting to `'body'`). Inside a shadow root:
 * - no `to` → the shadow root itself, so the content stays in the root (shadow
 *   styles still apply, and ids/`aria-*` references, `aria-hidden` and focus
 *   containment all resolve within one tree);
 * - a selector → matched inside the shadow root first, then in the document.
 */
export function resolveTeleportTarget(
  to: string | HTMLElement | undefined,
  root: RootNode | undefined,
): string | HTMLElement | ShadowRoot {
  if (to && typeof to !== 'string')
    return to
  if (!isShadowRoot(root))
    return to ?? 'body'
  if (!to)
    return root
  return root.querySelector<HTMLElement>(to) ?? to
}
