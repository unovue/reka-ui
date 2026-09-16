<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { TemporalDate } from '@/temporal/types'

export interface MonthRangePickerCellProps extends PrimitiveProps {
  /** The date value for the cell */
  date: TemporalDate
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectMonthRangePickerRootContext } from './MonthRangePickerRoot.vue'

withDefaults(defineProps<MonthRangePickerCellProps>(), { as: 'td' })
const rootContext = injectMonthRangePickerRootContext()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    role="gridcell"
    :aria-selected="rootContext.isSelected(date) ? true : undefined"
    :aria-disabled="rootContext.isMonthDisabled(date) || rootContext.isMonthUnavailable?.(date)"
    :data-disabled="rootContext.isMonthDisabled(date) ? '' : undefined"
  >
    <slot />
  </Primitive>
</template>
