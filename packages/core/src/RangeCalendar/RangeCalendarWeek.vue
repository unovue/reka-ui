<script lang="ts">
import type { PrimitiveProps } from '@/Primitive'
import { computed } from 'vue'
import { injectRangeCalendarRootContext } from './RangeCalendarRoot.vue'

export interface RangeCalendarWeekProps extends PrimitiveProps {
  rowIndex: number
  monthIndex?: number
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'

const props = withDefaults(defineProps<RangeCalendarWeekProps>(), { as: 'th', monthIndex: 0 })

const rootContext = injectRangeCalendarRootContext()

const weekNumber = computed(() => {
  return rootContext.startingWeekNumberPerMonth.value[props.monthIndex][props.rowIndex].toLocaleString(rootContext.locale.value)
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
