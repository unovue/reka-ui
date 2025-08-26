import type { ComponentPublicInstance } from 'vue'

/**
 * Check if the target is a HTMLElement
 * @param target - The target to check
 * @returns True if the target is a HTMLElement, false otherwise
 */
export function isHTMLElement(target: unknown): target is HTMLElement {
  return !!target && target instanceof HTMLElement
}

/**
 * Get the HTMLElement from the target
 * @param target - The target to get the HTMLElement from
 * @returns The HTMLElement from the target, or undefined if the target is not a HTMLElement
 */
export function getHTMLElement(target: unknown): HTMLElement | undefined {
  return isHTMLElement(target) ? target : undefined
}

/**
 * Retrieves the underlying HTMLElement from a given Element or Vue component instance.
 *
 * @param vnode - An Element or Vue ComponentPublicInstance, or null.
 * @returns The corresponding HTMLElement if available, otherwise undefined.
 */
export function getHTMLElementFromVNode(vnode: Element | ComponentPublicInstance | null): HTMLElement | undefined {
  if (!vnode)
    return undefined
  else if (isHTMLElement(vnode))
    return vnode
  else if (typeof vnode === 'object' && vnode !== null && '$el' in vnode)
    return getHTMLElement(vnode.$el)
  else
    return undefined
}
