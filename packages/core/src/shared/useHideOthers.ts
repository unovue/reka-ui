import type { MaybeElementRef } from '@vueuse/core'
import { unrefElement } from '@vueuse/core'
import { hideOthers } from 'aria-hidden'
import { onUnmounted, watch } from 'vue'
import { getElementContainer } from './useShadowDomAware'

/**
 * The `useHideOthers` function is a TypeScript function that takes a target element reference and
 * hides all other elements in ARIA when the target element is present, and restores the visibility of the
 * hidden elements when the target element is removed.
 * @param {MaybeElementRef} target - The `target` parameter is a reference to the element that you want
 * to hide other elements when it is clicked or focused.
 * @param {MaybeElementRef} [container] - Optional container element. If not provided, will auto-detect shadow DOM boundary.
 */
export function useHideOthers(target: MaybeElementRef, container?: MaybeElementRef) {
  let undo: ReturnType<typeof hideOthers> | (() => void)

  watch(() => unrefElement(target), (el) => {
    // disable hideOthers on test mode
    if (import.meta.env.MODE === 'test')
      return

    if (el) {
      const containerEl = container ? unrefElement(container) : null

      if (containerEl instanceof HTMLElement) {
        // Use the provided container with aria-hidden library
        undo = hideOthers(el, containerEl)
      }
      else {
        // Auto-detect shadow DOM and use custom implementation if needed
        const detectedContainer = getElementContainer(el) as unknown as HTMLElement
        undo = hideOthers(el, detectedContainer)
      }
    }
    else if (undo) {
      undo()
    }
  })

  onUnmounted(() => {
    if (undo)
      undo()
  })
}
