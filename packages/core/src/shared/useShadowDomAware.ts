import type { MaybeElementRef } from '@vueuse/core'
import { unrefElement } from '@vueuse/core'

/**
 * Gets the appropriate container for an element, considering shadow DOM boundaries.
 * Returns the shadow root if the element is inside one, otherwise returns document.
 */
export function getElementContainer(element: Element | null): Document | ShadowRoot {
  if (!element)
    return document

  // Walk up the DOM tree to find a shadow root
  let current: Node | null = element
  while (current) {
    if (current instanceof ShadowRoot) {
      return current
    }
    current = current.parentNode || (current as any).host
  }

  return document
}

/**
 * Gets the body element for a given container (shadow root or document).
 */
export function getContainerBody(container: Document | ShadowRoot): Element {
  if (container instanceof ShadowRoot) {
    // For shadow DOM, use the shadow root itself as the "body"
    return container as any as Element
  }
  return container.body
}

/**
 * Hook to get shadow DOM aware container for an element reference.
 */
export function useShadowDomAwareContainer(elementRef: MaybeElementRef) {
  return () => {
    const element = unrefElement(elementRef)
    return element ? getElementContainer(element) : document
  }
}
