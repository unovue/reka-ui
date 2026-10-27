import type { MaybeRefOrGetter } from 'vue'
import { isClient } from '@vueuse/shared'
import { toValue, watchEffect } from 'vue'
import { containsComposed, getOwnerWindow } from './getRootNode'

/**
 * Calls `onScroll` when anything that scrolls `anchor` scrolls: the page or
 * any scroll container around it, in the light DOM or in the shadow roots the
 * anchor is nested in.
 *
 * `scroll` does not bubble and is not composed, so a capturing `window`
 * listener alone never sees a scroll container inside a shadow root; each
 * shadow root in the anchor's chain gets its own capturing listener. The
 * scrolled element contains the anchor across shadow boundaries
 * (`containsComposed`), which also covers `document` (the page scroll).
 */
export function useAncestorScroll(anchor: MaybeRefOrGetter<Element | null | undefined>, onScroll: (event: Event) => void) {
  watchEffect((onCleanup) => {
    const element = toValue(anchor)
    if (!isClient || !element)
      return

    const handleScroll = (event: Event) => {
      const target = event.target as Node | null
      if (target && typeof target.nodeType === 'number' && containsComposed(target, element))
        onScroll(event)
    }

    const targets: EventTarget[] = [getOwnerWindow(element)]
    let root = element.getRootNode() as Node
    while ((root as ShadowRoot).host) {
      targets.push(root)
      root = (root as ShadowRoot).host.getRootNode()
    }

    for (const target of targets)
      target.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    onCleanup(() => {
      for (const target of targets)
        target.removeEventListener('scroll', handleScroll, { capture: true })
    })
  })
}
