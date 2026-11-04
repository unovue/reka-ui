import type { MaybeRefOrGetter, Ref } from 'vue'
import { readonly, shallowRef, toValue, watch } from 'vue'
import { getActiveElement } from './getActiveElement'
import { containsComposed } from './getRootNode'

/**
 * Whether focus is inside `target`, kept from its `focusin` / `focusout` like
 * `@vueuse/core`'s `useFocusWithin`, and also cleared when the focused element is
 * removed from inside it. Chromium fires `focusout` for a removed element, but
 * Firefox and WebKit fire nothing, so while focus is inside, a `MutationObserver`
 * re-reads it from the document after each removal. It observes the light DOM
 * under `target` only: a removal inside a descendant's shadow root isn't seen.
 */
export function useFocusWithin(target: MaybeRefOrGetter<HTMLElement | null | undefined>): { focused: Readonly<Ref<boolean>> } {
  const focused = shallowRef(false)

  watch(() => toValue(target), (element, _, onCleanup) => {
    focused.value = false
    if (!element)
      return

    let observer: MutationObserver | undefined
    const set = (value: boolean) => {
      focused.value = value
      if (value && !observer && typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(() => {
          if (!containsComposed(element, getActiveElement(element)))
            set(false)
        })
        observer.observe(element, { childList: true, subtree: true })
      }
      else if (!value) {
        observer?.disconnect()
        observer = undefined
      }
    }
    const onFocusin = () => set(true)
    // `relatedTarget` is where focus goes: still inside, or out (`null` when nothing takes it).
    const onFocusout = (event: FocusEvent) => set(containsComposed(element, event.relatedTarget as Node | null))

    element.addEventListener('focusin', onFocusin)
    element.addEventListener('focusout', onFocusout)
    // Mounted with focus already inside (an `as` change keeps the focused child).
    if (containsComposed(element, getActiveElement(element)))
      set(true)

    onCleanup(() => {
      element.removeEventListener('focusin', onFocusin)
      element.removeEventListener('focusout', onFocusout)
      set(false)
    })
  }, { immediate: true, flush: 'sync' })

  return { focused: readonly(focused) }
}
