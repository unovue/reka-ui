import type { Ref } from 'vue'
import type { PanelData } from '../../SplitterPanel.vue'
import { watchEffect } from 'vue'
import { assert } from '../assert'
import { calculateAriaValues } from '../calculate'
import { fuzzyNumbersEqual } from '../compare'
import { getPanelGroupElement, getResizeHandleElementsForGroup, getResizeHandlePanelIds } from '../dom'
import { adjustLayoutByDelta, compareLayouts } from '../layout'
import { determinePivotIndices } from '../pivot'

// https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/

export function useWindowSplitterPanelGroupBehavior({
  eagerValuesRef,
  groupId,
  layout,
  panelDataArray,
  panelGroupElement,
  resizeHandleRegistration,
  commitLayout,
  getPanelDataWithPercentConstraints,
}: {
  eagerValuesRef: Ref<{
    panelDataArray: PanelData[]
  }>
  groupId: string
  layout: Ref<number[]>
  panelDataArray: PanelData[]
  panelGroupElement: Ref<ParentNode | null>
  resizeHandleRegistration: Ref<number>
  commitLayout: (sizes: number[], reason: 'keyboard', event: KeyboardEvent) => void
  getPanelDataWithPercentConstraints: (groupSizeOverride?: number | null) => PanelData[] | null
}): void {
  watchEffect((onCleanup) => {
    // Re-run when a handle mounts on its own (e.g. with v-if), so it gets its aria-* attributes.
    void resizeHandleRegistration.value

    const _panelGroupElement = panelGroupElement.value
    if (!_panelGroupElement)
      return

    const panelDataArrayWithPercentConstraints = getPanelDataWithPercentConstraints()
    if (!panelDataArrayWithPercentConstraints)
      return

    const resizeHandleElements = getResizeHandleElementsForGroup(
      groupId,
      _panelGroupElement,
    )

    for (let index = 0; index < panelDataArrayWithPercentConstraints.length - 1; index++) {
      const { valueMax, valueMin, valueNow } = calculateAriaValues({
        layout: layout.value,
        panelsArray: panelDataArrayWithPercentConstraints,
        pivotIndices: [index, index + 1],
      })

      const resizeHandleElement = resizeHandleElements[index]
      if (resizeHandleElement == null) {
        if (import.meta.env.DEV)
          console.warn(`WARNING: Missing resize handle for PanelGroup "${groupId}"`)
      }
      else {
        const panelData = panelDataArrayWithPercentConstraints[index]
        assert(panelData)

        resizeHandleElement.setAttribute('aria-controls', panelData.id)
        resizeHandleElement.setAttribute(
          'aria-valuemax',
          `${Math.round(valueMax)}`,
        )
        resizeHandleElement.setAttribute(
          'aria-valuemin',
          `${Math.round(valueMin)}`,
        )
        resizeHandleElement.setAttribute(
          'aria-valuenow',
          valueNow != null ? `${Math.round(valueNow)}` : '',
        )
      }
    }

    onCleanup(() => {
      resizeHandleElements.forEach((resizeHandleElement) => {
        resizeHandleElement.removeAttribute('aria-controls')
        resizeHandleElement.removeAttribute('aria-valuemax')
        resizeHandleElement.removeAttribute('aria-valuemin')
        resizeHandleElement.removeAttribute('aria-valuenow')
      })
    })
  })

  watchEffect((onCleanup) => {
    // Re-run when a handle mounts on its own (e.g. with v-if), so Enter toggles collapse on it.
    void resizeHandleRegistration.value

    const _panelGroupElement = panelGroupElement.value
    if (!_panelGroupElement)
      return

    const eagerValues = eagerValuesRef.value
    assert(eagerValues)

    const panelDataArrayWithPercentConstraints = getPanelDataWithPercentConstraints()
    if (!panelDataArrayWithPercentConstraints)
      return

    const { panelDataArray } = eagerValues
    const groupElement = getPanelGroupElement(groupId, _panelGroupElement)
    assert(groupElement != null, `No group found for id "${groupId}"`)

    const handles = getResizeHandleElementsForGroup(groupId, _panelGroupElement)
    assert(handles)

    const cleanupFunctions = handles.map((handle) => {
      const handleId = handle.getAttribute('data-panel-resize-handle-id')
      assert(handleId)

      const [idBefore, idAfter] = getResizeHandlePanelIds(
        groupId,
        handleId,
        panelDataArray,
        _panelGroupElement,
      )
      if (idBefore == null || idAfter == null)
        return () => {}

      const onKeyDown = (event: KeyboardEvent) => {
        // A disabled handle ignores arrow keys and dragging, so it ignores Enter too.
        if (event.defaultPrevented || handle.hasAttribute('data-disabled'))
          return

        switch (event.key) {
          case 'Enter': {
            event.preventDefault()

            const index = panelDataArrayWithPercentConstraints.findIndex(
              panelData => panelData.id === idBefore,
            )
            if (index >= 0) {
              const panelData = panelDataArrayWithPercentConstraints[index]
              assert(panelData)

              const size = layout.value[index]

              const {
                collapsedSize = 0,
                collapsible,
                minSize = 0,
              } = panelData.constraints

              if (size != null && collapsible) {
                const nextLayout = adjustLayoutByDelta({
                  delta: fuzzyNumbersEqual(size, collapsedSize)
                    ? minSize - collapsedSize
                    : collapsedSize - size,
                  layout: layout.value,
                  panelConstraints: panelDataArrayWithPercentConstraints.map(
                    panelData => panelData.constraints,
                  ),
                  pivotIndices: determinePivotIndices(
                    groupId,
                    handleId,
                    _panelGroupElement,
                  ),
                  trigger: 'keyboard',
                })
                // Through the group's change path, so the toggle emits like
                // any other resize and keeps the eager layout in sync.
                if (!compareLayouts(layout.value, nextLayout))
                  commitLayout(nextLayout, 'keyboard', event)
              }
            }
            break
          }
        }
      }

      handle.addEventListener('keydown', onKeyDown)
      return () => {
        handle.removeEventListener('keydown', onKeyDown)
      }
    })

    onCleanup(() => {
      cleanupFunctions.forEach(cleanupFunction => cleanupFunction())
    })
  })
}
