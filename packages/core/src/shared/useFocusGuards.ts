import type { MaybeElementRef } from '@vueuse/core'
import { unrefElement } from '@vueuse/core'
import { isClient } from '@vueuse/shared'
import { watchEffect } from 'vue'
import { getElementContainer } from './useShadowDomAware'

/** Number of components which have requested interest to have focus guards per container */
const containerCounts = new Map<Element | Document | ShadowRoot, number>()

/**
 * Injects a pair of focus guards at the edges of the appropriate container
 * to ensure `focusin` & `focusout` events can be caught consistently.
 * @param {MaybeElementRef} [elementRef] - Optional element reference to determine container. If not provided, uses document.body.
 */
export function useFocusGuards(elementRef?: MaybeElementRef) {
  watchEffect((cleanupFn) => {
    if (!isClient)
      return

    // Determine the container based on the element reference
    let container: Document | ShadowRoot
    let containerBody: Element | ShadowRoot

    if (elementRef) {
      const element = unrefElement(elementRef)
      if (element) {
        container = getElementContainer(element)
        if (container instanceof ShadowRoot) {
          // For shadow DOM, use the shadow root directly
          containerBody = container
        }
        else {
          containerBody = container.body
        }
      }
      else {
        // If elementRef is provided but element is not yet available, don't do anything yet
        // The watchEffect will re-run when the element becomes available
        return
      }
    }
    else {
      container = document
      containerBody = document.body
    }

    // Get current count for this container
    const currentCount = containerCounts.get(containerBody) || 0

    const edgeGuards = container.querySelectorAll('[data-reka-focus-guard]')

    // Handle different container types
    if (containerBody instanceof ShadowRoot) {
      // For shadow root, use appendChild/insertBefore
      const firstGuard = edgeGuards[0] ?? createFocusGuard()
      const lastGuard = edgeGuards[1] ?? createFocusGuard()

      if (containerBody.firstChild) {
        containerBody.insertBefore(firstGuard, containerBody.firstChild)
      }
      else {
        containerBody.appendChild(firstGuard)
      }
      containerBody.appendChild(lastGuard)
    }
    else {
      // For regular elements, use insertAdjacentElement
      containerBody.insertAdjacentElement(
        'afterbegin',
        edgeGuards[0] ?? createFocusGuard(),
      )
      containerBody.insertAdjacentElement(
        'beforeend',
        edgeGuards[1] ?? createFocusGuard(),
      )
    }

    // Update count for this container
    containerCounts.set(containerBody, currentCount + 1)

    cleanupFn(() => {
      const count = containerCounts.get(containerBody) || 0
      if (count === 1) {
        container
          .querySelectorAll('[data-reka-focus-guard]')
          .forEach(node => node.remove())
        containerCounts.delete(containerBody)
      }
      else {
        containerCounts.set(containerBody, count - 1)
      }
    })
  })
}

function createFocusGuard() {
  const element = document.createElement('span')
  element.setAttribute('data-reka-focus-guard', '')
  element.tabIndex = 0
  element.style.outline = 'none'
  element.style.opacity = '0'
  element.style.position = 'fixed'
  element.style.pointerEvents = 'none'
  return element
}
