import type { ComputedRef } from 'vue'
import type { FieldControlBinding } from '@/Field/useFieldBinding'
import type { Translate } from '@/shared/translations'
import { clamp, createRekaContext } from '@/shared'
import { defaultTranslate } from '@/shared/translations'

export function getNextSortedValues(prevValues: number[] = [], nextValue: number, atIndex: number) {
  const nextValues = [...prevValues]
  nextValues[atIndex] = nextValue
  return nextValues.sort((a, b) => a - b)
}

export function convertValueToPercentage(value: number, min: number, max: number) {
  const maxSteps = max - min
  const percentPerStep = 100 / maxSteps
  const percentage = percentPerStep * (value - min)
  return clamp(percentage, 0, 100)
}

/**
 * Returns a label for each thumb when there are two or more thumbs
 */
export function getLabel(index: number, totalValues: number, t: Translate = defaultTranslate) {
  if (totalValues > 2)
    return t('sliderValue', { index: index + 1, total: totalValues })

  else if (totalValues === 2)
    return [t('sliderMinimum'), t('sliderMaximum')][index]

  else
    return undefined
}

/**
 * Given a `values` array and a `nextValue`, determine which value in
 * the array is closest to `nextValue` and return its index.
 *
 * @example
 * // returns 1
 * getClosestValueIndex([10, 30], 25);
 */
export function getClosestValueIndex(values: number[], nextValue: number) {
  if (values.length === 1)
    return 0
  const distances = values.map(value => Math.abs(value - nextValue))
  const closestDistance = Math.min(...distances)
  return distances.indexOf(closestDistance)
}

/**
 * Offsets the thumb centre point while sliding to ensure it remains
 * within the bounds of the slider when reaching the edges
 */
export function getThumbInBoundsOffset(width: number, left: number, direction: number) {
  const halfWidth = width / 2
  const halfPercent = 50
  const offset = linearScale([0, halfPercent], [0, halfWidth])
  return (halfWidth - offset(left) * direction) * direction
}

/**
 * Gets an array of steps between each value.
 *
 * @example
 * // returns [1, 9]
 * getStepsBetweenValues([10, 11, 20]);
 */
export function getStepsBetweenValues(values: number[]) {
  return values.slice(0, -1).map((value, index) => values[index + 1] - value)
}

/**
 * Verifies the minimum steps between all values is greater than or equal
 * to the expected minimum steps.
 *
 * @example
 * // returns false
 * hasMinStepsBetweenValues([1,2,3], 2);
 *
 * @example
 * // returns true
 * hasMinStepsBetweenValues([1,2,3], 1);
 */
export function hasMinStepsBetweenValues(values: number[], minStepsBetweenValues: number) {
  if (minStepsBetweenValues > 0) {
    const stepsBetweenValues = getStepsBetweenValues(values)
    const actualMinStepsBetweenValues = Math.min(...stepsBetweenValues)
    // A gap between decimal values carries floating-point error (0.5 - 0.4 is
    // 0.09999999999999998): allow a few units in the last place of the values,
    // but never more than a millionth of the gap, so large values cannot pass
    // a gap they are short of.
    const tolerance = Math.min(8 * Number.EPSILON * Math.max(...values.map(Math.abs)), minStepsBetweenValues * 1e-6)
    return actualMinStepsBetweenValues >= minStepsBetweenValues - tolerance
  }
  return true
}

// https://github.com/tmcw-up-for-adoption/simple-linear-scale/blob/master/index.js
export function linearScale(input: readonly [number, number], output: readonly [number, number]) {
  return (value: number) => {
    if (input[0] === input[1] || output[0] === output[1])
      return output[0]
    const ratio = (output[1] - output[0]) / (input[1] - input[0])
    return output[0] + ratio * (value - input[0])
  }
}

export function roundValue(value: number, decimalCount: number) {
  const rounder = 10 ** decimalCount
  // A step as small as `Number.MIN_VALUE` needs more digits than a double can scale by.
  const scaled = value * rounder
  return Number.isFinite(scaled) ? Math.round(scaled) / rounder : value
}

export type Direction = 'ltr' | 'rtl'

export const PAGE_KEYS = ['PageUp', 'PageDown']
export const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

export type SlideDirection = 'from-left' | 'from-right' | 'from-bottom' | 'from-top'
export const BACK_KEYS: Record<SlideDirection, string[]> = {
  'from-left': ['Home', 'PageDown', 'ArrowDown', 'ArrowLeft'],
  'from-right': ['Home', 'PageDown', 'ArrowDown', 'ArrowRight'],
  'from-bottom': ['Home', 'PageDown', 'ArrowDown', 'ArrowLeft'],
  'from-top': ['Home', 'PageUp', 'ArrowUp', 'ArrowLeft'],
}

type Side = 'top' | 'right' | 'bottom' | 'left'
export interface SliderOrientation {
  startEdge: ComputedRef<Side>
  endEdge: ComputedRef<Side>
  direction: ComputedRef<1 | -1>
  size: 'width' | 'height'
}

export interface SliderOrientationGeometry {
  startEdge: Side
  endEdge: Side
  direction: 1 | -1
  size: 'width' | 'height'
  /** Which `BACK_KEYS` set applies. */
  slideDirection: SlideDirection
  /** Whether values grow from the start edge (left / bottom). */
  isSlidingFromStart: boolean
}

/**
 * The orientation geometry `useSlider()` derives: one derivation for the edges,
 * the step direction and the back keys. An unset `dir` counts as neither `ltr`
 * nor `rtl`.
 */
export function getSliderOrientationGeometry(orientation: 'horizontal' | 'vertical', dir: Direction | undefined, inverted: boolean): SliderOrientationGeometry {
  if (orientation === 'horizontal') {
    const isSlidingFromLeft = (dir !== 'rtl' && !inverted) || (dir !== 'ltr' && inverted)
    return {
      startEdge: isSlidingFromLeft ? 'left' : 'right',
      endEdge: isSlidingFromLeft ? 'right' : 'left',
      direction: isSlidingFromLeft ? 1 : -1,
      size: 'width',
      slideDirection: isSlidingFromLeft ? 'from-left' : 'from-right',
      isSlidingFromStart: isSlidingFromLeft,
    }
  }
  const isSlidingFromBottom = !inverted
  return {
    startEdge: isSlidingFromBottom ? 'bottom' : 'top',
    endEdge: isSlidingFromBottom ? 'top' : 'bottom',
    direction: isSlidingFromBottom ? 1 : -1,
    size: 'height',
    slideDirection: isSlidingFromBottom ? 'from-bottom' : 'from-top',
    isSlidingFromStart: isSlidingFromBottom,
  }
}

/** The thumb transform each orientation sets on the slider element. */
export function getSliderThumbTransform(orientation: 'horizontal' | 'vertical', isSlidingFromStart: boolean, thumbAlignment: 'contain' | 'overflow') {
  if (orientation === 'horizontal')
    return !isSlidingFromStart && thumbAlignment === 'overflow' ? 'translateX(50%)' : 'translateX(-50%)'
  return !isSlidingFromStart && thumbAlignment === 'overflow' ? 'translateY(-50%)' : 'translateY(50%)'
}

export const [injectSliderOrientationContext, provideSliderOrientationContext]
  = createRekaContext<SliderOrientation>('SliderRoot', 'SliderOrientationContext')

/**
 * A slider's participation in an ancestor `FieldRoot` (`null` outside one).
 * `SliderRoot` creates it, unless a wrapping control that owns the value
 * (`ColorSliderRoot`) provides its own: the root then renders the field's
 * state and focus, and the thumbs its id and aria wiring, for that control.
 * @internal
 */
export const [injectSliderFieldContext, provideSliderFieldContext]
  = createRekaContext<FieldControlBinding | null>('SliderRoot', 'SliderFieldContext')
