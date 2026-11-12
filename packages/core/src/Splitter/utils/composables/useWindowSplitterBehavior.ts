import type { Ref } from 'vue'
import type { ResizeHandler } from '../types'
import { watchEffect } from 'vue'
import { assert } from '../assert'
import { getResizeHandleElementsForGroup } from '../dom'

// https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/

export function useWindowSplitterResizeHandlerBehavior({
  disabled,
  handleId,
  resizeHandler,
  panelGroupElement,
  element,
}: {
  disabled: Ref<boolean>
  handleId: string
  resizeHandler: Ref<ResizeHandler | null>
  panelGroupElement: Ref<ParentNode | null>
  element: Ref<HTMLElement | null>
}): void {
  watchEffect((onCleanup) => {
    const _panelGroupElement = panelGroupElement.value
    const handleElement = element.value
    if (!_panelGroupElement || !handleElement)
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
          // A disabled handle stays tabbable and still takes F6, but does not resize.
          if (disabled.value || resizeHandler.value === null)
            break

          event.preventDefault()

          resizeHandler.value?.(event)
          break
        }
        case 'F6': {
          event.preventDefault()

          const groupId = handleElement.getAttribute('data-panel-group-id')
          assert(groupId)

          // Skip disabled handles, which ignore the keyboard and pointer anyway.
          const handles = getResizeHandleElementsForGroup(
            groupId,
            _panelGroupElement,
          ).filter(handle => handle === handleElement || !handle.hasAttribute('data-disabled'))
          const index = handles.findIndex(
            handle => handle.getAttribute('data-panel-resize-handle-id') === handleId,
          )

          assert(index !== -1)

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
