<script lang="ts">
import type { CalendarPageFunction } from '@/date'
import type { PrimitiveProps } from '@/Primitive'

export interface CalendarNextProps extends PrimitiveProps {
  /** The function to be used for the next page. Overwrites the `nextPage` function set on the `CalendarRoot`. Receives the placeholder and the active view. Unlike the root function it applies in every view; render the button inside a `CalendarView` to scope it to one view. */
  nextPage?: CalendarPageFunction
}

export interface CalendarNextSlot {
  default?: (props: {
    /** Current disable state */
    disabled: boolean
  }) => any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
import { injectCalendarRootContext } from './CalendarRoot.vue'
import { getCalendarNavSurface } from './useCalendar'

const props = withDefaults(defineProps<CalendarNextProps>(), { as: 'button' })
defineSlots<CalendarNextSlot>()

const rootContext = injectCalendarRootContext()
const surface = getCalendarNavSurface(rootContext, 'next', computed(() => props.nextPage))

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    :type="props.as === 'button' ? 'button' : undefined"
    v-bind="surface.attrs.value"
  >
    <slot :disabled="surface.state.value.disabled">
      Next page
    </slot>
  </component>
</template>
