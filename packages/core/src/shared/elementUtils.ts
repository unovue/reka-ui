import type { ComponentPublicInstance } from 'vue'

/**
 * Check if the target is an HTMLElement
 * @param target - The target to check
 * @returns True if the target is an HTMLElement, false otherwise
 */
export function isHTMLElement(target: unknown): target is HTMLElement {
  return !!target && target instanceof HTMLElement
}

/**
 * Check if the target is an Element
 * @param target - The target to check
 * @returns True if the target is an Element, false otherwise
 */
export function isElement(target: unknown): target is Element {
  return !!target && target instanceof Element
}

/**
 * Get the Element from the node
 * @param node - The node to get the Element from
 * @returns The Element from the node, or undefined if the node is not an Element or a ComponentPublicInstance
 */
export function getElement(node: Element | ComponentPublicInstance | null): Element | undefined {
  if (isElement(node))
    return node
  else if (node !== null)
    return node.$el
  else
    return undefined
}
