import type { CSSProperties, MaybeRefOrGetter, Ref } from 'vue'
import type { PanelGroupContext, PanelGroupStorage } from './SplitterGroup.vue'
import type { PanelConstraints, PanelData } from './SplitterPanel.vue'
import type { Direction, DragState, ResizeEvent } from './utils/types'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import { computed, nextTick, ref, toValue, watch, watchEffect } from 'vue'
import { areEqual, createPartSurface, useControllableState } from '@/shared'
import { assert } from './utils/assert'
import { calculateDeltaPercentage, calculateUnsafeDefaultLayout } from './utils/calculate'
import { callPanelCallbacks } from './utils/callPanelCallbacks'
import { fuzzyCompareNumbers, fuzzyNumbersEqual } from './utils/compare'
import { useWindowSplitterPanelGroupBehavior } from './utils/composables/useWindowSplitterPanelGroupBehavior'
import debounce from './utils/debounce'
import { getResizeHandleElement } from './utils/dom'
import { getResizeEventCursorPosition, isKeyDown, isMouseEvent, isTouchEvent } from './utils/events'
import { adjustLayoutByDelta, compareLayouts } from './utils/layout'
import { determinePivotIndices } from './utils/pivot'
import {
  EXCEEDED_HORIZONTAL_MAX,
  EXCEEDED_HORIZONTAL_MIN,
  EXCEEDED_VERTICAL_MAX,
  EXCEEDED_VERTICAL_MIN,
  reportConstraintsViolation,
} from './utils/registry'
import { initializeDefaultStorage, loadPanelGroupState, savePanelGroupState } from './utils/storage'
import { computePanelFlexBoxStyle } from './utils/style'
import { convertPanelConstraintsToPercent, hasPixelSizedPanel, recalculateLayoutForPixelPanels } from './utils/units'
import { validatePanelGroupLayout } from './utils/validation'

/**
 * Why a Splitter layout changed:
 * - `drag`: a pointer drag on a resize handle;
 * - `keyboard`: arrow keys, Home/End or Enter (collapse toggle) on a resize handle;
 * - `panel-change`: the layout was (re)computed because panels registered,
 *   unregistered or changed their constraints (this includes the initial
 *   layout, a layout restored from `storage`, and a controlled layout corrected
 *   to fit the constraints);
 * - `group-resize`: the group resized and `px` panels kept their pixel size.
 *
 * The panel `collapse()` / `expand()` / `resize()` methods report the shared
 * `'imperative-action'`.
 *
 * Only `drag`, `keyboard` and `imperative-action` are cancellable.
 * `panel-change` and `group-resize` are structural: they skip
 * `beforeUpdate:layout` and are always applied.
 */
export type SplitterLayoutChangeReason = 'drag' | 'keyboard' | 'panel-change' | 'group-resize'

export type SplitterGroupState = { orientation: Direction }

const LOCAL_STORAGE_DEBOUNCE_INTERVAL = 100

export const defaultStorage: PanelGroupStorage = {
  getItem: (name: string) => {
    initializeDefaultStorage(defaultStorage)
    return defaultStorage.getItem(name)
  },
  setItem: (name: string, value: string) => {
    initializeDefaultStorage(defaultStorage)
    defaultStorage.setItem(name, value)
  },
}

const debounceMap: {
  [key: string]: typeof savePanelGroupState
} = {}

let count = 0

export interface UseSplitterProps {
  /** The group orientation. */
  direction: MaybeRefOrGetter<Direction>
  /**
   * Group id. The component passes a `useId` value; the standalone default is
   * a per-call counter that is not SSR-stable, so pass one when rendering on the server.
   */
  id?: string
  /** Unique id used to auto-save the layout through `storage`. */
  autoSaveId?: MaybeRefOrGetter<string | null | undefined>
  /** Step size of an arrow-key resize, in percent. Defaults to `10`. */
  keyboardResizeBy?: MaybeRefOrGetter<number | null | undefined>
  /** Storage for `autoSaveId`; defaults to `localStorage`. */
  storage?: MaybeRefOrGetter<PanelGroupStorage | undefined>
  /** Reading direction; RTL flips horizontal keyboard and pointer deltas. */
  dir?: MaybeRefOrGetter<'ltr' | 'rtl' | undefined>
  /** The group element. */
  element: Readonly<Ref<HTMLElement | null | undefined>>
  /**
   * Controlled layout, one size per panel in the panel's `sizeUnit` (the same
   * values `@layout` reports). A getter/ref resolving to `undefined` is uncontrolled.
   */
  layout?: MaybeRefOrGetter<number[] | undefined>
  /** Component `emit`; receives `beforeUpdate:layout` then `update:layout`. */
  emit?: (event: any, ...args: any[]) => void
  /** Called before a `drag`, `keyboard` or `imperative-action` change commits; `details.cancel()` vetoes it. */
  onBeforeUpdate?: (value: number[], details: ChangeEventDetails<SplitterLayoutChangeReason>) => void
  /** Called after a layout change commits. */
  onUpdate?: (value: number[], details: ChangeEventDetails<SplitterLayoutChangeReason>) => void
  /** Called whenever the applied layout changes (the component's `@layout`). */
  onLayout?: (value: number[]) => void
}

export interface UseSplitterReturn {
  /** The applied layout, in percent of the group for every panel. */
  layout: Readonly<Ref<number[]>>
  /** The layout model, in each panel's `sizeUnit` (what `update:layout` carries). */
  modelValue: Readonly<Ref<number[]>>
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<SplitterLayoutChangeReason>>>
  isControlled: Readonly<Ref<boolean>>
  groupId: string
  root: PartSurface<SplitterGroupState>
  context: PanelGroupContext
}

function findPanelDataIndex(panelDataArray: PanelData[], panelData: PanelData) {
  return panelDataArray.findIndex(
    prevPanelData =>
      prevPanelData === panelData || prevPanelData.id === panelData.id,
  )
}

function layoutsFuzzyEqual(a: number[] | undefined, b: number[] | undefined) {
  return !!a && !!b && a.length === b.length && a.every((size, index) => fuzzyNumbersEqual(size, b[index]!))
}

/**
 * Headless Splitter group: the layout model, constraints, storage, drag and
 * keyboard resizing, and the context the panels and resize handles register with.
 *
 * Every layout change goes through one model: `update:layout(value, details)`,
 * emitted only when the layout (in panel units) actually changes. User changes
 * run a cancellable `beforeUpdate:layout` first and, when controlled, apply
 * once the parent echoes them; structural changes are always applied (see
 * `SplitterLayoutChangeReason`). `onLayout` keeps the v2 `@layout` contract:
 * it reports every applied layout.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — owns watchers and a ResizeObserver; call it inside `setup()`.
 */
export function useSplitter(props: UseSplitterProps): UseSplitterReturn {
  const groupId = props.id ?? `reka-splitter-group-${++count}`
  const direction = computed(() => toValue(props.direction))
  const panelGroupElementRef = props.element as Ref<HTMLElement | null>

  const dragState = ref<DragState | null>(null)
  const groupSizeInPixels = ref<number | null>(null)
  const groupSizeAtLastLayoutInit = ref<number | null>(null)
  const layout = ref<number[]>([])
  const panelIdToLastNotifiedSizeMapRef = ref<Record<string, number>>({})
  const panelSizeBeforeCollapseRef = ref<Map<string, number>>(new Map())
  const prevDeltaRef = ref<number>(0)

  const committedValuesRef = computed(() => ({
    autoSaveId: toValue(props.autoSaveId) ?? null,
    direction: direction.value,
    dragState: dragState.value,
    id: groupId,
    keyboardResizeBy: toValue(props.keyboardResizeBy) ?? 10,
    storage: toValue(props.storage) ?? defaultStorage,
  }))

  const eagerValuesRef = ref<{
    layout: number[]
    panelDataArray: PanelData[]
    panelDataArrayChanged: boolean
  }>({
    layout: layout.value,
    panelDataArray: [],
    panelDataArrayChanged: false,
  })

  function getGroupSizeInPixels(): number | null {
    if (groupSizeInPixels.value != null)
      return groupSizeInPixels.value

    const element = panelGroupElementRef.value
    if (element && element instanceof HTMLElement) {
      const rect = element.getBoundingClientRect()
      const size = direction.value === 'horizontal' ? rect.width : rect.height

      if (!Number.isNaN(size)) {
        groupSizeInPixels.value = size
        return size
      }
    }

    return null
  }

  function getPanelConstraintsInPercent(groupSizeOverride?: number | null) {
    const groupSize = groupSizeOverride ?? getGroupSizeInPixels()

    return convertPanelConstraintsToPercent({
      panelDataArray: eagerValuesRef.value.panelDataArray,
      groupSizeInPixels: groupSize,
    })
  }

  function getPanelDataWithPercentConstraints(groupSizeOverride?: number | null) {
    const percentConstraints = getPanelConstraintsInPercent(groupSizeOverride)

    if (!percentConstraints)
      return null

    return eagerValuesRef.value.panelDataArray.map((panelData, index) => ({
      ...panelData,
      constraints: percentConstraints[index],
    }))
  }

  /** Convert internal layout (always in %) to native units for each panel */
  function convertLayoutToNativeUnits(internalLayout: number[]): number[] {
    const { panelDataArray } = eagerValuesRef.value
    const groupSize = getGroupSizeInPixels()

    return internalLayout.map((size, index) => {
      const panelData = panelDataArray[index]
      if (panelData && (panelData.constraints.sizeUnit ?? '%') === 'px' && groupSize != null)
        return (size / 100) * groupSize
      return size
    })
  }

  /** Convert a layout in native units (the model) to the internal percent layout */
  function convertLayoutToPercent(nativeLayout: number[]): number[] {
    const { panelDataArray } = eagerValuesRef.value
    const groupSize = getGroupSizeInPixels()

    return nativeLayout.map((size, index) => {
      const panelData = panelDataArray[index]
      if (panelData && (panelData.constraints.sizeUnit ?? '%') === 'px' && groupSize)
        return (size / groupSize) * 100
      return size
    })
  }

  // Structural changes (`panel-change`, `group-resize`) and constraint
  // corrections are not requests the parent may refuse: the group must always
  // hold a valid layout. They skip the `beforeUpdate` phase, so they cannot be
  // cancelled, and still emit `update:layout` so the model follows.
  let structural = false
  const { emit, onBeforeUpdate, onUpdate } = props
  const { state: modelValue, setState, lastChangeDetails, isControlled } = useControllableState<number[], SplitterLayoutChangeReason>({
    prop: props.layout,
    defaultValue: () => [],
    onBeforeUpdate: (value, details) => {
      if (structural)
        return
      onBeforeUpdate?.(value, details)
      emit?.('beforeUpdate:layout', value, details)
    },
    // Only with a listener: a bare writable ref stays the model's single store.
    onUpdate: emit || onUpdate
      ? (value, details) => {
          onUpdate?.(value, details)
          emit?.('update:layout', value, details)
        }
      : undefined,
    isEqual: layoutsFuzzyEqual,
  })

  /** Writes the applied layout and notifies `@layout` and the panel callbacks. */
  function applyLayout(nextLayout: number[]) {
    layout.value = nextLayout
    eagerValuesRef.value.layout = nextLayout
    props.onLayout?.(convertLayoutToNativeUnits(nextLayout))

    callPanelCallbacks(
      eagerValuesRef.value.panelDataArray,
      nextLayout,
      panelIdToLastNotifiedSizeMapRef.value,
      getGroupSizeInPixels(),
    )
  }

  // A controlled change waits for the parent to echo the model back; keep the
  // exact percent layout so the echo does not round-trip through px.
  let pendingLayout: number[] | null = null

  /**
   * The single change path. A change in panel units runs the model; a change
   * that only moves percentages (a `px` group resizing) is applied without a
   * model emit, as the model value did not change.
   *
   * `drag`, `keyboard` and `imperative-action` are requests: cancellable, and
   * in controlled mode applied once the parent echoes them. `panel-change` and
   * `group-resize` are structural: always applied, never cancellable, and
   * emitted so the model follows.
   */
  function commitLayout(nextLayout: number[], reason: SplitterLayoutChangeReason | BaseChangeReason, event?: Event) {
    const nativeLayout = convertLayoutToNativeUnits(nextLayout)
    if (!layoutsFuzzyEqual(nativeLayout, modelValue.value)) {
      const isStructural = reason === 'panel-change' || reason === 'group-resize'
      const controlled = isControlled.value
      structural = isStructural
      const committed = setState(nativeLayout, reason, event)
      structural = false
      if (controlled)
        pendingLayout = nextLayout
      if (!isStructural && (!committed || controlled))
        return
    }
    applyLayout(nextLayout)
  }

  // Controlled: apply the layout the parent passes in. A layout the
  // constraints correct is applied as corrected and the correction emitted.
  watch(() => toValue(props.layout), (value) => {
    const pending = pendingLayout
    pendingLayout = null
    const { panelDataArray } = eagerValuesRef.value
    if (!isControlled.value || !value || !panelDataArray.length)
      return
    if (value.length !== panelDataArray.length) {
      // Re-checked after the flush: a panel added in the same tick as its size
      // registers only once mounted, and then picks the layout up itself.
      // eslint-disable-next-line node/prefer-global/process
      if (process.env.NODE_ENV !== 'production') {
        nextTick(() => {
          const count = eagerValuesRef.value.panelDataArray.length
          if (toValue(props.layout)?.length !== count)
            console.warn(`[reka-ui] SplitterGroup: \`layout\` has ${value.length} sizes for ${count} panels; it is ignored.`)
        })
      }
      return
    }

    let nextLayout = pending
    if (!pending || !layoutsFuzzyEqual(convertLayoutToNativeUnits(pending), value)) {
      const panelConstraints = getPanelConstraintsInPercent()
      if (!panelConstraints)
        return
      nextLayout = validatePanelGroupLayout({ layout: convertLayoutToPercent(value), panelConstraints })
    }
    if (!layoutsFuzzyEqual(convertLayoutToNativeUnits(nextLayout!), value))
      commitLayout(nextLayout!, 'panel-change')
    else if (!compareLayouts(layout.value, nextLayout!))
      applyLayout(nextLayout!)
  }, { deep: true })

  useWindowSplitterPanelGroupBehavior({
    eagerValuesRef,
    groupId,
    layout,
    panelDataArray: eagerValuesRef.value.panelDataArray,
    commitLayout,
    panelGroupElement: panelGroupElementRef,
    getPanelDataWithPercentConstraints,
  })

  watchEffect((onCleanup) => {
    const element = panelGroupElementRef.value
    if (!element)
      return

    if (typeof ResizeObserver !== 'function')
      return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry)
        return

      const { height, width } = entry.contentRect
      const nextSize = direction.value === 'horizontal' ? width : height

      if (!Number.isNaN(nextSize))
        groupSizeInPixels.value = nextSize
    })

    if (element instanceof HTMLElement)
      resizeObserver.observe(element)

    onCleanup(() => resizeObserver.disconnect())
  })

  watchEffect(() => {
    const { panelDataArray } = eagerValuesRef.value
    const autoSaveId = toValue(props.autoSaveId)
    // If this panel has been configured to persist sizing information, save sizes to local storage.
    // A controlled layout is owned by the parent, so storage is neither read nor written.
    if (autoSaveId && !isControlled.value) {
      if (layout.value.length === 0 || layout.value.length !== panelDataArray.length)
        return

      let debouncedSave = debounceMap[autoSaveId]

      // Limit the frequency of localStorage updates.
      if (!debouncedSave) {
        debouncedSave = debounce(
          savePanelGroupState,
          LOCAL_STORAGE_DEBOUNCE_INTERVAL,
        )

        debounceMap[autoSaveId] = debouncedSave
      }

      // Clone mutable data before passing to the debounced function,
      // else we run the risk of saving an incorrect combination of mutable and immutable values to state.
      const clonedPanelDataArray = [...panelDataArray]
      const clonedPanelSizesBeforeCollapse = new Map(
        panelSizeBeforeCollapseRef.value,
      )

      debouncedSave(
        autoSaveId,
        clonedPanelDataArray,
        clonedPanelSizesBeforeCollapse,
        layout.value,
        committedValuesRef.value.storage,
      )
    }
  })

  function getPanelStyle(panelData: PanelData, defaultSize: number | undefined): CSSProperties {
    const { panelDataArray } = eagerValuesRef.value

    const panelIndex = findPanelDataIndex(panelDataArray, panelData)

    return computePanelFlexBoxStyle({
      defaultSize,
      dragState: dragState.value,
      layout: layout.value,
      panelData: panelDataArray,
      panelIndex,
    })
  }

  function registerPanel(panelData: PanelData) {
    const { panelDataArray } = eagerValuesRef.value

    panelDataArray.push(panelData)
    panelDataArray.sort((panelA, panelB) => {
      const orderA = panelA.order
      const orderB = panelB.order
      if (orderA == null && orderB == null)
        return 0
      else if (orderA == null)
        return -1
      else if (orderB == null)
        return 1
      else
        return orderA - orderB
    })

    eagerValuesRef.value.panelDataArrayChanged = true
  }

  // (Re)calculate group layout whenever panels are registered or unregistered.
  watch(() => eagerValuesRef.value.panelDataArrayChanged, () => {
    if (eagerValuesRef.value.panelDataArrayChanged) {
      eagerValuesRef.value.panelDataArrayChanged = false

      const { autoSaveId, storage } = committedValuesRef.value
      const { layout: prevLayout, panelDataArray } = eagerValuesRef.value

      // A controlled layout wins over storage and the panels' default sizes.
      let unsafeLayout: number[] | null = null
      const controlledLayout = toValue(props.layout)
      if (isControlled.value && controlledLayout?.length === panelDataArray.length)
        unsafeLayout = convertLayoutToPercent(controlledLayout)

      // If this panel has been configured to persist sizing information,
      // default size should be restored from local storage if possible.
      if (unsafeLayout === null && autoSaveId && !isControlled.value) {
        const state = loadPanelGroupState(autoSaveId, panelDataArray, storage)
        if (state) {
          panelSizeBeforeCollapseRef.value = new Map(
            Object.entries(state.expandToSizes),
          )
          unsafeLayout = state.layout
        }
      }

      if (unsafeLayout === null) {
        const panelDataArrayWithPercentConstraints = getPanelDataWithPercentConstraints()
        if (!panelDataArrayWithPercentConstraints)
          return

        unsafeLayout = calculateUnsafeDefaultLayout({
          panelDataArray: panelDataArrayWithPercentConstraints,
        })
      }

      const panelConstraints = getPanelConstraintsInPercent()
      if (!panelConstraints)
        return

      // Validate even saved layouts in case something has changed since last render
      // e.g. for pixel groups, this could be the size of the window
      const nextLayout = validatePanelGroupLayout({
        layout: unsafeLayout,
        panelConstraints,
      })

      // Track the group size used for this initialization.
      // Used to detect when a nested px group was measured with an unreliable (too small)
      // container size before the outer group finished layout.
      groupSizeAtLastLayoutInit.value = getGroupSizeInPixels()

      if (!areEqual(prevLayout, nextLayout))
        commitLayout(nextLayout, 'panel-change')
    }
  })

  watch(groupSizeInPixels, (nextSize, prevSize) => {
    if (prevSize == null || nextSize == null)
      return

    const { layout: prevLayout, panelDataArray } = eagerValuesRef.value
    if (prevLayout.length === 0)
      return
    if (!hasPixelSizedPanel(panelDataArray))
      return

    // Detect if the layout was initialized with an unreliably small container.
    // This happens with nested SplitterGroups using sizeUnit="px": the inner group's
    // ResizeObserver fires before the outer group's flex layout completes, giving a
    // near-zero container size (e.g. 3.45px). When the outer group finishes and the
    // container grows to its real size (e.g. 923px), we must re-initialize rather
    // than recalculate (which would "preserve" the garbage pixel sizes from 3.45px).
    // We guard with initSize < 50 so that legitimately small-but-real containers
    // (e.g. a sidebar at 60px) are not accidentally re-initialized on normal resizes.
    const initSize = groupSizeAtLastLayoutInit.value
    if (initSize != null && initSize > 0 && initSize < 50 && nextSize > initSize * 10) {
      eagerValuesRef.value.panelDataArrayChanged = true
      return
    }

    const recalculatedLayout = recalculateLayoutForPixelPanels({
      layout: prevLayout,
      panelDataArray,
      prevGroupSize: prevSize,
      nextGroupSize: nextSize,
    })

    if (!recalculatedLayout)
      return

    const panelConstraints = getPanelConstraintsInPercent(nextSize)
    if (!panelConstraints)
      return

    const nextLayout = validatePanelGroupLayout({
      layout: recalculatedLayout,
      panelConstraints,
    })

    if (!compareLayouts(prevLayout, nextLayout))
      commitLayout(nextLayout, 'group-resize')
  })

  function registerResizeHandle(dragHandleId: string) {
    return function resizeHandler(event: ResizeEvent) {
      event.preventDefault()
      const panelGroupElement = panelGroupElementRef.value
      if (!panelGroupElement)
        return () => null

      const { direction, dragState, id: groupId, keyboardResizeBy } = committedValuesRef.value
      const { layout: prevLayout } = eagerValuesRef.value

      const { initialLayout } = dragState ?? {}

      const pivotIndices = determinePivotIndices(
        groupId,
        dragHandleId,
        panelGroupElement,
      )

      let delta = calculateDeltaPercentage(
        event,
        dragHandleId,
        direction,
        dragState,
        keyboardResizeBy,
        panelGroupElement,
      )
      if (delta === 0)
        return

      // Support RTL layouts
      const isHorizontal = direction === 'horizontal'
      if (toValue(props.dir) === 'rtl' && isHorizontal)
        delta = -delta

      const panelConstraints = getPanelConstraintsInPercent()
      if (!panelConstraints)
        return

      const nextLayout = adjustLayoutByDelta({
        delta,
        layout: initialLayout ?? prevLayout,
        panelConstraints,
        pivotIndices,
        trigger: isKeyDown(event) ? 'keyboard' : 'mouse-or-touch',
      })

      const layoutChanged = !compareLayouts(prevLayout, nextLayout)

      // Only update the cursor for layout changes triggered by touch/mouse events (not keyboard)
      // Update the cursor even if the layout hasn't changed (we may need to show an invalid cursor state)
      if (isMouseEvent(event) || isTouchEvent(event)) {
        // Watch for multiple subsequent deltas; this might occur for tiny cursor movements.
        // In this case, Panel sizes might not change–
        // but updating cursor in this scenario would cause a flicker.
        if (prevDeltaRef.value !== delta) {
          prevDeltaRef.value = delta

          if (!layoutChanged) {
            // If the pointer has moved too far to resize the panel any further, note this so we can update the cursor.
            // This mimics VS Code behavior.
            if (isHorizontal) {
              reportConstraintsViolation(
                dragHandleId,
                delta < 0 ? EXCEEDED_HORIZONTAL_MIN : EXCEEDED_HORIZONTAL_MAX,
              )
            }
            else {
              reportConstraintsViolation(
                dragHandleId,
                delta < 0 ? EXCEEDED_VERTICAL_MIN : EXCEEDED_VERTICAL_MAX,
              )
            }
          }
          else {
            reportConstraintsViolation(dragHandleId, 0)
          }
        }
      }

      if (layoutChanged)
        commitLayout(nextLayout, isKeyDown(event) ? 'keyboard' : 'drag', event)
    }
  }

  function panelDataHelper(
    panelDataArray: PanelData[],
    panelData: PanelData,
    layout: number[],
    panelConstraints?: PanelConstraints[] | null,
  ) {
    const panelIndex = findPanelDataIndex(panelDataArray, panelData)

    const isLastPanel = panelIndex === panelDataArray.length - 1
    const pivotIndices = isLastPanel
      ? [panelIndex - 1, panelIndex]
      : [panelIndex, panelIndex + 1]

    const constraints = panelConstraints ?? getPanelConstraintsInPercent()
    const panelConstraintsFromGroup = constraints?.[panelIndex]

    const panelSize = layout[panelIndex]

    return {
      ...(panelConstraintsFromGroup ?? panelData.constraints),
      panelSize,
      pivotIndices,
    }
  }

  function resizePanel(panelData: PanelData, unsafePanelSize: number, reason: SplitterLayoutChangeReason | BaseChangeReason = 'imperative-action') {
    const { layout: prevLayout, panelDataArray } = eagerValuesRef.value

    const panelConstraintsArray = getPanelConstraintsInPercent()
    if (!panelConstraintsArray)
      return

    const panelIndex = findPanelDataIndex(panelDataArray, panelData)
    const panelUnit = panelData.constraints.sizeUnit ?? '%'

    // Convert px to percent if needed for internal calculation
    let sizeInPercent = unsafePanelSize
    if (panelUnit === 'px') {
      const groupSize = getGroupSizeInPixels()
      if (groupSize != null)
        sizeInPercent = (unsafePanelSize / groupSize) * 100
    }

    const { panelSize, pivotIndices } = panelDataHelper(
      panelDataArray,
      panelData,
      prevLayout,
      panelConstraintsArray,
    )

    assert(panelSize != null)

    const isLastPanel = panelIndex === panelDataArray.length - 1
    const delta = isLastPanel
      ? panelSize - sizeInPercent
      : sizeInPercent - panelSize

    const nextLayout = adjustLayoutByDelta({
      delta,
      layout: prevLayout,
      panelConstraints: panelConstraintsArray,
      pivotIndices,
      trigger: 'imperative-api',
    })

    if (!compareLayouts(prevLayout, nextLayout))
      commitLayout(nextLayout, reason)
  }

  function reevaluatePanelConstraints(panelData: PanelData, _prevConstraints: PanelConstraints) {
    const { layout, panelDataArray } = eagerValuesRef.value
    const index = findPanelDataIndex(panelDataArray, panelData)
    panelDataArray[index] = panelData
    eagerValuesRef.value.panelDataArrayChanged = true

    const panelConstraintsArray = getPanelConstraintsInPercent()
    if (!panelConstraintsArray)
      return

    const nextConstraints = panelConstraintsArray[index]
    const { panelSize: prevPanelSize } = panelDataHelper(
      panelDataArray,
      panelData,
      layout,
      panelConstraintsArray,
    )

    if (prevPanelSize === null)
      return

    const nextCollapsedSize = nextConstraints?.collapsedSize ?? 0
    const nextMaxSize = nextConstraints?.maxSize ?? 100
    const nextMinSize = nextConstraints?.minSize ?? 0

    if (nextConstraints?.collapsible && isPanelCollapsed(panelData)) {
      if (prevPanelSize !== nextCollapsedSize)
        resizePanel(panelData, nextCollapsedSize, 'panel-change')
    }
    else if (prevPanelSize < nextMinSize) {
      resizePanel(panelData, nextMinSize, 'panel-change')
    }
    else if (prevPanelSize > nextMaxSize) {
      resizePanel(panelData, nextMaxSize, 'panel-change')
    }
  }

  function startDragging(dragHandleId: string, event: ResizeEvent) {
    const { direction } = committedValuesRef.value
    const { layout } = eagerValuesRef.value
    if (!panelGroupElementRef.value)
      return

    const handleElement = getResizeHandleElement(
      dragHandleId,
      panelGroupElementRef.value,
    )
    assert(handleElement)

    const initialCursorPosition = getResizeEventCursorPosition(
      direction,
      event,
    )

    dragState.value = {
      dragHandleId,
      dragHandleRect: handleElement.getBoundingClientRect(),
      initialCursorPosition,
      initialLayout: layout,
    }
  }

  function stopDragging() {
    dragState.value = null
  }

  function unregisterPanel(panelData: PanelData) {
    const { panelDataArray } = eagerValuesRef.value

    const index = findPanelDataIndex(panelDataArray, panelData)
    if (index >= 0) {
      panelDataArray.splice(index, 1)

      // TRICKY
      // When a panel is removed from the group, we should delete the most recent prev-size entry for it.
      // If we don't do this, then a conditionally rendered panel might not call onResize when it's re-mounted.
      // Strict effects mode makes this tricky though because all panels will be registered, unregistered, then re-registered on mount.
      delete panelIdToLastNotifiedSizeMapRef.value[panelData.id]

      eagerValuesRef.value.panelDataArrayChanged = true
    }
  }

  function collapsePanel(panelData: PanelData) {
    const { layout: prevLayout, panelDataArray } = eagerValuesRef.value

    if (panelData.constraints.collapsible) {
      const panelConstraintsArray = getPanelConstraintsInPercent()
      if (!panelConstraintsArray)
        return

      const {
        collapsedSize = 0,
        panelSize,
        pivotIndices,
      } = panelDataHelper(panelDataArray, panelData, prevLayout, panelConstraintsArray)

      assert(
        panelSize != null,
        `Panel size not found for panel "${panelData.id}"`,
      )

      if (panelSize !== collapsedSize) {
        // Store size before collapse;
        // This is the size that gets restored if the expand() API is used.
        const sizeUnit = panelData.constraints.sizeUnit ?? '%'
        const groupSize = groupSizeInPixels.value ?? getGroupSizeInPixels()
        const sizeBeforeCollapse = sizeUnit === 'px' && groupSize
          ? (panelSize / 100) * groupSize
          : panelSize

        panelSizeBeforeCollapseRef.value.set(panelData.id, sizeBeforeCollapse)

        const isLastPanel
          = findPanelDataIndex(panelDataArray, panelData)
            === panelDataArray.length - 1
        const delta = isLastPanel
          ? panelSize - collapsedSize
          : collapsedSize - panelSize

        const nextLayout = adjustLayoutByDelta({
          delta,
          layout: prevLayout,
          panelConstraints: panelConstraintsArray,
          pivotIndices,
          trigger: 'imperative-api',
        })

        if (!compareLayouts(prevLayout, nextLayout))
          commitLayout(nextLayout, 'imperative-action')
      }
    }
  }

  function expandPanel(panelData: PanelData) {
    const { layout: prevLayout, panelDataArray } = eagerValuesRef.value

    if (panelData.constraints.collapsible) {
      const panelConstraintsArray = getPanelConstraintsInPercent()
      if (!panelConstraintsArray)
        return

      const {
        collapsedSize = 0,
        panelSize = 0,
        minSize = 0,
        pivotIndices,
      } = panelDataHelper(panelDataArray, panelData, prevLayout, panelConstraintsArray)

      if (fuzzyCompareNumbers(panelSize, collapsedSize) <= 0) {
        // Restore this panel to the size it was before it was collapsed, if possible.
        const prevPanelSize = panelSizeBeforeCollapseRef.value.get(
          panelData.id,
        )
        const sizeUnit = panelData.constraints.sizeUnit ?? '%'
        const groupSize = groupSizeInPixels.value ?? getGroupSizeInPixels()

        const restoredSize
          = sizeUnit === 'px' && groupSize
            ? prevPanelSize != null
              ? (prevPanelSize / groupSize) * 100
              : null
            : prevPanelSize

        const baseSize
          = restoredSize != null && restoredSize >= minSize
            ? restoredSize
            : minSize

        const isLastPanel
          = findPanelDataIndex(panelDataArray, panelData)
            === panelDataArray.length - 1
        const delta = isLastPanel ? panelSize - baseSize : baseSize - panelSize

        const nextLayout = adjustLayoutByDelta({
          delta,
          layout: prevLayout,
          panelConstraints: panelConstraintsArray,
          pivotIndices,
          trigger: 'imperative-api',
        })

        if (!compareLayouts(prevLayout, nextLayout))
          commitLayout(nextLayout, 'imperative-action')
      }
    }
  }

  function getPanelSize(panelData: PanelData) {
    const { layout, panelDataArray } = eagerValuesRef.value

    const { panelSize } = panelDataHelper(panelDataArray, panelData, layout)

    assert(
      panelSize != null,
      `Panel size not found for panel "${panelData.id}"`,
    )

    // If the panel uses px units, convert from percent back to px
    const panelUnit = panelData.constraints.sizeUnit ?? '%'
    if (panelUnit === 'px') {
      const groupSize = getGroupSizeInPixels()
      if (groupSize != null)
        return (panelSize / 100) * groupSize
    }

    return panelSize
  }

  function isPanelCollapsed(panelData: PanelData) {
    const { layout, panelDataArray } = eagerValuesRef.value

    const panelConstraintsArray = getPanelConstraintsInPercent()

    const {
      collapsedSize = 0,
      collapsible,
      panelSize,
    } = panelDataHelper(
      panelDataArray,
      panelData,
      layout,
      panelConstraintsArray ?? undefined,
    )

    if (!collapsible)
      return false

    // panelSize is undefined during ssr due to vue ssr reactivity limitation.
    if (panelSize === undefined) {
      const panelIndex = findPanelDataIndex(panelDataArray, panelData)
      const constraints = panelConstraintsArray?.[panelIndex] ?? panelData.constraints
      return constraints.defaultSize === constraints.collapsedSize
    }
    else {
      // Fuzzy compare: px sizeUnit converts constraints px→% and renormalizes the
      // layout, so panelSize drifts from collapsedSize by a float epsilon.
      return fuzzyCompareNumbers(panelSize, collapsedSize) <= 0
    }
  }

  function isPanelExpanded(panelData: PanelData) {
    const { layout, panelDataArray } = eagerValuesRef.value

    const panelConstraintsArray = getPanelConstraintsInPercent()

    const {
      collapsedSize = 0,
      collapsible,
      panelSize,
    } = panelDataHelper(
      panelDataArray,
      panelData,
      layout,
      panelConstraintsArray ?? undefined,
    )

    assert(
      panelSize != null,
      `Panel size not found for panel "${panelData.id}"`,
    )

    return !collapsible || fuzzyCompareNumbers(panelSize, collapsedSize) > 0
  }

  const context: PanelGroupContext = {
    direction: direction as Ref<Direction>,
    dragState: dragState.value,
    groupId,
    reevaluatePanelConstraints,
    registerPanel,
    registerResizeHandle,
    resizePanel,
    startDragging,
    stopDragging,
    unregisterPanel,
    panelGroupElement: panelGroupElementRef,

    collapsePanel,
    expandPanel,
    isPanelCollapsed,
    isPanelExpanded,
    getPanelSize,
    getPanelStyle,
  }

  const root = createPartSurface<SplitterGroupState>(
    () => ({
      'style': {
        display: 'flex',
        flexDirection: direction.value === 'horizontal' ? 'row' : 'column',
        height: '100%',
        overflow: 'hidden',
        width: '100%',
      },
      // Functional selectors: the resize handles and panels query the group through these.
      'data-panel-group': '',
      'data-panel-group-id': groupId,
    }),
    () => ({ orientation: direction.value }),
  )

  return { layout, modelValue, lastChangeDetails, isControlled, groupId, root, context }
}
