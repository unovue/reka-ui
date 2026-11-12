import type { ComponentPublicInstance } from 'vue'
import { computed, ref } from 'vue'
import { resolveElement } from '@/shared/resolveElement'

export function usePrimitiveElement<T extends ComponentPublicInstance>() {
  const primitiveElement = ref<T>()
  const currentElement = computed<HTMLElement>(() => resolveElement(primitiveElement.value))

  return {
    primitiveElement,
    currentElement,
  }
}
