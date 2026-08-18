import type { Ref } from 'vue'
import { computed, ref } from 'vue'
import { provideListboxHighlightScrollContext } from '@/Listbox/ListboxRoot.vue'

export function useComboboxContentPositioning(
  open: Readonly<Ref<boolean>>,
  highlightedElement: Readonly<Ref<HTMLElement | undefined>>,
) {
  const contentPosition = ref<'inline' | 'popper'>('inline')
  const contentPlaced = ref(false)
  const suppressHighlightScroll = computed(() => contentPosition.value === 'popper' && !contentPlaced.value)

  provideListboxHighlightScrollContext({ suppressHighlightScroll })

  function scrollHighlightedElement() {
    const element = highlightedElement.value
    if (element?.isConnected)
      element.scrollIntoView({ block: 'nearest' })
  }

  function onContentPositionChange(position: 'inline' | 'popper') {
    if (contentPosition.value !== position)
      contentPlaced.value = false
    contentPosition.value = position
  }

  function onContentPlaced() {
    if (contentPosition.value !== 'popper' || contentPlaced.value)
      return

    contentPlaced.value = true
    if (open.value)
      scrollHighlightedElement()
  }

  function onContentUnmount() {
    contentPosition.value = 'inline'
    contentPlaced.value = false
  }

  return {
    onContentPositionChange,
    onContentPlaced,
    onContentUnmount,
  }
}
