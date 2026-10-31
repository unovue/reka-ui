<script lang="ts">
import type { CalendarUnit } from '@/date'
import type { PrimitiveProps } from '@/Primitive'

export interface CalendarHeadingProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useForwardElement } from '@/shared'
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

const { forwardRef, expose } = useForwardElement()
defineExpose(expose)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="surface.attrs.value"
  >
    <slot
      :heading-value="rootContext.headingValue.value"
      :view="rootContext.view.value"
    >
      {{ rootContext.headingValue.value }}
    </slot>
  </component>
</template>
