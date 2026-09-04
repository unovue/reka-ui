<script lang="ts">
import type { Ref } from 'vue'
import type { Grid, Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { PrimitiveProps } from '@/Primitive'

import type { Formatter } from '@/shared'
import type { Direction } from '@/shared/types'
import type { TemporalDate } from '@/temporal/types'
import { getWeekStartsOn } from '@/date'
import { createContext, useDirection, useLocale } from '@/shared'
import { getDefaultDate, handleCalendarInitialFocus } from '@/shared/date'
import { isSameDay } from '@/temporal/comparators'
import { useCalendar, useCalendarState } from './useCalendar'

type CalendarRootContext = {
  locale: Ref<string>
  modelValue: Ref<TemporalDate | TemporalDate[] | undefined>
  placeholder: Ref<TemporalDate>
  pagedNavigation: Ref<boolean>
  preventDeselect: Ref<boolean>
  grid: Ref<Grid<TemporalDate>[]>
  weekDays: Ref<string[]>
  weekStartsOn: Ref<WeekStartsOn>
  weekdayFormat: Ref<WeekDayFormat>
  fixedWeeks: Ref<boolean>
  multiple: Ref<boolean>
  numberOfMonths: Ref<number>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  initialFocus: Ref<boolean>
  onDateChange: (date: TemporalDate) => void
  onPlaceholderChange: (date: TemporalDate) => void
  fullCalendarLabel: Ref<string>
  parentElement: Ref<HTMLElement | undefined>
  headingValue: Ref<string>
  isInvalid: Ref<boolean>
  isDateDisabled: Matcher
  isDateSelected: Matcher
  isDateUnavailable?: Matcher
  isOutsideVisibleView: (date: TemporalDate) => boolean
  prevPage: (prevPageFunc?: (date: TemporalDate) => TemporalDate) => void
  nextPage: (nextPageFunc?: (date: TemporalDate) => TemporalDate) => void
  isNextButtonDisabled: (nextPageFunc?: (date: TemporalDate) => TemporalDate) => boolean
  isPrevButtonDisabled: (prevPageFunc?: (date: TemporalDate) => TemporalDate) => boolean
  formatter: Formatter
  dir: Ref<Direction>
  disableDaysOutsideCurrentView: Ref<boolean>
  minValue: Ref<TemporalDate | undefined>
  maxValue: Ref<TemporalDate | undefined>
  isPlaceholderFocusable: Ref<boolean>
  firstFocusableDate: Ref<TemporalDate | undefined>
  hasSelectedDate: Ref<boolean>
  isSelectedDateDisabled: Ref<boolean>
}

export interface CalendarRootProps extends PrimitiveProps {
  /** The default value for the calendar */
  defaultValue?: TemporalDate
  /** The default placeholder date */
  defaultPlaceholder?: TemporalDate
  /** The placeholder date, which is used to determine what month to display when no date is selected */
  placeholder?: TemporalDate
  /** This property causes the previous and next buttons to navigate by the number of months displayed at once, rather than one month */
  pagedNavigation?: boolean
  /** Whether or not to prevent the user from deselecting a date without selecting another date first */
  preventDeselect?: boolean
  /** The day of the week to start the calendar on */
  weekStartsOn?: WeekStartsOn
  /** The format to use for the weekday strings provided via the weekdays slot prop */
  weekdayFormat?: WeekDayFormat
  /** The accessible label for the calendar */
  calendarLabel?: string
  /** Whether or not to always display 6 weeks in the calendar */
  fixedWeeks?: boolean
  /** The maximum date that can be selected */
  maxValue?: TemporalDate
  /** The minimum date that can be selected */
  minValue?: TemporalDate
  /** The locale to use for formatting dates */
  locale?: string
  /** The number of months to display at once */
  numberOfMonths?: number
  /** Whether the calendar is disabled */
  disabled?: boolean
  /** Whether the calendar is readonly */
  readonly?: boolean
  /** If true, the calendar will focus the selected day, today, or the first day of the month depending on what is visible when the calendar is mounted */
  initialFocus?: boolean
  /** A function that returns whether or not a date is disabled */
  isDateDisabled?: Matcher
  /** A function that returns whether or not a date is unavailable */
  isDateUnavailable?: Matcher
  /** The reading direction of the calendar when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** A function that returns the next page of the calendar. It receives the current placeholder as an argument inside the component. */
  nextPage?: (placeholder: TemporalDate) => TemporalDate
  /** A function that returns the previous page of the calendar. It receives the current placeholder as an argument inside the component. */
  prevPage?: (placeholder: TemporalDate) => TemporalDate
  /** The controlled selected value of the calendar */
  modelValue?: TemporalDate | TemporalDate[] | undefined
  /** Whether multiple dates can be selected */
  multiple?: boolean
  /** Whether or not to disable days outside the current view. */
  disableDaysOutsideCurrentView?: boolean
}

export type CalendarRootEmits = {
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: TemporalDate | undefined] | [dates: TemporalDate[]]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: TemporalDate]
}

export const [injectCalendarRootContext, provideCalendarRootContext]
  = createContext<CalendarRootContext>('CalendarRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, onMounted, toRefs, watch } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'

const props = withDefaults(defineProps<CalendarRootProps>(), {
  defaultValue: undefined,
  as: 'div',
  pagedNavigation: false,
  preventDeselect: false,
  weekdayFormat: 'narrow',
  fixedWeeks: false,
  multiple: false,
  numberOfMonths: 1,
  disabled: false,
  readonly: false,
  initialFocus: false,
  placeholder: undefined,
  isDateDisabled: undefined,
  isDateUnavailable: undefined,
  disableDaysOutsideCurrentView: false,
})
const emits = defineEmits<CalendarRootEmits>()
defineSlots<{
  default?: (props: {
    /** The current date of the placeholder */
    date: TemporalDate
    /** The grid of dates */
    grid: Grid<TemporalDate>[]
    /** The days of the week */
    weekDays: string[]
    /** The start of the week */
    weekStartsOn: WeekStartsOn
    /** The calendar locale */
    locale: string
    /** Whether or not to always display 6 weeks in the calendar */
    fixedWeeks: boolean
    /** The current date of the calendar */
    modelValue: TemporalDate | TemporalDate[] | undefined
  }) => any
}>()

const {
  disabled,
  readonly,
  initialFocus,
  pagedNavigation,
  weekdayFormat,
  fixedWeeks,
  multiple,
  minValue,
  maxValue,
  numberOfMonths,
  preventDeselect,
  isDateDisabled: propsIsDateDisabled,
  isDateUnavailable: propsIsDateUnavailable,
  calendarLabel,
  defaultValue,
  nextPage: propsNextPage,
  prevPage: propsPrevPage,
  dir: propDir,
  locale: propLocale,
  disableDaysOutsideCurrentView,
} = toRefs(props)

const { primitiveElement, currentElement: parentElement }
  = usePrimitiveElement()
const locale = useLocale(propLocale)
const dir = useDirection(propDir)
const weekStartsOn = computed(() => props.weekStartsOn ?? getWeekStartsOn(locale.value))

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: defaultValue.value,
  passive: (props.modelValue === undefined) as false,
})

const defaultDate = getDefaultDate({
  defaultPlaceholder: props.placeholder,
  defaultValue: modelValue.value,
  locale: props.locale,
})

const placeholder = useVModel(props, 'placeholder', emits, {
  defaultValue: props.defaultPlaceholder ?? defaultDate,
  passive: (props.placeholder === undefined) as false,
}) as Ref<TemporalDate>

function onPlaceholderChange(value: TemporalDate) {
  placeholder.value = value
}

const {
  fullCalendarLabel,
  headingValue,
  isDateDisabled,
  isDateUnavailable,
  isNextButtonDisabled,
  isPrevButtonDisabled,
  weekdays,
  isOutsideVisibleView,
  nextPage,
  prevPage,
  formatter,
  grid,
  isPlaceholderFocusable,
  firstFocusableDate,
} = useCalendar({
  locale,
  placeholder,
  weekStartsOn,
  fixedWeeks,
  numberOfMonths,
  minValue,
  maxValue,
  disabled,
  weekdayFormat,
  pagedNavigation,
  isDateDisabled: propsIsDateDisabled.value,
  isDateUnavailable: propsIsDateUnavailable.value,
  calendarLabel,
  nextPage: propsNextPage,
  prevPage: propsPrevPage,
})

const {
  isInvalid,
  isDateSelected,
  hasSelectedDate,
  isSelectedDateDisabled,
} = useCalendarState({
  date: modelValue,
  isDateDisabled,
  isDateUnavailable,
})

watch(modelValue, (_modelValue) => {
  if (Array.isArray(_modelValue) && _modelValue.length) {
    const lastValue = _modelValue.at(-1)
    if (lastValue && !isSameDay(placeholder.value, lastValue))
      onPlaceholderChange(lastValue)
  }
  else if (!Array.isArray(_modelValue) && _modelValue && !isSameDay(placeholder.value, _modelValue)) {
    onPlaceholderChange(_modelValue)
  }
})

function onDateChange(value: TemporalDate) {
  if (!multiple.value) {
    if (!modelValue.value) {
      modelValue.value = value
      return
    }

    if (!preventDeselect.value && isSameDay(modelValue.value as TemporalDate, value)) {
      placeholder.value = value
      modelValue.value = undefined
    }
    else { modelValue.value = value }
  }
  else {
    if (!modelValue.value) {
      modelValue.value = [value]
      return
    }

    const current = Array.isArray(modelValue.value) ? modelValue.value : [modelValue.value]
    const index = current.findIndex(date => isSameDay(date, value))
    if (index === -1) {
      modelValue.value = [...current, value]
    }
    else if (!preventDeselect.value) {
      const next = current.filter(date => !isSameDay(date, value))
      if (!next.length) {
        placeholder.value = value
        modelValue.value = undefined
        return
      }
      modelValue.value = next
    }
  }
}

onMounted(() => {
  if (initialFocus.value)
    handleCalendarInitialFocus(parentElement.value)
})

provideCalendarRootContext({
  isDateUnavailable,
  dir,
  isDateDisabled,
  locale,
  formatter,
  modelValue,
  placeholder,
  disabled,
  initialFocus,
  pagedNavigation,
  grid,
  weekDays: weekdays,
  weekStartsOn,
  weekdayFormat,
  fixedWeeks,
  multiple,
  numberOfMonths,
  readonly,
  preventDeselect,
  fullCalendarLabel,
  headingValue,
  isInvalid,
  isDateSelected,
  isNextButtonDisabled,
  isPrevButtonDisabled,
  isOutsideVisibleView,
  nextPage,
  prevPage,
  parentElement,
  onPlaceholderChange,
  onDateChange,
  disableDaysOutsideCurrentView,
  minValue,
  maxValue,
  isPlaceholderFocusable,
  firstFocusableDate,
  hasSelectedDate,
  isSelectedDateDisabled,
})
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as="as"
    :as-child="asChild"
    :aria-label="fullCalendarLabel"
    :data-readonly="readonly ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :data-invalid="isInvalid ? '' : undefined"
    :dir="dir"
  >
    <slot
      :date="placeholder"
      :grid="grid"
      :week-days="weekdays"
      :week-starts-on="weekStartsOn"
      :locale="locale"
      :fixed-weeks="fixedWeeks"
      :model-value="modelValue"
    />
    <div
      style="border: 0px; clip: rect(0px, 0px, 0px, 0px); clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: absolute; white-space: nowrap; width: 1px;"
    >
      <div
        role="heading"
        aria-level="2"
      >
        {{ fullCalendarLabel }}
      </div>
    </div>
  </Primitive>
</template>
