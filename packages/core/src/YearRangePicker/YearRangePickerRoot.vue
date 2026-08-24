<script lang="ts">
import type { DateValue } from '@internationalized/date'
import type { Ref } from 'vue'
import type { Grid, Matcher } from '@/date'
import type { PrimitiveProps } from '@/Primitive'
import type { Formatter } from '@/shared'
import type { DateRange } from '@/shared/date'
import type { Direction } from '@/shared/types'
import { isSameYear } from '@/date'
import { createContext, useDirection, useId, useKbd, useLocale } from '@/shared'
import { getDefaultDate, handleCalendarInitialFocus } from '@/shared/date'
import { useYearPicker } from '@/YearPicker/useYearPicker'
import { useRangeYearPickerState } from './useRangeYearPicker'

type YearRangePickerRootContext = {
  modelValue: Ref<DateRange>
  startValue: Ref<DateValue | undefined>
  endValue: Ref<DateValue | undefined>
  locale: Ref<string>
  placeholder: Ref<DateValue>
  preventDeselect: Ref<boolean>
  grid: Ref<Grid<DateValue>>
  disabled: Ref<boolean>
  readonly: Ref<boolean>
  initialFocus: Ref<boolean>
  onPlaceholderChange: (date: DateValue) => void
  fullCalendarLabel: Ref<string>
  parentElement: Ref<HTMLElement | undefined>
  headingValue: Ref<string>
  headingId: string
  isInvalid: Ref<boolean>
  isYearDisabled: Matcher
  isYearUnavailable?: Matcher | undefined
  allowNonContiguousRanges: Ref<boolean>
  highlightedRange: Ref<{ start: DateValue, end: DateValue } | null>
  focusedValue: Ref<DateValue | undefined>
  lastPressedDateValue: Ref<DateValue | undefined>
  isSelected: (date: DateValue) => boolean
  isSelectionEnd: (date: DateValue) => boolean
  isSelectionStart: (date: DateValue) => boolean
  isHighlightedStart: (date: DateValue) => boolean
  isHighlightedEnd: (date: DateValue) => boolean
  prevPage: (prevPageFunc?: (date: DateValue) => DateValue) => void
  nextPage: (nextPageFunc?: (date: DateValue) => DateValue) => void
  isNextButtonDisabled: (nextPageFunc?: (date: DateValue) => DateValue) => boolean
  isPrevButtonDisabled: (prevPageFunc?: (date: DateValue) => DateValue) => boolean
  formatter: Formatter
  dir: Ref<Direction>
  fixedDate: Ref<'start' | 'end' | undefined>
  maximumYears: Ref<number | undefined>
  minValue: Ref<DateValue | undefined>
  maxValue: Ref<DateValue | undefined>
  yearsPerPage: Ref<number>
}

export interface YearRangePickerRootProps extends PrimitiveProps {
  /** The default placeholder date */
  defaultPlaceholder?: DateValue | undefined
  /** The default value for the calendar */
  defaultValue?: DateRange | undefined
  /** The controlled selected year range of the year range picker. Can be bound as `v-model`. */
  modelValue?: DateRange | null | undefined
  /** The placeholder date, which is used to determine what year range to display when no date is selected. */
  placeholder?: DateValue | undefined
  /** When combined with `isYearUnavailable`, determines whether non-contiguous ranges may be selected. */
  allowNonContiguousRanges?: boolean | undefined
  /** Whether or not to prevent the user from deselecting a date without selecting another date first */
  preventDeselect?: boolean | undefined
  /** The maximum number of years that can be selected in a range */
  maximumYears?: number | undefined
  /** The accessible label for the calendar */
  calendarLabel?: string | undefined
  /** The maximum date that can be selected */
  maxValue?: DateValue | undefined
  /** The minimum date that can be selected */
  minValue?: DateValue | undefined
  /** The locale to use for formatting dates */
  locale?: string | undefined
  /** Whether or not the calendar is disabled */
  disabled?: boolean | undefined
  /** Whether or not the calendar is readonly */
  readonly?: boolean | undefined
  /** If true, the calendar will focus the selected year on mount */
  initialFocus?: boolean | undefined
  /** A function that returns whether or not a year is disabled */
  isYearDisabled?: Matcher | undefined
  /** A function that returns whether or not a year is unavailable */
  isYearUnavailable?: Matcher | undefined
  /** The reading direction of the calendar when applicable. */
  dir?: Direction | undefined
  /** A function that returns the next page of the calendar. */
  nextPage?: ((placeholder: DateValue) => DateValue) | undefined
  /** A function that returns the previous page of the calendar. */
  prevPage?: ((placeholder: DateValue) => DateValue) | undefined
  /** Which part of the range should be fixed */
  fixedDate?: 'start' | 'end' | undefined
  /** Number of years to display per page */
  yearsPerPage?: number | undefined
}

export type YearRangePickerRootEmits = {
  /** Event handler called whenever the model value changes */
  'update:modelValue': [date: DateRange]
  /** Event handler called whenever the placeholder value changes */
  'update:placeholder': [date: DateValue]
  /** Event handler called whenever the start value changes */
  'update:startValue': [date: DateValue | undefined]
}

export const [injectYearRangePickerRootContext, provideYearRangePickerRootContext]
  = createContext<YearRangePickerRootContext>('YearRangePickerRoot')
</script>

<script setup lang="ts">
import { useEventListener, useVModel } from '@vueuse/core'
import { computed, onMounted, ref, toRefs, watch } from 'vue'
import { Primitive, usePrimitiveElement } from '@/Primitive'

const props = withDefaults(defineProps<YearRangePickerRootProps>(), {
  defaultValue: () => ({ start: undefined, end: undefined }),
  as: 'div',
  preventDeselect: false,
  disabled: false,
  readonly: false,
  initialFocus: false,
  allowNonContiguousRanges: false,
  yearsPerPage: 12,
})
const emits = defineEmits<YearRangePickerRootEmits>()

defineSlots<{
  default?: ((props: {
    /** The current date of the placeholder */
    date: DateValue
    /** The grid of years */
    grid: Grid<DateValue>
    /** The calendar locale */
    locale: string
    /** The current date range */
    modelValue: DateRange
  }) => any) | undefined
}>()

const {
  disabled,
  readonly,
  initialFocus,
  preventDeselect,
  isYearUnavailable: propsIsYearUnavailable,
  isYearDisabled: propsIsYearDisabled,
  calendarLabel,
  maxValue,
  minValue,
  dir: propDir,
  locale: propLocale,
  nextPage: propsNextPage,
  prevPage: propsPrevPage,
  allowNonContiguousRanges,
  fixedDate,
  maximumYears,
  yearsPerPage,
} = toRefs(props)

const { primitiveElement, currentElement: parentElement } = usePrimitiveElement()
const dir = useDirection(propDir)
const locale = useLocale(propLocale)
const headingId = useId(undefined, 'reka-year-range-picker-heading')

const lastPressedDateValue = ref() as Ref<DateValue | undefined>
const focusedValue = ref() as Ref<DateValue | undefined>
const isEditing = ref(false)

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue ?? { start: undefined, end: undefined },
  passive: (props.modelValue === undefined) as false,
}) as Ref<DateRange | null>

const normalizeRange = (value?: DateRange | null): DateRange => value ?? { start: undefined, end: undefined }
const normalizedModelValue = computed(() => normalizeRange(modelValue.value))

const validModelValue = ref(normalizeRange(modelValue.value)) as Ref<DateRange>

const defaultDate = getDefaultDate({
  defaultPlaceholder: props.placeholder,
  defaultValue: normalizeRange(modelValue.value).start,
  locale: props.locale,
})

const startValue = ref(normalizeRange(modelValue.value).start) as Ref<DateValue | undefined>
const endValue = ref(normalizeRange(modelValue.value).end) as Ref<DateValue | undefined>

const placeholder = useVModel(props, 'placeholder', emits, {
  defaultValue: props.defaultPlaceholder ?? defaultDate.copy(),
  passive: (props.placeholder === undefined) as false,
}) as Ref<DateValue>

function onPlaceholderChange(value: DateValue) {
  placeholder.value = value.copy()
}

const {
  fullCalendarLabel,
  headingValue,
  isYearDisabled,
  isYearUnavailable,
  isNextButtonDisabled,
  isPrevButtonDisabled,
  grid,
  nextPage,
  prevPage,
  formatter,
} = useYearPicker({
  locale,
  placeholder,
  minValue,
  maxValue,
  disabled,
  yearsPerPage,
  isYearDisabled: propsIsYearDisabled,
  isYearUnavailable: propsIsYearUnavailable,
  calendarLabel,
  nextPage: propsNextPage,
  prevPage: propsPrevPage,
})

const {
  isInvalid,
  isSelected,
  highlightedRange,
  isSelectionStart,
  isSelectionEnd,
  isHighlightedStart,
  isHighlightedEnd,
  isYearDisabled: rangeIsYearDisabled,
} = useRangeYearPickerState({
  start: startValue,
  end: endValue,
  isYearDisabled,
  isYearUnavailable,
  focusedValue,
  allowNonContiguousRanges,
  fixedDate,
  maximumYears,
})

watch(modelValue, (_modelValue) => {
  const next = normalizeRange(_modelValue)

  const isStartSynced = (!next.start && !startValue.value)
    || (!!next.start && !!startValue.value && isSameYear(next.start, startValue.value))

  if (!isStartSynced) {
    startValue.value = next.start?.copy?.()
  }

  const isEndSynced = (!next.end && !endValue.value)
    || (!!next.end && !!endValue.value && isSameYear(next.end, endValue.value))

  if (!isEndSynced) {
    endValue.value = next.end?.copy?.()
  }
})

watch(startValue, (_startValue) => {
  if (_startValue && !isSameYear(_startValue, placeholder.value))
    onPlaceholderChange(_startValue)

  emits('update:startValue', _startValue)
})

watch([startValue, endValue], ([_startValue, _endValue]) => {
  const value = modelValue.value

  if (
    value
    && value.start
    && value.end
    && _startValue
    && _endValue
    && isSameYear(value.start, _startValue)
    && isSameYear(value.end, _endValue)
  ) {
    return
  }

  isEditing.value = true
  if (_endValue && _startValue) {
    const nextValue = _endValue.year < _startValue.year
      ? { start: _endValue.copy(), end: _startValue.copy() }
      : { start: _startValue.copy(), end: _endValue.copy() }

    modelValue.value = { start: nextValue.start, end: nextValue.end }
    isEditing.value = false
    validModelValue.value = { start: nextValue.start.copy(), end: nextValue.end.copy() }
  }
  else {
    modelValue.value = _startValue
      ? { start: _startValue.copy(), end: undefined }
      : { start: _endValue?.copy(), end: undefined }
  }
})

const kbd = useKbd()
useEventListener(parentElement, 'keydown', (ev) => {
  if (ev.key === kbd.ESCAPE && isEditing.value) {
    startValue.value = validModelValue.value.start?.copy()
    endValue.value = validModelValue.value.end?.copy()
  }
})

provideYearRangePickerRootContext({
  isYearUnavailable,
  startValue,
  endValue,
  formatter,
  modelValue: normalizedModelValue,
  placeholder,
  disabled,
  initialFocus,
  grid,
  readonly,
  preventDeselect,
  fullCalendarLabel,
  headingValue,
  headingId,
  isInvalid,
  isYearDisabled: rangeIsYearDisabled,
  allowNonContiguousRanges,
  highlightedRange,
  focusedValue,
  lastPressedDateValue,
  isSelected,
  isSelectionEnd,
  isSelectionStart,
  isNextButtonDisabled,
  isPrevButtonDisabled,
  nextPage,
  prevPage,
  parentElement,
  onPlaceholderChange,
  locale,
  dir,
  isHighlightedStart,
  isHighlightedEnd,
  fixedDate,
  maximumYears,
  minValue,
  maxValue,
  yearsPerPage,
})

onMounted(() => {
  if (initialFocus.value)
    handleCalendarInitialFocus(parentElement.value)
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

    <slot
      :date="placeholder"
      :grid="grid"
      :locale="locale"
      :model-value="normalizedModelValue"
    />
  </Primitive>
</template>
