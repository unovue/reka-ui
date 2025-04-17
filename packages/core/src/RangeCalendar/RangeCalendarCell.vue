<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import type { DateValue } from '@internationalized/date'

export interface RangeCalendarCellProps extends PrimitiveProps {
  date: DateValue
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectRangeCalendarRootContext } from './RangeCalendarRoot.vue'

withDefaults(defineProps<RangeCalendarCellProps>(), { as: 'td' })
const rootContext = injectRangeCalendarRootContext()
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    role="gridcell"
    :aria-selected="rootContext.isSelected(date) ? true : undefined"
    :aria-disabled="rootContext.isDateDisabled(date) || rootContext.isDateUnavailable?.(date) || rootContext.disableDaysOutsideCurrentView.value"
    :data-disabled="rootContext.isDateDisabled(date) || rootContext.disableDaysOutsideCurrentView.value ? '' : undefined"
  >
    <slot />
  </Primitive>
</template>
