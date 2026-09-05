<script lang="ts">
import type { ComputedRef } from 'vue'
import type { CalendarGridData, CalendarUnit } from '@/date'
import type { PrimitiveProps } from '@/Primitive'
import { createContext, useForwardExpose } from '@/shared'

export interface CalendarViewProps extends PrimitiveProps {
  /** The view this part renders. Its content is shown only while the root's `view` matches. */
  view: CalendarUnit
}

export interface CalendarViewContext {
  /** The unit the cells inside this view render. */
  unit: ComputedRef<CalendarUnit>
}

export const [injectCalendarViewContext, provideCalendarViewContext]
  = createContext<CalendarViewContext>('CalendarView')
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/Primitive'
import { injectCalendarRootContext } from './CalendarRoot.vue'

const props = withDefaults(defineProps<CalendarViewProps>(), { as: 'div' })

defineSlots<{
  default?: (props: {
    /** The rendered page(s) of this view */
    grid: CalendarGridData[]
    /** The days of the week (day view only) */
    weekDays: string[]
    /** This view's unit */
    view: CalendarUnit
  }) => any
}>()

const { forwardRef } = useForwardExpose()
const rootContext = injectCalendarRootContext()

provideCalendarViewContext({ unit: computed(() => props.view) })

const isActive = computed(() => rootContext.view.value === props.view)
</script>

<template>
  <Primitive
    v-if="isActive"
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :data-view="view"
  >
    <slot
      :grid="rootContext.grid.value"
      :week-days="rootContext.weekDays.value"
      :view="view"
    />
  </Primitive>
</template>
