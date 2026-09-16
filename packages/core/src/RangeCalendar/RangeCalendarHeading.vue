<script lang="ts">
import type { CalendarUnit } from '@/date'
import type { PrimitiveProps } from '@/Primitive'

export interface RangeCalendarHeadingProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { getCalendarHeadingSurface } from '@/Calendar/useCalendar'
import { Primitive } from '@/Primitive'
import { injectRangeCalendarRootContext } from './RangeCalendarRoot.vue'

const props = withDefaults(defineProps<RangeCalendarHeadingProps>(), { as: 'div' })
defineSlots<{
  default?: (props: {
    /** Heading of the active view: `September 2026`, `2026`, `2020 - 2031` */
    headingValue: string
    /** The active view */
    view: CalendarUnit
  }) => any
}>()

const rootContext = injectRangeCalendarRootContext()
const surface = getCalendarHeadingSurface(rootContext)
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    v-bind="surface.attrs.value"
  >
    <slot
      :heading-value="rootContext.headingValue.value"
      :view="rootContext.view.value"
    >
      {{ rootContext.headingValue.value }}
    </slot>
  </Primitive>
</template>
