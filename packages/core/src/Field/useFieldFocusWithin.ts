import type { Ref } from 'vue'
import type { FieldControlBinding } from './useFieldControl'
import { watch } from 'vue'

export interface FieldFocusWithin {
  /** Whether focus is currently inside the control's element. */
  isFocusWithin: () => boolean
  /** Bind as the element's `@focusin`. */
  onFocusin: (event: FocusEvent) => void
  /** Bind as the element's `@focusout`. */
  onFocusout: (event: FocusEvent) => void
}

/**
 * Group-level focus reporting for a Field control made of several focusable
 * parts (segments, slots, a preview and an input): the field is focused while
 * focus is anywhere inside `element`, and touched (blurred) only once focus
 * leaves it. Moving between parts reports nothing.
 *
 * Bind `onFocusin`/`onFocusout` on the element in the template, so they run in
 * order with a consumer's listeners and stay attached for the `focusout` an
 * element being removed fires. Native listeners are attached too, as soon as
 * the element exists: Vue skips an invoker attached in the millisecond of the
 * event's first invoker (here a part's), which would leave the state out of
 * step with the document. Each event is handled once.
 *
 * Returns `null` without a binding (outside a Field), creating nothing.
 */
export function useFieldFocusWithin(field: FieldControlBinding | null, element: Ref<HTMLElement | undefined>): FieldFocusWithin | null {
  if (!field)
    return null

  let focusWithin = false
  const handledEvents = new WeakSet<Event>()

  function onFocusin(event: FocusEvent) {
    if (handledEvents.has(event))
      return
    handledEvents.add(event)
    if (!focusWithin)
      field!.onFocus()
    focusWithin = true
  }

  function onFocusout(event: FocusEvent) {
    if (handledEvents.has(event))
      return
    handledEvents.add(event)
    if (element.value?.contains(event.relatedTarget as Node | null))
      return
    focusWithin = false
    field!.onBlur()
  }

  watch(element, (el, _, onCleanup) => {
    if (!el)
      return
    el.addEventListener('focusin', onFocusin)
    el.addEventListener('focusout', onFocusout)
    onCleanup(() => {
      el.removeEventListener('focusin', onFocusin)
      el.removeEventListener('focusout', onFocusout)
      // The element is going away (an `as` or as-child change, or unmount), and not every
      // browser fires `focusout` for a removed element, so focus can't still be inside it.
      if (focusWithin) {
        focusWithin = false
        field!.context.reportControlState({ focused: false })
      }
    })
  }, { flush: 'sync', immediate: true })

  return {
    isFocusWithin: () => focusWithin,
    onFocusin,
    onFocusout,
  }
}
