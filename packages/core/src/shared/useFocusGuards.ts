import type { MaybeRefOrGetter } from 'vue'
import type { RootNode } from './getRootNode'
import { isClient } from '@vueuse/shared'
import { toValue, watchEffect } from 'vue'
import { getOwnerDocument, getRootNode } from './getRootNode'

/** Guard-pair refcount per root (Document or ShadowRoot). */
const counts = new WeakMap<RootNode, number>()

/**
 * Injects a pair of focus guards at the edges of a root so `focusin`/`focusout`
 * events can be caught consistently. Pass `element` to scope the guards to that
 * element's root (its `ShadowRoot`, or the document in light DOM); omit it for
 * the document body (the public `FocusGuards` component's back-compat behavior).
 */
export function useFocusGuards(element?: MaybeRefOrGetter<HTMLElement | null | undefined>) {
  watchEffect((cleanupFn) => {
    if (!isClient)
      return
    const el = toValue(element)
    // Anchor requested but not mounted yet — re-runs when `element` resolves.
    if (element !== undefined && !el)
      return
    const root = getRootNode(el)
    const doc = getOwnerDocument(el)

    const edgeGuards = root.querySelectorAll('[data-reka-focus-guard]')
    const first = edgeGuards[0] ?? createFocusGuard(doc)
    const last = edgeGuards[1] ?? createFocusGuard(doc)
    if (root.nodeType === Node.DOCUMENT_NODE) {
      doc.body.insertAdjacentElement('afterbegin', first)
      doc.body.insertAdjacentElement('beforeend', last)
    }
    else {
      // A ShadowRoot is a DocumentFragment — no `body`/`insertAdjacentElement`;
      // insert the guards as its first/last children.
      root.insertBefore(first, root.firstChild)
      root.appendChild(last)
    }
    counts.set(root, (counts.get(root) ?? 0) + 1)

    cleanupFn(() => {
      const count = counts.get(root) ?? 0
      if (count === 1) {
        root
          .querySelectorAll('[data-reka-focus-guard]')
          .forEach(node => node.remove())
      }
      counts.set(root, count - 1)
    })
  })
}

function createFocusGuard(doc: Document) {
  const element = doc.createElement('span')
  element.setAttribute('data-reka-focus-guard', '')
  element.tabIndex = 0
  element.style.outline = 'none'
  element.style.opacity = '0'
  element.style.position = 'fixed'
  element.style.pointerEvents = 'none'
  return element
}
