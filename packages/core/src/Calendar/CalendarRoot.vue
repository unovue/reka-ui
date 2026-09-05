<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { ComputedRef, Ref } from 'vue'
import type { CalendarChangeReason, CalendarModelValue } from './useCalendar'
import type { CalendarGridData, CalendarLayout, CalendarPageFunction, CalendarUnit, CalendarUnitAdapter, Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails, Formatter } from '@/shared'
import type { Direction } from '@/shared/types'
import { getWeekStartsOn } from '@/date'
import { createContext, useDirection, useId, useLocale } from '@/shared'
import { handleCalendarInitialFocus } from '@/shared/date'

export interface CalendarRootContext {
  locale: ComputedRef<string>
  dir: ComputedRef<Direction>
  disabled: ComputedRef<boolean>
  readonly: ComputedRef<boolean>
  initialFocus: ComputedRef<boolean>
  multiple: ComputedRef<boolean>
  preventDeselect: ComputedRef<boolean>
  disableDaysOutsideCurrentView: ComputedRef<boolean>
  minValue: ComputedRef<DateValue | undefined>
  maxValue: ComputedRef<DateValue | undefined>
  /** The consumer's `isDateDisabled` matcher, before bounds and `disabled` are applied. */
  disabledMatcher: ComputedRef<Matcher | undefined>
  modelValue: ComputedRef<CalendarModelValue>
  placeholder: ComputedRef<DateValue>
  /** The active view, clamped into `[granularity, maxView]`. */
  view: ComputedRef<CalendarUnit>
  granularity: ComputedRef<CalendarUnit>
  maxView: ComputedRef<CalendarUnit>
  /** Id of the visually hidden heading; grids point `aria-labelledby` at it. */
  headingId: string
  parentElement: Ref<HTMLElement | undefined>
  /** The rendered page(s) of the active view. */
  grid: Ref<CalendarGridData[]>
  weekDays: ComputedRef<string[]>
  weekStartsOn: ComputedRef<WeekStartsOn>
  weekdayFormat: ComputedRef<WeekDayFormat>
  fixedWeeks: ComputedRef<boolean>
  numberOfMonths: ComputedRef<number>
  pagedNavigation: ComputedRef<boolean>
  layout: ComputedRef<CalendarLayout>
  headingValue: ComputedRef<string>
  fullCalendarLabel: ComputedRef<string>
  isInvalid: ComputedRef<boolean>
  hasSelectedDate: ComputedRef<boolean>
  isSelectedDateDisabled: ComputedRef<boolean>
  isPlaceholderFocusable: ComputedRef<boolean>
  firstFocusableDate: ComputedRef<DateValue | undefined>
  /** Up/down keyboard stride of the active view. */
  rowLength: ComputedRef<number>
  formatter: Formatter
  /** Adapter of the active view. */
  adapter: ComputedRef<CalendarUnitAdapter>
  /** Evaluated at the active view's unit. */
  isDateDisabled: Matcher
  isDateUnavailable: Matcher
  /** Evaluated at the granularity. */
  isDateSelected: Matcher
  isOutsideVisibleView: (date: DateValue) => boolean
  prevPage: (fn?: CalendarPageFunction) => void
  nextPage: (fn?: CalendarPageFunction) => void
  isPrevButtonDisabled: (fn?: CalendarPageFunction) => boolean
  isNextButtonDisabled: (fn?: CalendarPageFunction) => boolean
  /** Select a cell: commits at the granularity, drills down above it. */
  onDateChange: (date: DateValue, reason?: CalendarChangeReason | BaseChangeReason, event?: Event) => void
  onPlaceholderChange: (date: DateValue, reason?: CalendarChangeReason | BaseChangeReason, event?: Event) => boolean
  setView: (view: CalendarUnit, reason?: CalendarChangeReason | BaseChangeReason, event?: Event) => boolean
  drillUp: (reason?: CalendarChangeReason | BaseChangeReason, event?: Event) => boolean
}

export interface CalendarRootProps extends PrimitiveProps {
  /** The default value for the calendar */
  defaultValue?: DateValue | DateValue[]
  /** The default placeholder date */
  defaultPlaceholder?: DateValue
  /** The placeholder date, which is used to determine what page to display when no date is selected */
  placeholder?: DateValue
  /** The controlled view: the unit the calendar currently shows. Can be bound as `v-model:view`. */
  view?: CalendarUnit
  /** The view shown initially. Defaults to `granularity`. */
  defaultView?: CalendarUnit
  /** The unit a selection commits: a day, a month or a year. Views finer than this are unreachable. */
  granularity?: CalendarUnit
  /** The coarsest view `CalendarViewTrigger` can switch to. */
  maxView?: CalendarUnit
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
  maxValue?: DateValue
  /** The minimum date that can be selected */
  minValue?: DateValue
  /** The locale to use for formatting dates */
  locale?: string
  /** The number of months to display at once in the day view */
  numberOfMonths?: number
  /** The number of years to display per page in the year view */
  yearsPerPage?: number
  /** The number of cells per row in the month and year views */
  columns?: number
  /** Whether the calendar is disabled */
  disabled?: boolean
  /** Whether the calendar is readonly */
  readonly?: boolean
  /** If true, the calendar will focus the selected day, today, or the first day of the month depending on what is visible when the calendar is mounted */
  initialFocus?: boolean
  /** A function that returns whether or not a date is disabled. Receives the unit of the cell being tested as its second argument. */
  isDateDisabled?: Matcher
  /** A function that returns whether or not a date is unavailable. Receives the unit of the cell being tested as its second argument. */
  isDateUnavailable?: Matcher
  /** The reading direction of the calendar when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** A function that returns the next page of the calendar. It receives the current placeholder and the active view. */
  nextPage?: CalendarPageFunction
  /** A function that returns the previous page of the calendar. It receives the current placeholder and the active view. */
  prevPage?: CalendarPageFunction
  /** The controlled selected date value of the calendar. Can be bound as `v-model`. */
  modelValue?: DateValue | DateValue[] | null
  /** Whether multiple dates can be selected */
  multiple?: boolean
  /** Whether or not to disable days outside the current view. */
  disableDaysOutsideCurrentView?: boolean
}

export type CalendarRootEmits = {
  /** Event handler called before the model value changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [date: CalendarModelValue, details: ChangeEventDetails<CalendarChangeReason>]
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: CalendarModelValue, details: ChangeEventDetails<CalendarChangeReason>]
  /** Event handler called before the placeholder changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:placeholder': [date: DateValue, details: ChangeEventDetails<CalendarChangeReason>]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: DateValue, details: ChangeEventDetails<CalendarChangeReason>]
  /** Event handler called before the view changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:view': [view: CalendarUnit, details: ChangeEventDetails<CalendarChangeReason>]
  /** Event handler called whenever the view changes */
  'update:view': [view: CalendarUnit, details: ChangeEventDetails<CalendarChangeReason>]
}

export const [injectCalendarRootContext, provideCalendarRootContext]
  = createContext<CalendarRootContext>('CalendarRoot')
</script>

<script setup lang="ts">
import { computed, onMounted, toRefs } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { useCalendar } from './useCalendar'

const props = withDefaults(defineProps<CalendarRootProps>(), {
  defaultValue: undefined,
  as: 'div',
  pagedNavigation: false,
  preventDeselect: false,
  weekdayFormat: 'narrow',
  fixedWeeks: false,
  multiple: false,
  numberOfMonths: 1,
  yearsPerPage: 12,
  columns: 4,
  granularity: 'day',
  maxView: 'year',
  view: undefined,
  defaultView: undefined,
  disabled: false,
  readonly: false,
  initialFocus: false,
  placeholder: undefined,
  isDateDisabled: undefined,
  isDateUnavailable: undefined,
  disableDaysOutsideCurrentView: false,
})
const emit = defineEmits<CalendarRootEmits>()
defineSlots<{
  default?: (props: {
    /** The current date of the placeholder */
    date: DateValue
    /** The rendered page(s) of the active view */
    grid: CalendarGridData[]
    /** The days of the week (day view only) */
    weekDays: string[]
    /** The start of the week */
    weekStartsOn: WeekStartsOn
    /** The calendar locale */
    locale: string
    /** Whether or not to always display 6 weeks in the calendar */
    fixedWeeks: boolean
    /** The current value of the calendar */
    modelValue: CalendarModelValue
    /** The active view */
    view: CalendarUnit
    /** The unit a selection commits */
    granularity: CalendarUnit
  }) => any
}>()

const { dir: propDir, locale: propLocale } = toRefs(props)

const { primitiveElement, currentElement: parentElement } = usePrimitiveElement()
const locale = useLocale(propLocale)
const dir = useDirection(propDir)
const weekStartsOn = computed(() => props.weekStartsOn ?? getWeekStartsOn(locale.value))
const headingId = useId(undefined, 'reka-calendar-heading')

// Controlled/uncontrolled + `beforeUpdate:` / `update:` emits for the model,
// the placeholder and the view live in the composable's `useControllableState`.
const { root, context, placeholder, grid, weekDays, modelValue, view, granularity, fullCalendarLabel } = useCalendar({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  placeholder: () => props.placeholder,
  defaultPlaceholder: props.defaultPlaceholder,
  view: () => props.view,
  defaultView: props.defaultView,
  granularity: () => props.granularity,
  maxView: () => props.maxView,
  multiple: () => props.multiple,
  preventDeselect: () => props.preventDeselect,
  disabled: () => props.disabled,
  readonly: () => props.readonly,
  initialFocus: () => props.initialFocus,
  disableDaysOutsideCurrentView: () => props.disableDaysOutsideCurrentView,
  locale,
  dir,
  weekStartsOn,
  weekdayFormat: () => props.weekdayFormat,
  fixedWeeks: () => props.fixedWeeks,
  numberOfMonths: () => props.numberOfMonths,
  pagedNavigation: () => props.pagedNavigation,
  yearsPerPage: () => props.yearsPerPage,
  columns: () => props.columns,
  minValue: () => props.minValue,
  maxValue: () => props.maxValue,
  isDateDisabled: () => props.isDateDisabled,
  isDateUnavailable: () => props.isDateUnavailable,
  calendarLabel: () => props.calendarLabel,
  nextPage: () => props.nextPage,
  prevPage: () => props.prevPage,
  headingId,
  parentElement,
  emit,
})

provideCalendarRootContext(context)

onMounted(() => {
  if (props.initialFocus)
    handleCalendarInitialFocus(parentElement.value)
})
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as="as"
    :as-child="asChild"
    v-bind="root.attrs.value"
  >
    <slot
      :date="placeholder"
      :grid="grid"
      :week-days="weekDays"
      :week-starts-on="weekStartsOn"
      :locale="locale"
      :fixed-weeks="fixedWeeks"
      :model-value="modelValue"
      :view="view"
      :granularity="granularity"
    />
    <div
      style="border: 0px; clip: rect(0px, 0px, 0px, 0px); clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: absolute; white-space: nowrap; width: 1px;"
    >
      <div
        :id="headingId"
        role="heading"
        aria-level="2"
      >
        {{ fullCalendarLabel }}
      </div>
    </div>
  </Primitive>
</template>
