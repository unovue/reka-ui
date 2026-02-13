import type { Ref } from 'vue'
import { createContext } from '@/shared'

export type SliderAreaPoint = [x: number, y: number]

export type ActiveDirection = 'x' | 'y'

export interface SliderAreaThumbGroupContext {
  index: Ref<number>
}

export const [injectSliderAreaThumbGroupContext, provideSliderAreaThumbGroupContext]
  = createContext<SliderAreaThumbGroupContext>('SliderAreaThumbGroup')

/**
 * Find the closest thumb to a given point using Euclidean distance.
 */
export function getClosestThumbIndex(values: SliderAreaPoint[], point: SliderAreaPoint, minX: number, maxX: number, minY: number, maxY: number): number {
  if (values.length === 0)
    return -1
  if (values.length === 1)
    return 0

  // Normalize distances to account for different axis ranges
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  const distances = values.map((value) => {
    const dx = (value[0] - point[0]) / rangeX
    const dy = (value[1] - point[1]) / rangeY
    return Math.sqrt(dx * dx + dy * dy)
  })
  const closestDistance = Math.min(...distances)
  return distances.indexOf(closestDistance)
}
