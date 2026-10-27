import type { MaybeElementRef } from '@vueuse/core'
import { unrefElement } from '@vueuse/core'
import { hideOthers } from 'aria-hidden'
import { onUnmounted, watch } from 'vue'

/**
 * `aria-hidden`'s `hideOthers`, across shadow boundaries. The library only
 * walks light-DOM children from `document.body` (a target inside a shadow root
 * is kept by keeping its host), so siblings that share the target's shadow root
 * would stay exposed. Hide them per tree: the target's siblings within each
 * shadow root it is nested in, then the outermost host's siblings in the
 * document.
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
  return () => {
    for (const undo of undos.reverse())
      undo()
  }
}

/**
 * The `useHideOthers` function is a TypeScript function that takes a target element reference and
 * hides all other elements in ARIA when the target element is present, and restores the visibility of the
 * hidden elements when the target element is removed.
 * @param {MaybeElementRef} target - The `target` parameter is a reference to the element that you want
 * to hide other elements when it is clicked or focused.
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

  watch(() => unrefElement(target), (el) => {
    // disable hideOthers on test mode
    if (import.meta.env.MODE === 'test')
      return
    release()
    // Skip if inside a closed native popover
    // Use try/catch as `:popover-open` pseudo-class is not supported in all browsers (e.g. Safari 18)
    let isInsideClosedPopover = false
    try {
      isInsideClosedPopover = !!el?.closest('[popover]:not(:popover-open)')
    }
    catch {}
    if (el && !isInsideClosedPopover)
      undo = hideOthersAcrossShadowRoots(el)
  })

  onUnmounted(release)
}
