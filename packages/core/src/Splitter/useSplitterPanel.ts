import type { ComputedRef, CSSProperties, MaybeRefOrGetter } from 'vue'
import type { PanelGroupContext } from './SplitterGroup.vue'
import type { PanelData } from './SplitterPanel.vue'
import type { DisclosureState, PartSurface } from '@/shared'
import { computed, onMounted, onUnmounted, toValue, watch } from 'vue'
import { createPartSurface, disclosureState } from '@/shared'
import { PRECISION } from './utils/constants'

export type SplitterPanelState = { state: DisclosureState }

let count = 0

export interface UseSplitterPanelProps {
  /**
   * Panel id, unique within the group. The component passes a `useId` value;
   * the standalone default is a per-call counter that is not SSR-stable.
   */
  id?: string
  /** Whether `id` came from the consumer (stable across reloads; used by `storage`). */
  idIsFromProps?: boolean
  collapsedSize?: MaybeRefOrGetter<number | undefined>
  collapsible?: MaybeRefOrGetter<boolean | undefined>
  defaultSize?: MaybeRefOrGetter<number | undefined>
  maxSize?: MaybeRefOrGetter<number | undefined>
  minSize?: MaybeRefOrGetter<number | undefined>
  order?: MaybeRefOrGetter<number | undefined>
  sizeUnit?: MaybeRefOrGetter<'%' | 'px' | undefined>
  onCollapse?: () => void
  onExpand?: () => void
  onResize?: (size: number, prevSize: number | undefined) => void
}

export interface UseSplitterPanelReturn {
  panelId: string
  isCollapsed: ComputedRef<boolean>
  isExpanded: ComputedRef<boolean>
  /** If the panel is `collapsible`, collapse it fully. */
  collapse: () => void
  /** If the panel is collapsed, expand it to its most recent size. */
  expand: () => void
  /** Resize the panel (in its `sizeUnit`). */
  resize: (size: number) => void
  /** The panel's current size (in its `sizeUnit`). */
  getSize: () => number
  style: ComputedRef<CSSProperties>
  root: PartSurface<SplitterPanelState>
}

/**
 * Registers a panel with its group (`useSplitter().context`) and returns its
 * size methods and surface.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — registers on mount; call it inside `setup()`.
 */
export function useSplitterPanel(context: PanelGroupContext, props: UseSplitterPanelProps = {}): UseSplitterPanelReturn {
  const { collapsePanel, expandPanel, getPanelSize, getPanelStyle, isPanelCollapsed, resizePanel, groupId, reevaluatePanelConstraints, registerPanel, unregisterPanel } = context
  const panelId = props.id ?? `reka-splitter-panel-${++count}`

  const panelDataRef = computed(() => {
    const collapsedSize = toValue(props.collapsedSize)
    return {
      callbacks: {
        onCollapse: () => props.onCollapse?.(),
        onExpand: () => props.onExpand?.(),
        onResize: (size, prevSize) => props.onResize?.(size, prevSize),
      },
      constraints: {
        collapsedSize: collapsedSize && Number.parseFloat(collapsedSize.toFixed(PRECISION)),
        collapsible: toValue(props.collapsible),
        defaultSize: toValue(props.defaultSize),
        maxSize: toValue(props.maxSize),
        minSize: toValue(props.minSize),
        sizeUnit: toValue(props.sizeUnit) ?? '%',
      },
      id: panelId,
      idIsFromProps: props.idIsFromProps ?? props.id !== undefined,
      order: toValue(props.order),
    } satisfies PanelData
  })

  watch(() => panelDataRef.value.constraints, (constraints, prevConstraints) => {
    // If constraints have changed, we should revisit panel sizes.
    // This is uncommon but may happen if people are trying to implement pixel based constraints.
    if (
      prevConstraints.collapsedSize !== constraints.collapsedSize
      || prevConstraints.collapsible !== constraints.collapsible
      || prevConstraints.maxSize !== constraints.maxSize
      || prevConstraints.minSize !== constraints.minSize
      || prevConstraints.sizeUnit !== constraints.sizeUnit
    ) {
      reevaluatePanelConstraints(panelDataRef.value, prevConstraints)
    }
  }, { deep: true })

  onMounted(() => {
    registerPanel(panelDataRef.value)
  })

  onUnmounted(() => {
    unregisterPanel(panelDataRef.value)
  })

  const style = computed(() => getPanelStyle(panelDataRef.value, toValue(props.defaultSize)))
  const isCollapsed = computed(() => isPanelCollapsed(panelDataRef.value))
  const isExpanded = computed(() => !isCollapsed.value)

  const root = createPartSurface<SplitterPanelState>(
    () => ({
      'id': panelId,
      'style': style.value,
      // Functional selectors: the group queries its panels through these.
      'data-panel': '',
      'data-panel-collapsible': toValue(props.collapsible) || undefined,
      'data-panel-group-id': groupId,
      'data-panel-id': panelId,
      'data-panel-size': Number.parseFloat(`${style.value.flexGrow}`).toFixed(1),
    }),
    () => ({ state: disclosureState(!isCollapsed.value) }),
  )

  return {
    panelId,
    isCollapsed,
    isExpanded,
    collapse: () => collapsePanel(panelDataRef.value),
    expand: () => expandPanel(panelDataRef.value),
    resize: (size: number) => resizePanel(panelDataRef.value, size),
    getSize: () => getPanelSize(panelDataRef.value),
    style,
    root,
  }
}
