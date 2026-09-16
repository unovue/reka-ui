/*
 * Range field model sync.
 * Side refs feed the shell; public { start, end } is the consumer view.
 * Equality function comes from the caller (day vs time-of-day).
 */

import type { Ref } from 'vue'
import { watch } from 'vue'

export type UseRangeFieldModelProps<TValue> = {
  modelValue: Ref<{ start: TValue | undefined, end: TValue | undefined } | null>
  startValue: Ref<TValue | undefined>
  endValue: Ref<TValue | undefined>
  areEqual: (a: TValue, b: TValue) => boolean
}

export function useRangeFieldModel<TValue>(props: UseRangeFieldModelProps<TValue>): void {
  watch([props.startValue, props.endValue], ([_startValue, _endValue]) => {
    props.modelValue.value = { start: _startValue, end: _endValue }
  })

  watch(props.modelValue, (_modelValue) => {
    syncSide(props.startValue, _modelValue?.start, props.areEqual)
    syncSide(props.endValue, _modelValue?.end, props.areEqual)
  })
}

function syncSide<TValue>(
  sideValue: Ref<TValue | undefined>,
  next: TValue | undefined,
  areEqual: (a: TValue, b: TValue) => boolean,
): void {
  const current = sideValue.value
  if (next && current) {
    if (!areEqual(next, current))
      sideValue.value = next
  }
  else if (next !== current) {
    sideValue.value = next
  }
}
