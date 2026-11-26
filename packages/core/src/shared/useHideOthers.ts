import type { MaybeElementRef } from '@vueuse/core'
import { unrefElement } from '@vueuse/core'
import { hideOthers } from 'aria-hidden'
import { nextTick, onBeforeUnmount, watch } from 'vue'
import { getFlatTreeParentElement } from './getRootNode'
import { agentRegistrar } from './useAgentRegistration'

// `aria-hidden`'s default marker: set on every node a lock currently hides.
const MARKER = 'data-aria-hidden'

/**
 * Another lock hides an ancestor of `target` (in practice a shadow host: a
 * modal in one shadow root hides the other widgets' hosts). In the light DOM
 * the newest modal is portalled to `body` after the older one hid its
 * siblings, so it stays exposed; here it would sit inside a hidden host. Lift
 * those holds while this lock holds. An `aria-hidden` without the marker is
 * the author's own and stays.
 */
function liftHiddenAncestors(target: Element): Element[] {
  const lifted: Element[] = []
  for (let node = getFlatTreeParentElement(target); node; node = getFlatTreeParentElement(node)) {
    if (node.getAttribute('aria-hidden') === 'true' && node.hasAttribute(MARKER)) {
      node.removeAttribute('aria-hidden')
      lifted.push(node)
    }
  }
  return lifted
}

/**
 * `aria-hidden`'s `hideOthers`, across shadow boundaries. The library only
 * walks light-DOM children from `document.body` (a target inside a shadow root
 * is kept by keeping its host), so siblings that share the target's shadow root
 * would stay exposed. Hide them per tree: the target's siblings within each
 * shadow root it is nested in, then the outermost host's siblings in the
 * document. The returned undo runs once; further calls do nothing.
 */
export function hideOthersAcrossShadowRoots(target: Element): () => void {
  const undos: Array<() => void> = []
  let current = target
  let root = current.getRootNode() as Node
  while ((root as ShadowRoot).host) {
    // A ShadowRoot walks like an element here: it has `children`, `contains`
    // and `querySelectorAll` (for the `aria-live` regions the library keeps).
    undos.push(hideOthers(current, root as unknown as HTMLElement))
    current = (root as ShadowRoot).host
    root = current.getRootNode()
  }
  undos.push(hideOthers(current))
  const lifted = liftHiddenAncestors(target)

  let done = false
  return () => {
    if (done)
      return
    done = true
    for (let i = undos.length - 1; i >= 0; i--)
      undos[i]()
    // Hand back what another lock still holds (its marker is still there).
    for (const node of lifted) {
      if (node.hasAttribute(MARKER))
        node.setAttribute('aria-hidden', 'true')
    }
  }
}

/**
 * Hides other elements from assistive technology after the target's auto-focus.
 * Restores them when the target clears or its owner starts unmounting, before
 * focus can return to the background.
 */
export function useHideOthers(target: MaybeElementRef) {
  let undo: ReturnType<typeof hideOthers> | undefined

  // `aria-hidden` reference-counts every hidden node and its undo has no
  // guard: running one twice releases another modal's hold. Run each at most
  // once.
  function release() {
    const current = undo
    undo = undefined
    current?.()
  }

  watch(() => unrefElement(target), async (el, _, onCleanup) => {
    release()
    // disable hideOthers on test mode
    if (import.meta.env.MODE === 'test' || !el)
      return

    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })
    // This synchronous watcher can run before descendants receive their props.
    // Let them render, then let FocusScope's nextTick auto-focus move focus inside.
    await nextTick()
    await nextTick()
    if (cancelled)
      return
    // Skip if inside a closed native popover
    // Use try/catch as `:popover-open` pseudo-class is not supported in all browsers (e.g. Safari 18)
    let isInsideClosedPopover = false
    try {
      isInsideClosedPopover = !!el.closest('[popover]:not(:popover-open)')
    }
    catch {}
    if (!isInsideClosedPopover) {
      // The agent bridge, when there is one, notes what the app hid itself before everything else is hidden too.
      agentRegistrar.hiding?.()
      undo = hideOthersAcrossShadowRoots(el)
    }
  }, { flush: 'sync' })

  // Restore the background before a descendant FocusScope restores focus to it.
  onBeforeUnmount(release)
}
