import { getOwnerDocument } from './getRootNode'

/**
 * The deep active element. Starts from the anchor's owner document (falls back to
 * the global document) and descends through nested shadow roots.
 */
export function getActiveElement(anchor?: Node | null): Element | null {
  let activeElement: Element | null = getOwnerDocument(anchor).activeElement
  if (activeElement == null) {
    return null
  }

  while (activeElement != null && activeElement.shadowRoot != null && activeElement.shadowRoot.activeElement != null) {
    activeElement = activeElement.shadowRoot.activeElement
  }

  return activeElement
}
