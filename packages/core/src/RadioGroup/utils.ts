import type { AcceptableValue } from '@/shared/types'
import { isClient } from '@vueuse/shared'
import { getCurrentScope, nextTick, onScopeDispose } from 'vue'
import { handleAndDispatchCustomEvent } from '@/shared'

export type SelectEvent = CustomEvent<{ originalEvent: MouseEvent, value?: AcceptableValue }>
export const RADIO_SELECT = 'radio.select'

export function handleSelect(event: MouseEvent, value: AcceptableValue | undefined, callback: (event: SelectEvent) => void) {
  const eventDetail = { originalEvent: event, value }
  handleAndDispatchCustomEvent(RADIO_SELECT, callback, eventDetail)
}

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

/**
 * Whether an arrow key is held: set by any arrow keydown on the window and
 * cleared by any keyup. One pair of window listeners for the whole page,
 * installed while a radio group is mounted (reference counted), instead of a
 * pair per radio item.
 */
let arrowKeyPressed = false
let arrowKeyListeners = 0

function onWindowKeydown(event: KeyboardEvent) {
  if (ARROW_KEYS.includes(event.key))
    arrowKeyPressed = true
}

function onWindowKeyup() {
  // Reset after `RovingFocusGroup` has moved focus (it does so in `nextTick`), so a
  // keyup dispatched in the same task as the keydown can't erase the arrow intent.
  nextTick(() => {
    arrowKeyPressed = false
  })
}

/** Installs the shared arrow-key listeners for the calling scope. @lifecycle setup */
export function useArrowKeyListeners() {
  if (!isClient || !getCurrentScope())
    return
  if (arrowKeyListeners++ === 0) {
    // Capture phase: `RovingFocusGroup` moves focus in a microtask that a real key press runs
    // before bubbling listeners, so the flag has to be set before then for the focus handler to see it.
    window.addEventListener('keydown', onWindowKeydown, true)
    window.addEventListener('keyup', onWindowKeyup)
  }
  onScopeDispose(() => {
    if (--arrowKeyListeners === 0) {
      window.removeEventListener('keydown', onWindowKeydown, true)
      window.removeEventListener('keyup', onWindowKeyup)
      arrowKeyPressed = false
    }
  })
}

/** Whether an arrow key is held (see `useArrowKeyListeners`). */
export function isArrowKeyPressed() {
  return arrowKeyPressed
}
