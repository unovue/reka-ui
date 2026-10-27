import type { MaybeRefOrGetter, Ref } from 'vue'
import type { PanelGroupContext } from './SplitterGroup.vue'
import type { PointerHitAreaMargins, ResizeHandlerAction } from './utils/registry'
import type { Direction, ResizeEvent, ResizeHandler } from './utils/types'
import type { PartSurface } from '@/shared'
import { computed, ref, toValue, watch, watchEffect } from 'vue'
import { createPartSurface, isBrowser } from '@/shared'
import { useWindowSplitterResizeHandlerBehavior } from './utils/composables/useWindowSplitterBehavior'
import { registerResizeHandle } from './utils/registry'

export type ResizeHandlerState = 'drag' | 'hover' | 'inactive'

export type SplitterResizeHandleState = { state: ResizeHandlerState, disabled: boolean, orientation: Direction }

let count = 0

export interface UseSplitterResizeHandleProps {
  /**
   * Handle id, unique within the group. The component passes a `useId` value;
   * the standalone default is a per-call counter that is not SSR-stable.
   */
  id?: string
  /** The handle element; pointer hit-testing and keyboard resizing attach to it. */
  element: Readonly<Ref<HTMLElement | null | undefined>>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  /** Extra hit area around the handle, in px. Defaults to `{ coarse: 15, fine: 5 }`. */
  hitAreaMargins?: MaybeRefOrGetter<PointerHitAreaMargins | undefined>
  tabindex?: MaybeRefOrGetter<number | undefined>
  /** CSP nonce for the global cursor style. */
  nonce?: Ref<string | undefined>
  /** Called when a drag starts (`true`) and ends (`false`). */
  onDragging?: (isDragging: boolean) => void
}

export interface UseSplitterResizeHandleReturn {
  handleId: string
  state: Ref<ResizeHandlerState>
  isFocused: Ref<boolean>
  root: PartSurface<SplitterResizeHandleState>
}

/**
 * Wires a resize handle to its group (`useSplitter().context`): pointer
 * dragging with hit-area margins, and the window-splitter keyboard pattern
 * (arrows, Home/End, Enter to toggle collapse, F6 to cycle handles).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle setup — attaches document listeners; call it inside `setup()`.
 */
export function useSplitterResizeHandle(context: PanelGroupContext, props: UseSplitterResizeHandleProps): UseSplitterResizeHandleReturn {
  const {
    direction,
    groupId,
    registerResizeHandle: registerResizeHandleWithParentGroup,
    startDragging,
    stopDragging,
    panelGroupElement,
  } = context

  const resizeHandleId = props.id ?? `reka-splitter-resize-handle-${++count}`
  const disabled = computed(() => !!toValue(props.disabled))
  const state = ref<ResizeHandlerState>('inactive')
  const isFocused = ref(false)
  const resizeHandler = ref<ResizeHandler | null>(null)

  watch(disabled, () => {
    if (!isBrowser)
      return
    if (disabled.value)
      resizeHandler.value = null
    else
      resizeHandler.value = registerResizeHandleWithParentGroup(resizeHandleId)
  }, { immediate: true })

  watchEffect((onCleanup) => {
    if (disabled.value || resizeHandler.value === null)
      return

    const element = props.element.value
    if (!element)
      return

    const setResizeHandlerState = (
      action: ResizeHandlerAction,
      isActive: boolean,
      event: ResizeEvent,
    ) => {
      if (isActive) {
        switch (action) {
          case 'down': {
            state.value = 'drag'

            startDragging(resizeHandleId, event)
            props.onDragging?.(true)
            break
          }
          case 'move': {
            if (state.value !== 'drag')
              state.value = 'hover'

            resizeHandler.value?.(event)
            break
          }
          case 'up': {
            state.value = 'hover'

            stopDragging()
            props.onDragging?.(false)
            break
          }
        }
      }
      else {
        state.value = 'inactive'
      }
    }

    const hitAreaMargins = toValue(props.hitAreaMargins)
    onCleanup(registerResizeHandle(
      resizeHandleId,
      element,
      direction,
      {
        // Coarse inputs (e.g. finger/touch)
        coarse: hitAreaMargins?.coarse ?? 15,
        // Fine inputs (e.g. mouse)
        fine: hitAreaMargins?.fine ?? 5,
      },
      props.nonce ?? ref(),
      setResizeHandlerState,
    ))
  })

  useWindowSplitterResizeHandlerBehavior({
    disabled,
    resizeHandler,
    handleId: resizeHandleId,
    panelGroupElement,
  })

  const root = createPartSurface<SplitterResizeHandleState>(
    () => ({
      'id': resizeHandleId,
      'style': {
        touchAction: 'none',
        userSelect: 'none',
      },
      'role': 'separator',
      // Functional selectors: the group and the hit-testing registry query handles through these.
      'data-resize-handle': '',
      'tabindex': toValue(props.tabindex) ?? 0,
      'data-panel-group-id': groupId,
      'data-resize-handle-active': state.value === 'drag' ? 'pointer' : isFocused.value ? 'keyboard' : undefined,
      'data-resize-handle-state': state.value,
      'data-panel-resize-handle-enabled': !disabled.value,
      'data-panel-resize-handle-id': resizeHandleId,
      'onBlur': () => {
        isFocused.value = false
      },
      'onFocus': () => {
        isFocused.value = true
      },
    }),
    () => ({ state: state.value, disabled: disabled.value, orientation: direction.value }),
  )

  return { handleId: resizeHandleId, state, isFocused, root }
}
