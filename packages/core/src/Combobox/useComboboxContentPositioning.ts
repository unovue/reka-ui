import type { Ref } from 'vue'
import type { ListboxHighlightScroll } from '@/Listbox/useListbox'
import { computed, ref } from 'vue'

/**
 * Holds the highlight scroll of the combobox listbox back while popper content
 * is still being placed, and flushes the deferred scroll once it is.
 * `highlightScroll` goes to `useListboxRoot()`; the three callbacks go on the context.
 */
export function useComboboxContentPositioning(
  open: Readonly<Ref<boolean>>,
) {
  const contentPosition = ref<'inline' | 'popper'>('inline')
  const contentPlaced = ref(false)
  const currentContent = ref<symbol>()
  const suppressHighlightScroll = computed(() => contentPosition.value === 'popper' && !contentPlaced.value)
  let pendingHighlightScroll: (() => void) | undefined

  const highlightScroll: ListboxHighlightScroll = {
    suppressHighlightScroll,
    onHighlightScrollRequest(scroll) {
      pendingHighlightScroll = scroll
    },
  }

  function onContentPositionChange(content: symbol, position: 'inline' | 'popper') {
    if (currentContent.value !== content || contentPosition.value !== position) {
      contentPlaced.value = false
      pendingHighlightScroll = undefined
    }
    currentContent.value = content
    contentPosition.value = position
  }

  function onContentPlaced(content: symbol) {
    if (currentContent.value !== content || contentPosition.value !== 'popper' || contentPlaced.value)
      return

    contentPlaced.value = true
    const scroll = pendingHighlightScroll
    pendingHighlightScroll = undefined
    if (open.value)
      scroll?.()
  }

  function onContentUnmount(content: symbol) {
    if (currentContent.value !== content)
      return

    currentContent.value = undefined
    contentPosition.value = 'inline'
    contentPlaced.value = false
    pendingHighlightScroll = undefined
  }

  return {
    highlightScroll,
    onContentPositionChange,
    onContentPlaced,
    onContentUnmount,
  }
}
