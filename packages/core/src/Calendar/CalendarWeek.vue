<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { injectCalendarRootContext } from './CalendarRoot.vue'
import { computed } from 'vue'

export interface CalendarWeekProps extends PrimitiveProps {
  rowIndex: number
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<CalendarWeekProps>(), { as: 'th' })

const rootContext = injectCalendarRootContext()

const weekNumber = computed(() => {
  return rootContext.startingWeekNumber.value[props.rowIndex].toLocaleString(rootContext.locale.value)
})
</script>

<template>
  <Primitive
    v-bind="props"
    scope="row"
    role="rowheader"
  >
    <slot :week-number="weekNumber">
      {{ weekNumber }}
    </slot>
  </Primitive>
</template>
