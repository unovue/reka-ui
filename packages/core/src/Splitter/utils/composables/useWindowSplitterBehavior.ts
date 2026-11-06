import type { Ref } from 'vue'
import type { ResizeHandler } from '../types'
import { watchEffect } from 'vue'
import { assert } from '../assert'
import { getResizeHandleElementIndex, getResizeHandleElementsForGroup } from '../dom'

// https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/

export function useWindowSplitterResizeHandlerBehavior({
  disabled,
  handleId,
  resizeHandler,
  resizeHandleElement,
  panelGroupElement,
}: {
  disabled: Ref<boolean>
  handleId: string
  resizeHandler: Ref<ResizeHandler | null>
  resizeHandleElement: Ref<HTMLElement | undefined>
  panelGroupElement: Ref<ParentNode | null>
}): void {
  watchEffect((onCleanup) => {
    const _panelGroupElement = panelGroupElement.value
    if (disabled.value || resizeHandler.value === null || _panelGroupElement === null)
      return

    // The handle may mount after the group, so track its own element becoming available.
    const handleElement = resizeHandleElement.value
    if (handleElement == null)
      return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented)
        return

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'End':
        case 'Home': {
          event.preventDefault()

          resizeHandler.value?.(event)
          break
        }
        case 'F6': {
          event.preventDefault()

          const groupId = handleElement.getAttribute('data-panel-group-id')
          assert(groupId)

          const handles = getResizeHandleElementsForGroup(
            groupId,
            _panelGroupElement,
          )
          const index = getResizeHandleElementIndex(
            groupId,
            handleId,
            _panelGroupElement,
          )

          assert(index !== null)

          const nextIndex = event.shiftKey
            ? index > 0
              ? index - 1
              : handles.length - 1
            : index + 1 < handles.length
              ? index + 1
              : 0

          const nextHandle = handles[nextIndex] as HTMLElement
          nextHandle.focus()

          break
        }
      }
    }

    handleElement.addEventListener('keydown', onKeyDown)
    onCleanup(() => {
      handleElement.removeEventListener('keydown', onKeyDown)
    })
  })
}
