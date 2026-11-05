/**
 * A sort comparator for nodes in document order: negative when `a` comes
 * before `b`.
 *
 * Nodes in different trees (a detached fragment, a KeepAlive's storage, a
 * shadow root, the page) are ordered by their trees' roots, so every node of
 * one tree sorts on the same side of every node of another. The DOM leaves the
 * order of disconnected nodes to the engine: WebKit orders the nodes
 * themselves, which can place a node of one tree between two of another (a
 * cycle no sort can resolve), so a sort can leave a reordered list as it was.
 */
export function compareDocumentOrder(a: Node, b: Node): number {
  if (a === b)
    return 0
  let position = a.compareDocumentPosition(b)
  if (position & Node.DOCUMENT_POSITION_DISCONNECTED) {
    const rootA = a.getRootNode()
    const rootB = b.getRootNode()
    if (rootA !== rootB)
      position = rootA.compareDocumentPosition(rootB)
  }
  return position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1
}
