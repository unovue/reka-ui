import type { MaybeRefOrGetter } from 'vue'
import { isClient } from '@vueuse/shared'
import { toValue, watchEffect } from 'vue'
import { containsComposed, getFlatTreeParentElement, getOwnerWindow } from './getRootNode'

/**
 * Calls `onScroll` when anything that scrolls `anchor` scrolls: the page or
 * any scroll container around it, in the light DOM or in the shadow roots the
 * anchor is nested in.
 *
 * `scroll` does not bubble and is not composed, so a capturing `window`
 * listener alone never sees a scroll container inside a shadow root; each
 * shadow root the anchor renders through gets its own capturing listener.
 * That follows the flat tree: a slotted (light-DOM) anchor scrolls with a
 * container inside the shadow root it is slotted into (e.g. Ionic's
 * `ion-content`), so that root counts too, and so does the container.
 */
export function useAncestorScroll(anchor: MaybeRefOrGetter<Element | null | undefined>, onScroll: (event: Event) => void) {
  watchEffect((onCleanup) => {
    const element = toValue(anchor)
    if (!isClient || !element)
      return

    const handleScroll = (event: Event) => {
      const target = event.target as Node | null
      // The page scroll's target is the document, which contains it too.
      if (target && typeof target.nodeType === 'number' && containsComposed(target, element))
        onScroll(event)
    }

    const targets = new Set<EventTarget>([getOwnerWindow(element)])
    for (let node: Element | null = element; node; node = getFlatTreeParentElement(node)) {
      const root = node.getRootNode() as ShadowRoot
      if (root.host)
        targets.add(root)
    }

    for (const target of targets)
      target.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    onCleanup(() => {
      for (const target of targets)
        target.removeEventListener('scroll', handleScroll, { capture: true })
    })
  })
}
