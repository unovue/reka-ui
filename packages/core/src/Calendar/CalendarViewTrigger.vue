<script lang="ts">
import type { CalendarUnit } from '@/date'
import type { PrimitiveProps } from '@/Primitive'

export interface CalendarViewTriggerProps extends PrimitiveProps {}

export interface CalendarViewTriggerSlot {
  default?: (props: {
    /** Heading of the active view (`September 2026`, `2026`, `2020 - 2031`) */
    headingValue: string
    /** The active view */
    view: CalendarUnit
    /** Whether the trigger is disabled (at `maxView`, or the calendar is disabled) */
    disabled: boolean
  }) => any
}
</script>

<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose } from '@/shared'
import { injectCalendarRootContext } from './CalendarRoot.vue'
import { getCalendarViewTriggerSurface } from './useCalendar'

const props = withDefaults(defineProps<CalendarViewTriggerProps>(), { as: 'button' })
defineSlots<CalendarViewTriggerSlot>()

const { forwardRef } = useForwardExpose()
const rootContext = injectCalendarRootContext()
const surface = getCalendarViewTriggerSurface(rootContext)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="props.as"
    :as-child="props.asChild"
    :type="props.as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot
      :heading-value="rootContext.headingValue.value"
      :view="rootContext.view.value"
      :disabled="surface.state.value.disabled"
    >
      {{ rootContext.headingValue.value }}
    </slot>
  </Primitive>
</template>
