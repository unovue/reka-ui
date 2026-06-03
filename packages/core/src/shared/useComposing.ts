import { nextTick, ref } from 'vue'

export function useComposing(onEnd?: (event: CompositionEvent) => void) {
  const isComposing = ref(false)

  function handleCompositionStart() {
    isComposing.value = true
  }

  function handleCompositionEnd(event: CompositionEvent) {
    nextTick(() => {
      isComposing.value = false
      onEnd?.(event)
    })
  }

  return { isComposing, handleCompositionStart, handleCompositionEnd }
}
