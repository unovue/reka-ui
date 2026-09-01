import type { MaybeComputedElementRef } from '@vueuse/core'
import { tryOnMounted, unrefElement, useMutationObserver } from '@vueuse/core'
import { shallowRef } from 'vue'

export function useElementVisible(
  target: MaybeComputedElementRef,
) {
  const visible = shallowRef(false)
  useMutationObserver(target, update, { attributeFilter: ['style', 'class'] })

  tryOnMounted(() => {
    update()
  })

  function update() {
    const el = unrefElement(target)
    if (!el)
      return

    visible.value = window.getComputedStyle(el).display !== 'none'
  }

  return {
    visible,
  }
}
