<script lang="ts">
import type { CalendarUnit } from '@/date'
import type { PrimitiveProps } from '@/Primitive'

export interface CalendarHeadingProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { injectCalendarRootContext } from './CalendarRoot.vue'
import { getCalendarHeadingSurface } from './useCalendar'

const props = withDefaults(defineProps<CalendarHeadingProps>(), { as: 'div' })

defineSlots<{
  default?: (props: {
    /** Heading of the active view: `September 2026`, `2026`, `2020 - 2031` */
    headingValue: string
    /** The active view */
    view: CalendarUnit
  }) => any
}>()

const rootContext = injectCalendarRootContext()
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
