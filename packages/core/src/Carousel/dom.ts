/** The document an element lives in; the global one on the client before it has an element. */
export function ownerDocument(el: Element | null | undefined): Document {
  return el?.ownerDocument ?? document
}

/** The window an element lives in; the global one on the client before it has an element. */
export function ownerWindow(el: Element | null | undefined): Window & typeof globalThis {
  return (el?.ownerDocument?.defaultView ?? window) as Window & typeof globalThis
}

/** A sort comparator for nodes in document order: negative when `a` comes before `b`. */
export function compareDocumentOrder(a: Node, b: Node): number {
  if (a === b)
    return 0
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1
}
