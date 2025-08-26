/**
 * Check if the target is an HTMLElement
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
