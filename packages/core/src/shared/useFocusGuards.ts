import type { MaybeRefOrGetter } from 'vue'
import { isClient } from '@vueuse/shared'
import { toValue, watchEffect } from 'vue'

/** Number of components which have requested interest to have focus guards */
let count = 0

/**
 * Injects a pair of focus guards at the edges of the whole DOM tree
 * to ensure `focusin` & `focusout` events can be caught consistently.
 *
 * @param enabled Whether the caller needs the guards, e.g. only while a content kept
 * mounted when closed is shown, as the guards are tab stops of their own.
 */
export function useFocusGuards(enabled: MaybeRefOrGetter<boolean> = true) {
  watchEffect((cleanupFn) => {
    if (!isClient || !toValue(enabled))
      return
    const edgeGuards = document.querySelectorAll('[data-reka-focus-guard]')
    document.body.insertAdjacentElement(
      'afterbegin',
      edgeGuards[0] ?? createFocusGuard(),
    )
    document.body.insertAdjacentElement(
      'beforeend',
      edgeGuards[1] ?? createFocusGuard(),
    )
    count++

    cleanupFn(() => {
      if (count === 1) {
        document
          .querySelectorAll('[data-reka-focus-guard]')
          .forEach(node => node.remove())
      }
      count--
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
