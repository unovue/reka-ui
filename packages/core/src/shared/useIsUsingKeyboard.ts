import { createSharedComposable, useEventListener } from '@vueuse/core'
import { ref } from 'vue'

function useIsUsingKeyboardImpl() {
  const isUsingKeyboard = ref(false)

  // Registered in the shared composable's own scope, not in the first subscriber's
  // `onMounted`: listeners added there are disposed when that component unmounts,
  // which would freeze the value for every other subscriber. `useEventListener`
  // is a no-op during SSR.
  // Capture phase ensures we set the boolean before any side effects execute
  // in response to the key or pointer event as they might depend on this value.
  useEventListener('keydown', () => {
    isUsingKeyboard.value = true
  }, { capture: true, passive: true })

  useEventListener(['pointerdown', 'pointermove'], () => {
    isUsingKeyboard.value = false
  }, { capture: true, passive: true })

  return isUsingKeyboard
}

export const useIsUsingKeyboard = createSharedComposable(useIsUsingKeyboardImpl)
