export function isHTMLElement(node: unknown): node is HTMLElement {
  return typeof node === 'object' && node !== null && (node as Node).nodeType === Node.ELEMENT_NODE
}
