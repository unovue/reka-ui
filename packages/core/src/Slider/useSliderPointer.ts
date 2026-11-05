import type { SliderRootContext } from './SliderRoot.vue'
import type { SliderOrientation } from './utils'
import { getCurrentInstance } from 'vue'
import { linearScale } from './utils'

export interface UseSliderPointerOptions {
  element: () => HTMLElement | undefined
  context: SliderRootContext
  orientation: SliderOrientation
  /** Called with `onSlideStart` / `onSlideMove` (value, event) and `onSlideEnd` (event). */
  emit: (key: 'onSlideStart' | 'onSlideMove' | 'onSlideEnd', ...args: any[]) => void
}

/**
 * Maps pointer events on the slider element to slide events carrying a value.
 * Keyboard handling is `useSlider()`'s root surface `onKeydown`.
 *
 * @internal
 */
export function useSliderPointer(options: UseSliderPointerOptions) {
  const { element, context, orientation, emit } = options
  // A removed slider still gets the events its element is sent, with no element or
  // thumbs left to measure. Its `emit` would have returned before anything read them.
  const instance = getCurrentInstance()
  let offsetPosition: number | undefined
  let rect: DOMRect | undefined

  function reset() {
    rect = undefined
    offsetPosition = undefined
  }

  function getValue(event: PointerEvent, slideStart?: boolean) {
    const horizontal = context.orientation.value === 'horizontal'
    // Falls back to the listening element: inside a Suspense, an out-in leave
    // nulls the template ref while the element is still in the DOM and
    // receiving pointer events (#3148).
    const bounds = rect || (element() ?? event.currentTarget as HTMLElement).getBoundingClientRect()
    const contain = context.thumbAlignment.value === 'contain'

    // Get the currently active thumb element
    const thumb = [...context.thumbElements.value][context.valueIndexToChangeRef.value]
    const thumbSize = contain ? (horizontal ? thumb.clientWidth : thumb.clientHeight) : 0
    const pointer = horizontal ? event.clientX : event.clientY

    // Calculate offset for dragging, but only when needed
    if (!offsetPosition && !slideStart && contain) {
      const thumbBounds = thumb.getBoundingClientRect()
      offsetPosition = pointer - (horizontal ? thumbBounds.left : thumbBounds.top)
    }

    // Define the input range (slider track size minus thumb size)
    const input: [number, number] = [0, (horizontal ? bounds.width : bounds.height) - thumbSize]
    // A vertical slider's values grow from the bottom, against the pointer's axis.
    const min = context.min.value
    const max = context.max.value
    const output: [number, number] = (orientation.direction.value === 1) === horizontal ? [min, max] : [max, min]

    rect = bounds
    const start = horizontal ? bounds.left : bounds.top
    const position = slideStart
      ? pointer - start - thumbSize / 2
      : pointer - start - (offsetPosition ?? 0)

    return linearScale(input, output)(position)
  }

  return {
    reset,
    handlers: {
      onPointerdown(event: PointerEvent) {
        const target = event.target as HTMLElement
        target.setPointerCapture(event.pointerId)
        // Prevent browser focus behaviour because we focus a thumb manually when values change.
        event.preventDefault()
        // Touch devices have a delay before focusing so won't focus if touch immediately moves
        // away from target (sliding). We want thumb to focus regardless.
        if (context.thumbElements.value.includes(target))
          target.focus()
        else if (!instance?.isUnmounted)
          emit('onSlideStart', getValue(event, true), event)
      },
      onPointermove(event: PointerEvent) {
        const target = event.target as HTMLElement
        if (target.hasPointerCapture(event.pointerId) && !instance?.isUnmounted)
          emit('onSlideMove', getValue(event), event)
      },
      onPointerup(event: PointerEvent) {
        const target = event.target as HTMLElement
        if (target.hasPointerCapture(event.pointerId)) {
          target.releasePointerCapture(event.pointerId)
          reset()
          emit('onSlideEnd', event)
        }
      },
    },
  }
}
