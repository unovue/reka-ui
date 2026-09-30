export function isHTMLElement(node: unknown): node is HTMLElement {
  if (typeof window === 'undefined' || typeof node !== 'object' || node === null)
    return false
  // Compare against the node's own window too, so elements from another
  // realm (e.g. an iframe or a popup window) are recognized
  const ownerWindow = (node as Node).ownerDocument?.defaultView ?? window
  return node instanceof HTMLElement || node instanceof ownerWindow.HTMLElement
}
