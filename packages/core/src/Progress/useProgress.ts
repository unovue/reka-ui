import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { ProgressRootContext } from './ProgressRoot.vue'
import type { PartSurface } from '@/shared'
import { computed, toValue } from 'vue'
import { createPartSurface, isNullish } from '@/shared'

export type ProgressState = 'indeterminate' | 'loading' | 'complete'

export type ProgressRootState = { state: ProgressState, value: number | undefined, max: number }

export interface UseProgressProps {
  /** The progress value; `null`/`undefined` is indeterminate. */
  modelValue?: MaybeRefOrGetter<number | null | undefined>
  /** The maximum progress value. Defaults to `100`. */
  max?: MaybeRefOrGetter<number | undefined>
  /** Accessible label; defaults to the value as a percentage of `max`. */
  getValueLabel?: (value: number | null | undefined, max: number) => string | undefined
  /** Accessible value text. */
  getValueText?: (value: number | null | undefined, max: number) => string | undefined
}

export interface UseProgressReturn {
  /** The validated value: an invalid one (negative, above `max`, `NaN`) reads `null`. */
  value: ComputedRef<number | null | undefined>
  /** The validated max: an invalid one (`<= 0`, `NaN`) reads `100`. */
  max: ComputedRef<number>
  state: ComputedRef<ProgressState>
  root: PartSurface<ProgressRootState>
  indicator: PartSurface<ProgressRootState>
  context: ProgressRootContext
}

export const DEFAULT_MAX = 100

export const isNumber = (v: any): v is number => typeof v === 'number'

function defaultGetValueLabel(value: number | null | undefined, max: number) {
  return isNumber(value) ? `${Math.round((value / max) * DEFAULT_MAX)}%` : undefined
}

function validateValue(value: any, max: number): number | null | undefined {
  const isValidValueError
    = isNullish(value)
      || (isNumber(value) && !Number.isNaN(value) && value <= max && value >= 0)

  if (isValidValueError)
    return value

  console.error(`Invalid prop \`value\` of value \`${value}\` supplied to \`ProgressRoot\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${DEFAULT_MAX} if no \`max\` prop is set)
  - \`null\`  or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`)
  return null
}

function validateMax(max: number): number {
  const isValidMaxError = isNumber(max) && !Number.isNaN(max) && max > 0

  if (isValidMaxError)
    return max

  console.error(
    `Invalid prop \`max\` of value \`${max}\` supplied to \`ProgressRoot\`. Only numbers greater than 0 are valid max values. Defaulting to \`${DEFAULT_MAX}\`.`,
  )
  return DEFAULT_MAX
}

function progressStateOf(context: ProgressRootContext): ProgressRootState {
  return {
    state: context.progressState.value,
    value: context.modelValue?.value ?? undefined,
    max: context.max.value,
  }
}

/**
 * Indicator surface derived from the root context — shared by
 * `useProgress().indicator` and `ProgressIndicator.vue`.
 */
export function getProgressIndicatorSurface(context: ProgressRootContext): PartSurface<ProgressRootState> {
  return createPartSurface<ProgressRootState>(() => ({}), () => progressStateOf(context))
}

/**
 * Headless Progress logic. Progress has no model: the value is display-only,
 * so there is no `beforeUpdate`/change details — an invalid value or max is
 * logged and rendered as indeterminate / `100`.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useProgress(props: UseProgressProps = {}): UseProgressReturn {
  const max = computed(() => validateMax(toValue(props.max) ?? DEFAULT_MAX))
  const value = computed(() => validateValue(toValue(props.modelValue), max.value))
  const state = computed<ProgressState>(() => {
    if (isNullish(value.value))
      return 'indeterminate'
    if (value.value === max.value)
      return 'complete'
    return 'loading'
  })

  const context: ProgressRootContext = { modelValue: value, max, progressState: state }

  const root = createPartSurface<ProgressRootState>(
    () => ({
      'aria-valuemax': max.value,
      'aria-valuemin': 0,
      'aria-valuenow': isNumber(value.value) ? value.value : undefined,
      'aria-valuetext': props.getValueText?.(value.value, max.value),
      'aria-label': (props.getValueLabel ?? defaultGetValueLabel)(value.value, max.value),
      'role': 'progressbar',
    }),
    () => progressStateOf(context),
  )

  return { value, max, state, root, indicator: getProgressIndicatorSurface(context), context }
}
