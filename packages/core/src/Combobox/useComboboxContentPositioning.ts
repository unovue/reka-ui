import type { Ref } from 'vue'
import { computed, ref } from 'vue'
import { provideListboxHighlightScrollContext } from '@/Listbox/ListboxRoot.vue'

export function useComboboxContentPositioning(
  open: Readonly<Ref<boolean>>,
) {
  const contentPosition = ref<'inline' | 'popper'>('inline')
  const contentPlaced = ref(false)
  const currentContent = ref<symbol>()
  const suppressHighlightScroll = computed(() => contentPosition.value === 'popper' && !contentPlaced.value)
  let pendingHighlightScroll: (() => void) | undefined

  provideListboxHighlightScrollContext({
    suppressHighlightScroll,
    onHighlightScrollRequest(scroll) {
      pendingHighlightScroll = scroll
    },
  })

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
    onContentPositionChange,
    onContentPlaced,
    onContentUnmount,
  }
}
