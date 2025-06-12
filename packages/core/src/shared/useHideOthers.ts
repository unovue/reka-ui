import type { MaybeElementRef } from '@vueuse/core'
import { unrefElement } from '@vueuse/core'
import { hideOthers } from 'aria-hidden'
import { onUnmounted, unref, watch } from 'vue'
import { useElementVisible } from './useElementVisible'

/**
 * The `useHideOthers` function is a TypeScript function that takes a target element reference and
 * hides all other elements in ARIA when the target element is present, and restores the visibility of the
 * hidden elements when the target element is removed.
 * @param {MaybeElementRef} target - The `target` parameter is a reference to the element that you want
 * to hide other elements when it is clicked or focused.
 */
export function useHideOthers(target: MaybeElementRef) {
  const { visible } = useElementVisible(target)

  let undo: ReturnType<typeof hideOthers>
  watch(() => unref(visible) && unrefElement(target), (el) => {
    // disable hideOthers on test mode
    if (import.meta.env.MODE === 'test')
      return
    if (el)
      undo = hideOthers(el)
    else if (undo)
      undo()
  })

  onUnmounted(() => {
    if (undo)
      undo()
  })
}
