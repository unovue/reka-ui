/*
 * Range field invalidity.
 * Per-side shell invalidity + range order + optional days-between-unavailable.
 * Caller supplies `normalize` to project side values onto the shape the
 * unavailability matcher needs (PlainDateTime for time ranges, TemporalDate
 * for date ranges).
 */

import type { Ref } from 'vue'
import type { Matcher, TemporalDate } from '@/temporal/types'
import { computed } from 'vue'
import { areAllDaysBetweenValid } from '@/date'

export type UseRangeFieldInvalidityProps<TValue> = {
  startInvalidity: Ref<boolean>
  endInvalidity: Ref<boolean>
  modelValue: Ref<{ start: TValue | undefined, end: TValue | undefined } | null>
  isOrderValid: (start: TValue, end: TValue) => boolean
  normalize: (value: TValue) => TemporalDate
  isUnavailable?: Matcher
}

export function useRangeFieldInvalidity<TValue>(props: UseRangeFieldInvalidityProps<TValue>): Ref<boolean> {
  return computed(() => {
    if (props.startInvalidity.value || props.endInvalidity.value)
      return true

    const start = props.modelValue.value?.start
    const end = props.modelValue.value?.end
    if (!start || !end)
      return false

    if (!props.isOrderValid(start, end))
      return true

    if (props.isUnavailable) {
      const allValid = areAllDaysBetweenValid(
        props.normalize(start),
        props.normalize(end),
        props.isUnavailable,
        undefined,
      )
      if (!allValid)
        return true
    }

    return false
  })
}
