import type { MaybeElementRef } from '@vueuse/core'
import { unrefElement } from '@vueuse/core'
import { hideOthers } from 'aria-hidden'
import { nextTick, onBeforeUnmount, watch } from 'vue'

/**
 * Hides other elements from assistive technology after the target's auto-focus.
 * Restores them when the target clears or its owner starts unmounting, before
 * focus can return to the background.
 */
export function useHideOthers(target: MaybeElementRef) {
  let undo: ReturnType<typeof hideOthers> | undefined

  function release() {
    undo?.()
    // A retained component instance must not keep the hidden elements alive.
    undo = undefined
  }

  watch(() => unrefElement(target), async (el, _, onCleanup) => {
    release()
    // disable hideOthers on test mode
    if (import.meta.env.MODE === 'test' || !el)
      return

    let cancelled = false
    onCleanup(() => { cancelled = true })
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
      isInsideClosedPopover = !!el?.closest('[popover]:not(:popover-open)')
    }
    catch {}
    if (!isInsideClosedPopover)
      undo = hideOthers(el)
  }, { flush: 'sync' })

  // Restore the background before a descendant FocusScope restores focus to it.
  onBeforeUnmount(release)
}
