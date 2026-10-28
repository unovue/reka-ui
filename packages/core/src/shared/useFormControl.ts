import type { MaybeElementRef } from '@vueuse/core'
import { unrefElement } from '@vueuse/core'
import { computed, toValue } from 'vue'

export function useFormControl(el: MaybeElementRef) {
  // We set this to true by default so that events bubble to forms without JS (SSR)
  return computed(() => {
    if (!toValue(el))
      return true
    const element = unrefElement(el) as (HTMLElement & { form?: HTMLFormElement | null }) | null | undefined
    // `form`: a control associated with a form it is not inside (`form="id"` on a
    // form-associated custom element, see `reka-ui/elements`).
    return Boolean(element?.closest('form') || element?.form)
  })
}
