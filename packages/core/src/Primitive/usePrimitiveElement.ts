import type { ComponentPublicInstance } from 'vue'
import { unrefElement } from '@vueuse/core'
import { computed, ref } from 'vue'

export function usePrimitiveElement<T extends ComponentPublicInstance>() {
  const primitiveElement = ref<T>()
  const currentElement = computed<HTMLElement>(() => {
    // The ref may be a component instance (has `$el`) or a raw Element (from
    // `<component :is>` / a direct element ref, which has no `$el`).
    const el = (primitiveElement.value as { $el?: HTMLElement } | undefined)?.$el
    // Non-single/text root: `$el` is a text/comment node → use the next element.
    return el && ['#text', '#comment'].includes(el.nodeName)
      ? el.nextElementSibling as HTMLElement
      : unrefElement(primitiveElement) as HTMLElement
  })

  return {
    primitiveElement,
    currentElement,
  }
}
