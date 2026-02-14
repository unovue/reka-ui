import type { Ref } from 'vue'
import { clamp, createContext } from '@/shared'
import { getDecimalCount, roundValue } from '../Slider/utils'

export type ActiveDirection = 'x' | 'y'

export interface SliderAreaThumbContext {
  index: Ref<number>
}

export const [injectSliderAreaThumbContext, provideSliderAreaThumbContext]
  = createContext<SliderAreaThumbContext>('SliderAreaThumb')

/**
 * Snap a value to the nearest step, then clamp it within [min, max].
 */
export function snapToStep(value: number, min: number, max: number, step: number): number {
  const decimalCount = getDecimalCount(step)
  const snapped = roundValue(Math.round((value - min) / step) * step + min, decimalCount)
  return clamp(snapped, min, max)
}

/**
 * Find the closest thumb to a given point using Euclidean distance.
 */
export function getClosestThumbIndex(values: number[][], point: number[], minX: number, maxX: number, minY: number, maxY: number): number {
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
