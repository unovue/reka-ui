<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { TemporalDate } from '@/temporal/types'

export interface CalendarCellProps extends PrimitiveProps {
  /** The date value for the cell */
  date: TemporalDate
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectCalendarRootContext } from './CalendarRoot.vue'

withDefaults(defineProps<CalendarCellProps>(), { as: 'td' })
const rootContext = injectCalendarRootContext()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    role="gridcell"
    :aria-selected="rootContext.isDateSelected(date) ? true : undefined"
    :aria-disabled="rootContext.isDateDisabled(date) || rootContext.isDateUnavailable?.(date) || rootContext.disableDaysOutsideCurrentView.value"
    :data-disabled="rootContext.isDateDisabled(date) || rootContext.disableDaysOutsideCurrentView.value ? '' : undefined"
  >
    <slot />
  </Primitive>
</template>
