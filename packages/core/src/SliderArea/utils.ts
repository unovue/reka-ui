import type { Ref } from 'vue'
import { createContext } from '@/shared'

export interface SliderAreaPoint {
  x: number
  y: number
}

export interface SliderAreaRootContext {
  disabled: Ref<boolean>
  minX: Ref<number>
  maxX: Ref<number>
  minY: Ref<number>
  maxY: Ref<number>
  modelValue?: Readonly<Ref<SliderAreaPoint[] | null | undefined>>
  currentModelValue: Ref<SliderAreaPoint[]>
  valueIndexToChangeRef: Ref<number>
  thumbElements: Ref<HTMLElement[]>
  isSlidingFromLeft: Ref<boolean>
  isSlidingFromTop: Ref<boolean>
}

export const [injectSliderAreaRootContext, provideSliderAreaRootContext]
  = createContext<SliderAreaRootContext>('SliderAreaRoot')

/**
 * Find the closest thumb to a given point using Euclidean distance.
 */
export function getClosestThumbIndex(values: SliderAreaPoint[], point: SliderAreaPoint, minX: number, maxX: number, minY: number, maxY: number): number {
  if (values.length === 1)
    return 0

  // Normalize distances to account for different axis ranges
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  const distances = values.map((value) => {
    const dx = (value.x - point.x) / rangeX
    const dy = (value.y - point.y) / rangeY
    return Math.sqrt(dx * dx + dy * dy)
  })
  const closestDistance = Math.min(...distances)
  return distances.indexOf(closestDistance)
}
