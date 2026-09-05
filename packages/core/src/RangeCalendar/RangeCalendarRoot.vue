<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { ComputedRef, Ref } from 'vue'
import type { RangeCalendarChangeReason } from './useRangeCalendar'
import type { CalendarGridData, CalendarLayout, CalendarPageFunction, CalendarUnit, CalendarUnitAdapter, Matcher, WeekDayFormat, WeekStartsOn } from '@/date'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails, Formatter } from '@/shared'
import type { DateRange } from '@/shared/date'
import type { Direction } from '@/shared/types'
import { getWeekStartsOn } from '@/date'
import { createContext, useDirection, useId, useKbd, useLocale } from '@/shared'
import { handleCalendarInitialFocus } from '@/shared/date'

export interface RangeCalendarRootContext {
  locale: ComputedRef<string>
  dir: ComputedRef<Direction>
  disabled: ComputedRef<boolean>
  readonly: ComputedRef<boolean>
  initialFocus: ComputedRef<boolean>
  preventDeselect: ComputedRef<boolean>
  allowNonContiguousRanges: ComputedRef<boolean>
  disableDaysOutsideCurrentView: ComputedRef<boolean>
  fixedDate: ComputedRef<'start' | 'end' | undefined>
  /** Maximum inclusive range length in units of `granularity`. */
  maximumLength: ComputedRef<number | undefined>
  minValue: ComputedRef<DateValue | undefined>
  maxValue: ComputedRef<DateValue | undefined>
  /** The consumer's `isDateDisabled` matcher, before bounds and `disabled` are applied. */
  disabledMatcher: ComputedRef<Matcher | undefined>
  /** The committed range (an empty range while nothing is selected). */
  modelValue: ComputedRef<DateRange>
  startValue: Ref<DateValue | undefined>
  endValue: Ref<DateValue | undefined>
  focusedValue: Ref<DateValue | undefined>
  lastPressedDateValue: Ref<DateValue | undefined>
  isEditing: Ref<boolean>
  placeholder: ComputedRef<DateValue>
  view: ComputedRef<CalendarUnit>
  granularity: ComputedRef<CalendarUnit>
  maxView: ComputedRef<CalendarUnit>
  headingId: string
  parentElement: Ref<HTMLElement | undefined>
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
  isSelectedDisabled: ComputedRef<boolean>
  selectedFocusableDate: ComputedRef<DateValue | undefined>
  isPlaceholderFocusable: ComputedRef<boolean>
  firstFocusableDate: ComputedRef<DateValue | undefined>
  rowLength: ComputedRef<number>
  formatter: Formatter
  adapter: ComputedRef<CalendarUnitAdapter>
  /** At the granularity view this includes the `maximumLength` window; in coarser views it is the view's own rule. */
  isDateDisabled: Matcher
  isDateUnavailable: Matcher
  isDateHighlightable: Matcher
  highlightedRange: ComputedRef<{ start: DateValue, end: DateValue } | null>
  isSelected: (date: DateValue) => boolean
  isSelectionStart: (date: DateValue) => boolean
  isSelectionEnd: (date: DateValue) => boolean
  isHighlightedStart: (date: DateValue) => boolean
  isHighlightedEnd: (date: DateValue) => boolean
  isOutsideVisibleView: (date: DateValue) => boolean
  prevPage: (fn?: CalendarPageFunction) => void
  nextPage: (fn?: CalendarPageFunction) => void
  isPrevButtonDisabled: (fn?: CalendarPageFunction) => boolean
  isNextButtonDisabled: (fn?: CalendarPageFunction) => boolean
  /** Press a cell: extends / starts / clears the range at the granularity, drills down above it. */
  onDateChange: (date: DateValue, reason?: RangeCalendarChangeReason | BaseChangeReason, event?: Event) => void
  onPlaceholderChange: (date: DateValue, reason?: RangeCalendarChangeReason | BaseChangeReason, event?: Event) => boolean
  setFocusedValue: (date: DateValue | undefined) => void
  abortEditing: () => void
  setView: (view: CalendarUnit, reason?: RangeCalendarChangeReason | BaseChangeReason, event?: Event) => boolean
  drillUp: (reason?: RangeCalendarChangeReason | BaseChangeReason, event?: Event) => boolean
}

export interface RangeCalendarRootProps extends PrimitiveProps {
  /** The default placeholder date */
  defaultPlaceholder?: DateValue
  /** The default value for the calendar */
  defaultValue?: DateRange
  /** The controlled selected date range of the calendar. Can be bound as `v-model`. */
  modelValue?: DateRange | null
  /** The placeholder date, which is used to determine what page to display when no date is selected. This updates as the user navigates the calendar and can be used to programmatically control the calendar view */
  placeholder?: DateValue
  /** The controlled view: the unit the calendar currently shows. Can be bound as `v-model:view`. */
  view?: CalendarUnit
  /** The view shown initially. Defaults to `granularity`. */
  defaultView?: CalendarUnit
  /** The unit both ends of the range commit: a day, a month or a year. Views finer than this are unreachable. */
  granularity?: CalendarUnit
  /** The coarsest view `RangeCalendarViewTrigger` can switch to. */
  maxView?: CalendarUnit
  /** When combined with `isDateUnavailable`, determines whether non-contiguous ranges, i.e. ranges containing unavailable dates, may be selected. */
  allowNonContiguousRanges?: boolean
  /** This property causes the previous and next buttons to navigate by the number of months displayed at once, rather than one month */
  pagedNavigation?: boolean
  /** Whether or not to prevent the user from deselecting a date without selecting another date first */
  preventDeselect?: boolean
  /** The maximum length of the range (inclusive), counted in units of `granularity`: days, months or years. */
  maximumLength?: number
  /**
   * The maximum number of days in the range (inclusive). Alias of `maximumLength` for day ranges.
   * @deprecated Use `maximumLength`; removed in v4.
   */
  maximumDays?: number
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
  /** Whether or not the calendar is disabled */
  disabled?: boolean
  /** Whether or not the calendar is readonly */
  readonly?: boolean
  /** If true, the calendar will focus the selected day, today, or the first day of the month depending on what is visible when the calendar is mounted */
  initialFocus?: boolean
  /** A function that returns whether or not a date is disabled. Receives the unit of the cell being tested as its second argument. */
  isDateDisabled?: Matcher
  /** A function that returns whether or not a date is unavailable. Receives the unit of the cell being tested as its second argument. */
  isDateUnavailable?: Matcher
  /** A function that returns whether or not a date is highlightable */
  isDateHighlightable?: Matcher
  /** The reading direction of the calendar when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** A function that returns the next page of the calendar. It receives the current placeholder and the active view. */
  nextPage?: CalendarPageFunction
  /** A function that returns the previous page of the calendar. It receives the current placeholder and the active view. */
  prevPage?: CalendarPageFunction
  /** Whether or not to disable days outside the current view. */
  disableDaysOutsideCurrentView?: boolean
  /** Which part of the range should be fixed */
  fixedDate?: 'start' | 'end'
}

export type RangeCalendarRootEmits = {
  /** Event handler called before the model value changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:modelValue': [date: DateRange, details: ChangeEventDetails<RangeCalendarChangeReason>]
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: DateRange, details: ChangeEventDetails<RangeCalendarChangeReason>]
  /** Event handler called whenever there is a new validModel */
  'update:validModelValue': [date: DateRange]
  /** Event handler called before the placeholder changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:placeholder': [date: DateValue, details: ChangeEventDetails<RangeCalendarChangeReason>]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: DateValue, details: ChangeEventDetails<RangeCalendarChangeReason>]
  /** Event handler called whenever the start value changes */
  'update:startValue': [date: DateValue | undefined]
  /** Event handler called before the view changes; `details.cancel()` vetoes the change. */
  'beforeUpdate:view': [view: CalendarUnit, details: ChangeEventDetails<RangeCalendarChangeReason>]
  /** Event handler called whenever the view changes */
  'update:view': [view: CalendarUnit, details: ChangeEventDetails<RangeCalendarChangeReason>]
}

export const [injectRangeCalendarRootContext, provideRangeCalendarRootContext]
  = createContext<RangeCalendarRootContext>('RangeCalendarRoot')
</script>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { computed, onMounted, toRefs } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'
import { useRangeCalendar } from './useRangeCalendar'

const props = withDefaults(defineProps<RangeCalendarRootProps>(), {
  defaultValue: () => ({ start: undefined, end: undefined }),
  as: 'div',
  pagedNavigation: false,
  preventDeselect: false,
  weekdayFormat: 'narrow',
  fixedWeeks: false,
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
  isDateHighlightable: undefined,
  allowNonContiguousRanges: false,
  maximumLength: undefined,
  maximumDays: undefined,
  disableDaysOutsideCurrentView: false,
})
const emit = defineEmits<RangeCalendarRootEmits>()

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
    /** The current date range */
    modelValue: DateRange
    /** The active view */
    view: CalendarUnit
    /** The unit both ends of the range commit */
    granularity: CalendarUnit
  }) => any
}>()

const { dir: propDir, locale: propLocale } = toRefs(props)

const { primitiveElement, currentElement: parentElement } = usePrimitiveElement()
const dir = useDirection(propDir)
const locale = useLocale(propLocale)
const weekStartsOn = computed(() => props.weekStartsOn ?? getWeekStartsOn(locale.value))
const headingId = useId(undefined, 'reka-range-calendar-heading')

const { root, context, placeholder, grid, weekDays, modelValue, view, granularity, fullCalendarLabel } = useRangeCalendar({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  placeholder: () => props.placeholder,
  defaultPlaceholder: props.defaultPlaceholder,
  view: () => props.view,
  defaultView: props.defaultView,
  granularity: () => props.granularity,
  maxView: () => props.maxView,
  allowNonContiguousRanges: () => props.allowNonContiguousRanges,
  preventDeselect: () => props.preventDeselect,
  maximumLength: () => props.maximumLength ?? props.maximumDays,
  fixedDate: () => props.fixedDate,
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
  isDateDisabled: computed(() => props.isDateDisabled),
  isDateUnavailable: computed(() => props.isDateUnavailable),
  isDateHighlightable: computed(() => props.isDateHighlightable),
  calendarLabel: () => props.calendarLabel,
  nextPage: computed(() => props.nextPage),
  prevPage: computed(() => props.prevPage),
  headingId,
  parentElement,
  emit,
})

provideRangeCalendarRootContext(context)

// DOM-bound: Escape while editing restores the last valid range.
const kbd = useKbd()
useEventListener(parentElement, 'keydown', (event) => {
  if (event.key === kbd.ESCAPE)
    context.abortEditing()
})

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
  </Primitive>
</template>
